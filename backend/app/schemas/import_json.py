from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class ServiceImportItem(BaseModel):
    ticket: str
    status: Optional[str] = None
    raw_location: Optional[str] = None
    praca: Optional[str] = None
    service_description: Optional[str] = None
    supplier: Optional[str] = None
    visit_date: Optional[datetime] = None
    solution_text: Optional[str] = None
    raw_signature: Optional[str] = None
    created_on: Optional[datetime] = None


class ServiceImportPayload(BaseModel):
    source_name: Optional[str] = "API"
    items: List[ServiceImportItem]