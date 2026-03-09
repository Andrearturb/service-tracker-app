"""
Rotas relacionadas à importação de planilhas.

Este módulo define a rota responsável por receber um arquivo Excel,
executar a importação dos dados e devolver um resumo do processo.
A importação é protegida por autenticação administrativa.
"""

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import ADMIN_TOKEN
from app.db.session import get_db
from app.schemas.upload import UploadResponse
from app.services.importer import importar_servicos

router = APIRouter(prefix="/imports", tags=["Imports"])


def validar_token_admin(authorization: str | None) -> None:
    """
    Valida o token administrativo enviado no header Authorization.

    Formato esperado:
    Authorization: Bearer <token>
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token administrativo não informado.",
        )

    prefix = "Bearer "

    if not authorization.startswith(prefix):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato do token inválido.",
        )

    token = authorization[len(prefix):].strip()

    if token != ADMIN_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token administrativo inválido.",
        )


@router.post(
    "/excel",
    response_model=UploadResponse,
    status_code=status.HTTP_200_OK,
)
async def importar_planilha_excel(
    file: UploadFile = File(...),
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> UploadResponse:
    """
    Recebe uma planilha Excel e executa a importação dos serviços.

    Regras:
    - aceita arquivos .xlsx e .xls;
    - exige token administrativo no header Authorization;
    - lê o conteúdo do arquivo;
    - delega o tratamento e a persistência para o serviço de importação.
    """
    validar_token_admin(authorization)

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