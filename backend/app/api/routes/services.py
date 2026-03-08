"""
Rotas relacionadas à consulta dos serviços.

Este módulo define a rota responsável por buscar todos os serviços
importados e devolver o dataset completo para o front-end.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import cast, Integer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.service import Service
from app.models.upload import Upload
from app.schemas.service import ServiceItemResponse, ServiceListResponse

router = APIRouter(prefix="/services", tags=["Services"])


@router.get(
    "",
    response_model=ServiceListResponse,
)
def listar_servicos(db: Session = Depends(get_db)) -> ServiceListResponse:
    """
    Busca todos os serviços importados e devolve o dataset completo.

    Regras:
    - os dados são ordenados por ticket;
    - o campo upload_data traz a data da última importação realizada;
    - o campo pracas traz a lista única de praças disponíveis.
    """
    services = (
        db.query(Service)
        .order_by(cast(Service.ticket, Integer))
        .all()
    )

    ultimo_upload = (
        db.query(Upload)
        .order_by(Upload.uploaded_at.desc())
        .first()
    )

    dados = [
        ServiceItemResponse(
            ticket=service.ticket,
            status=service.status,
            store_name=service.store_name,
            bpcs_number=service.bpcs_number,
            sap_number=service.sap_number,
            praca=service.praca,
            service_description=service.service_description,
            supplier=service.supplier,
            visit_date=service.visit_date,
            solution_text=service.solution_text,
            signature_status=service.signature_status,
            signed_pdf_url=service.signed_pdf_url,
            created_on=service.created_on,
        )
        for service in services
    ]

    pracas = sorted(
        {
            service.praca
            for service in services
            if service.praca
        }
    )

    upload_data = ultimo_upload.uploaded_at if ultimo_upload else None

    return ServiceListResponse(
        dados=dados,
        upload_data=upload_data,
        pracas=pracas,
    )