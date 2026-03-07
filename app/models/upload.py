"""
Modelo da tabela de importações.

Este módulo define a estrutura da tabela responsável por armazenar
informações sobre cada upload realizado no sistema.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Upload(Base):
    """
    Representa um registro de importação da planilha.
    """

    __tablename__ = "uploads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    source_file_name: Mapped[str | None] = mapped_column(
        String,
        nullable=True,
    )
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False)
