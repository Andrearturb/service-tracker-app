"""
Serviço de importação da planilha Excel.

Este módulo é responsável por:
- ler o arquivo Excel;
- selecionar e renomear as colunas necessárias;
- tratar os campos especiais da planilha;
- criar o registro de upload;
- apagar os serviços antigos;
- salvar a nova carga no banco de dados.
"""

from __future__ import annotations
import re


import json
from datetime import datetime
from io import BytesIO

import pandas as pd
from sqlalchemy.orm import Session

from app.core.status import (
    STATUS_BACKLOG,
    STATUS_EM_ATENDIMENTO,
    STATUS_AGENDADO,
    STATUS_COMPLETA,
    STATUS_NAO_APROVADO,
)
from app.models.service import Service
from app.models.upload import Upload


COLUMN_MAPPING = {
    "Tikcket": "ticket",
    "Status": "status",
    "Local de Atendimento": "raw_location",
    "Praça": "praca",
    "Descrição do Serviço - Text": "service_description",
    "Fornecedor": "supplier",
    "Data da Visita": "visit_date",
    "Solução - Text": "solution_text",
    "Status da Assinatura": "raw_signature",
    "Created on": "created_on",
}


def normalizar_texto(valor: object) -> str | None:
    """
    Converte valores textuais para string limpa.

    Regras:
    - se for nulo, retorna None;
    - remove espaços extras no início e no fim;
    - se a string ficar vazia, retorna None.
    """
    if pd.isna(valor):
        return None

    texto = str(valor).strip()

    if not texto:
        return None

    return texto


def converter_data(valor: object) -> datetime | None:
    """
    Converte um valor em data/hora, quando possível.

    Se o valor estiver vazio ou não puder ser convertido,
    retorna None.
    """
    if pd.isna(valor):
        return None

    data_convertida = pd.to_datetime(valor, errors="coerce")

    if pd.isna(data_convertida):
        return None

    return data_convertida.to_pydatetime()

def limpar_nome_fornecedor(valor: object) -> str | None:
    """
    Remove CPF ou CNPJ do nome do fornecedor.

    Exemplos:
    - 'Fornecedor XPTO - CNPJ: 12.345.678/0001-90' -> 'Fornecedor XPTO'
    - 'Maria da Silva - CPF: 123.456.789-00' -> 'Maria da Silva'
    """
    texto = normalizar_texto(valor)

    if texto is None:
        return None

    texto = re.sub(
        r"\s*[-|/]*\s*(CPF|CNPJ)\s*:\s*[\d./-]+",
        "",
        texto,
        flags=re.IGNORECASE,
    )

    texto = re.sub(r"\s{2,}", " ", texto).strip(" -|/")

    return texto or None

def normalizar_praca(valor: object) -> str | None:
    """
    Normaliza a praça conforme a regra do projeto.

    Regras:
    - 'Brasil' passa a ser 'Escritório';
    - 'Escritório' original da planilha não deve ser importado;
    - valores vazios retornam None;
    - demais valores são mantidos.
    """
    praca = normalizar_texto(valor)

    if praca is None:
        return None

    praca_normalizada = praca.strip().lower()

    # Não importar o "Escritório" original da planilha
    if praca_normalizada in {"escritório", "escritorio"}:
        return None

    # "Brasil" deve aparecer no sistema como "Escritório"
    if praca_normalizada == "brasil":
        return "Escritório"

    return praca

def normalizar_status(
    status_original: object,
    supplier: str | None,
    visit_date: datetime | None,
) -> str | None:
    """
    Define o status final enviado ao front.

    Ordem de prioridade:
    1. Completa -> quando status original for finalizado/concluído
    2. Não aprovado -> quando status original for 'Não Aprovado'
    3. Agendado -> quando houver fornecedor e data de visita
    4. Em atendimento -> quando houver fornecedor ou status original for 'Em Atendimento'
    5. BackLog -> quando status original for 'Em Aberto'
    6. Caso contrário, mantém o status original
    """
    status_limpo = normalizar_texto(status_original)

    if status_limpo is None:
        if supplier and visit_date:
            return "Agendado"

        if supplier:
            return "Em atendimento"

        return None

    status_normalizado = status_limpo.lower().strip()

    if status_normalizado in {
        "solicitação finalizada",
        "solicitacao finalizada",
        "chamado concluído",
        "chamado concluido",
        "completa",
    }:
        return "Completa"

    if status_normalizado == "não aprovado" or status_normalizado == "nao aprovado":
        return "Não aprovado"

    if supplier and visit_date:
        return "Agendado"

    if supplier or status_normalizado == "em atendimento":
        return "Em atendimento"

    if status_normalizado == "em aberto":
        return "BackLog"

    return status_limpo

def tratar_local_atendimento(valor: object) -> dict[str, str | None]:
    """
    Trata o campo de local de atendimento.

    Formato esperado:
    'Local | BCPS: número | SAP: número'

    Exemplo:
    'Ceará-Mirim | BCPS: 21270 | SAP: 4052'

    Se o valor vier fora do padrão, o sistema:
    - mantém o valor bruto em store_name;
    - deixa bpcs_number e sap_number como None.
    """
    texto = normalizar_texto(valor)

    if texto is None:
        return {
            "store_name": None,
            "bpcs_number": None,
            "sap_number": None,
        }

    partes = [parte.strip() for parte in texto.split("|")]

    if len(partes) != 3:
        return {
            "store_name": texto,
            "bpcs_number": None,
            "sap_number": None,
        }

    store_name = partes[0]

    bpcs_number = partes[1].replace("BCPS:", "").strip()
    sap_number = partes[2].replace("SAP:", "").strip()

    return {
        "store_name": store_name or None,
        "bpcs_number": bpcs_number or None,
        "sap_number": sap_number or None,
    }


