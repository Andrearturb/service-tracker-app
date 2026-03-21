"""
Rotas relacionadas à importação de dados.

Este módulo define as rotas responsáveis por:
- receber um arquivo Excel;
- receber dados estruturados em JSON;
- executar a importação dos dados;
- devolver um resumo do processo.

A importação é protegida por API Key.
"""

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import API_KEY
from app.db.session import get_db
from app.schemas.import_json import ServiceImportPayload
from app.schemas.upload import UploadResponse
from app.services.importer import importar_servicos, importar_servicos_json

router = APIRouter(prefix="/imports", tags=["Imports"])


def validar_api_key(x_api_key: str | None) -> None:
    """
    Valida a API Key enviada no header x-api-key.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key não informada.",
        )

    if x_api_key != API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key inválida.",
        )


@router.post(
    "/excel",
    response_model=UploadResponse,
    status_code=status.HTTP_200_OK,
)
async def importar_planilha_excel(
    file: UploadFile = File(...),
    x_api_key: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Recebe uma planilha Excel e executa a importação dos serviços.

    Regras:
    - aceita arquivos .xlsx e .xls;
    - exige API Key no header x-api-key;
    - lê o conteúdo do arquivo;
    - delega o tratamento e a persistência para o serviço de importação.
    """
    validar_api_key(x_api_key)

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum arquivo foi enviado.",
        )

    nome_arquivo = file.filename.lower()

    if not nome_arquivo.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo inválido. Envie uma planilha Excel (.xlsx ou .xls).",
        )

    try:
        file_bytes = await file.read()

        resultado = importar_servicos(
            db=db,
            file_bytes=file_bytes,
            source_file_name=file.filename,
        )

        return UploadResponse(**resultado)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro ao importar a planilha.",
        ) from error


@router.post(
    "/json",
    response_model=UploadResponse,
    status_code=status.HTTP_200_OK,
)
def importar_json(
    payload: ServiceImportPayload,
    x_api_key: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Recebe dados estruturados em JSON e executa a importação dos serviços.
    """
    validar_api_key(x_api_key)

    try:
        items = [item.model_dump() for item in payload.items]

        resultado = importar_servicos_json(
            db=db,
            items=items,
            source_name=payload.source_name,
        )

        return UploadResponse(**resultado)

    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocorreu um erro ao importar o JSON.",
        ) from error