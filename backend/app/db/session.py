"""
Configuração da conexão com o banco de dados.

Este módulo cria a conexão principal com o banco, define a fábrica de
sessões e disponibiliza uma função auxiliar para uso nas rotas da API.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import DATABASE_URL

# Cria a conexão principal com o banco de dados
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# Cria uma fábrica de sessões para interação com o banco
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    """
    Fornece uma sessão do banco de dados para uso nas rotas.

    A sessão é aberta no início da requisição e fechada ao final.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