def tratar_status_assinatura(valor: object) -> dict[str, str | None]:
    """
    Trata o campo de status da assinatura.

    Casos esperados:
    - vazio;
    - lista JSON com status 'pendente';
    - lista JSON com status 'completo'.

    Exemplos:
    '[{"status":"pendente", ...}]'
    '[{"status":"completo","url_pdf_assinado":"https://..."}]'

    Se houver erro de leitura, retorna ambos como None.
    """
    texto = normalizar_texto(valor)

    if texto is None:
        return {
            "signature_status": None,
            "signed_pdf_url": None,
        }

    try:
        dados = json.loads(texto)
    except json.JSONDecodeError:
        return {
            "signature_status": None,
            "signed_pdf_url": None,
        }

    if not isinstance(dados, list) or not dados:
        return {
            "signature_status": None,
            "signed_pdf_url": None,
        }

    primeiro_item = dados[0]

    if not isinstance(primeiro_item, dict):
        return {
            "signature_status": None,
            "signed_pdf_url": None,
        }

    signature_status = normalizar_texto(primeiro_item.get("status"))
    signed_pdf_url = normalizar_texto(primeiro_item.get("url_pdf_assinado"))

    return {
        "signature_status": signature_status,
        "signed_pdf_url": signed_pdf_url,
    }


def ler_planilha_excel(file_bytes: bytes) -> pd.DataFrame:
    """
    Lê o arquivo Excel e retorna um DataFrame com as colunas necessárias.

    A leitura é feita a partir dos nomes reais das colunas.
    """
    buffer = BytesIO(file_bytes)

    dataframe = pd.read_excel(buffer)

    colunas_esperadas = list(COLUMN_MAPPING.keys())
    colunas_ausentes = [
        coluna for coluna in colunas_esperadas if coluna not in dataframe.columns
    ]

    if colunas_ausentes:
        raise ValueError(
            "A planilha não contém todas as colunas esperadas. "
            f"Colunas ausentes: {', '.join(colunas_ausentes)}"
        )

    dataframe = dataframe[colunas_esperadas].rename(columns=COLUMN_MAPPING)

    return dataframe


def montar_objeto_service(
    linha: dict[str, object],
    upload_id: int,
) -> Service | None:
    """
    Converte uma linha da planilha em um objeto Service.

    Regras:
    - se não houver ticket, a linha é descartada;
    - se a praça for o "Escritório" original da planilha, a linha é descartada;
    - se a praça for "Brasil", ela passa a ser "Escritório".
    """
    ticket = normalizar_texto(linha.get("ticket"))

    if ticket is None:
        return None

    praca = normalizar_praca(linha.get("praca"))

    # Se a regra da praça mandar ignorar, a linha não é importada
    if praca is None:
        return None

    location_data = tratar_local_atendimento(linha.get("raw_location"))
    signature_data = tratar_status_assinatura(linha.get("raw_signature"))

    supplier = limpar_nome_fornecedor(linha.get("supplier"))
    visit_date = converter_data(linha.get("visit_date"))
    status = normalizar_status(
        status_original=linha.get("status"),
        supplier=supplier,
        visit_date=visit_date,
    )

    return Service(
        ticket=ticket,
        status=status,
        store_name=location_data["store_name"],
        bpcs_number=location_data["bpcs_number"],
        sap_number=location_data["sap_number"],
        praca=praca,
        service_description=normalizar_texto(linha.get("service_description")),
        supplier=supplier,
        visit_date=visit_date,
        solution_text=normalizar_texto(linha.get("solution_text")),
        signature_status=signature_data["signature_status"],
        signed_pdf_url=signature_data["signed_pdf_url"],
        created_on=converter_data(linha.get("created_on")),
        upload_id=upload_id,
    )


def importar_servicos(
    db: Session,
    file_bytes: bytes,
    source_file_name: str | None,
) -> dict[str, object]:
    """
    Executa a importação completa da planilha.

    Fluxo:
    1. lê a planilha;
    2. monta os objetos válidos;
    3. cria o registro de upload;
    4. apaga os serviços antigos;
    5. salva a nova carga;
    6. retorna um resumo da importação.
    """
    dataframe = ler_planilha_excel(file_bytes)

    upload = Upload(
        source_file_name=source_file_name,
        total_rows=0,
    )
    db.add(upload)
    db.flush()

    services: list[Service] = []
    registros = dataframe.to_dict(orient="records")

    for linha in registros:
        service = montar_objeto_service(linha, upload.id)

        if service is not None:
            services.append(service)

    upload.total_rows = len(services)

    db.query(Service).delete()

    db.add_all(services)
    db.commit()
    db.refresh(upload)

    return {
        "message": "Importação concluída com sucesso.",
        "total_rows": upload.total_rows,
        "upload_data": upload.uploaded_at,
        "source_file_name": upload.source_file_name,
    }

