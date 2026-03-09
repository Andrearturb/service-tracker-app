"""
Rotas relacionadas à importação de planilhas.

Este módulo define a rota responsável por receber um arquivo Excel,
executar a importação dos dados e devolver um resumo do processo.
"""

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import IMPORT_ADMIN_PASSWORD
from app.db.session import get_db
from app.schemas.upload import UploadResponse
from app.services.importer import importar_servicos

router = APIRouter(prefix="/imports", tags=["Imports"])


def validar_senha_importacao(import_password: str | None) -> None:
    """
    Valida a senha administrativa da importação.

    Se a senha estiver ausente ou incorreta, a requisição é bloqueada.
    """
    if not import_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha de importação não informada.",
        )

    if import_password != IMPORT_ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha de importação inválida.",
        )


@router.post(
    "/excel",
    response_model=UploadResponse,
    status_code=status.HTTP_200_OK,
)
async def importar_planilha_excel(
    file: UploadFile = File(...),
    import_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Recebe uma planilha Excel e executa a importação dos serviços.

    Regras:
    - aceita arquivos .xlsx e .xls;
    - exige senha administrativa no header 'import-password';
    - lê o conteúdo do arquivo;
    - delega o tratamento e a persistência para o serviço de importação.
    """
    validar_senha_importacao(import_password)

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