"""
Schemas relacionados ao processo de importação.

Este módulo define o formato da resposta devolvida pela API após
a importação de uma planilha.
"""

from datetime import datetime

from pydantic import BaseModel


class UploadResponse(BaseModel):
    """
    Representa a resposta da API após uma importação concluída.
    """

    message: str
    total_rows: int
    upload_data: datetime
    source_file_name: str | None
