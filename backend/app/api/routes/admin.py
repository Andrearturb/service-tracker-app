"""
Rotas administrativas.

Este módulo define a autenticação simples da área administrativa.
No momento, o login valida uma senha fixa e devolve um token simples.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.config import ADMIN_PASSWORD, ADMIN_TOKEN

router = APIRouter(prefix="/admin", tags=["Admin"])


class AdminLoginRequest(BaseModel):
    """
    Corpo da requisição de login administrativo.
    """

    password: str


class AdminLoginResponse(BaseModel):
    """
    Resposta devolvida após login administrativo bem-sucedido.
    """

    message: str
    token: str


@router.post(
    "/login",
    response_model=AdminLoginResponse,
    status_code=status.HTTP_200_OK,
)
def admin_login(payload: AdminLoginRequest) -> AdminLoginResponse:
    """
    Valida a senha administrativa.

    Se a senha estiver correta, devolve um token simples que será
    usado pelo front para autorizar a importação da planilha.
    """
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha administrativa inválida.",
        )

    return AdminLoginResponse(
        message="Login administrativo realizado com sucesso.",
        token=ADMIN_TOKEN,
    )