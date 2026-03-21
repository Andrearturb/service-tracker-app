"""
Configuração da conexão com o banco de dados.

Este módulo cria a conexão principal com o banco, define a fábrica de
sessões e disponibiliza uma função auxiliar para uso nas rotas da API.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL


engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


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
