"""
Ponto de entrada da aplicação.

Este módulo cria a instância principal do FastAPI, registra as rotas
e garante a criação das tabelas no banco de dados.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.imports import router as imports_router
from app.api.routes.services import router as services_router
from app.core.config import APP_NAME, APP_VERSION
from app.db.base import Base
from app.db.session import engine

# Importa os models para que o SQLAlchemy reconheça as tabelas
from app.models.service import Service  # noqa: F401
from app.models.upload import Upload  # noqa: F401

# Instância principal da aplicação
app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
)

# Libera acesso do front local ao backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://frontend:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Comprime respostas grandes
app.add_middleware(
    GZipMiddleware,
    minimum_size=1000,
)


@app.on_event("startup")
def on_startup() -> None:
    """
    Cria as tabelas no banco de dados ao iniciar a aplicação.
    """
    Base.metadata.create_all(bind=engine)


# Registro das rotas da aplicação

app.include_router(health_router)
app.include_router(imports_router)
app.include_router(services_router)