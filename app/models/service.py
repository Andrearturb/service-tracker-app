"""
Modelo da tabela de serviços.

Este módulo define a estrutura da tabela principal do sistema, responsável
por armazenar os dados dos serviços importados da planilha após tratamento.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Service(Base):
    """
    Representa um serviço importado da planilha.
    """

    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    ticket: Mapped[str] = mapped_column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )
    status: Mapped[str | None] = mapped_column(String, nullable=True)

    store_name: Mapped[str | None] = mapped_column(String, nullable=True)
    bpcs_number: Mapped[str | None] = mapped_column(String, nullable=True)
    sap_number: Mapped[str | None] = mapped_column(String, nullable=True)
    praca: Mapped[str | None] = mapped_column(String, nullable=True)

    service_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    supplier: Mapped[str | None] = mapped_column(String, nullable=True)
    visit_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )
    solution_text: Mapped[str | None] = mapped_column(Text, nullable=True)

    signature_status: Mapped[str | None] = mapped_column(String, nullable=True)
    signed_pdf_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_on: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    upload_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("uploads.id"),
        nullable=False,
    )
