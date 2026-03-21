import json
import requests

API_URL = "http://localhost:8000/imports/json"
API_KEY = "minha-chave-super-secreta"
ARQUIVO_MOCK = "mock_tape_response.json"


def buscar_dados_origem() -> list[dict]:
    with open(ARQUIVO_MOCK, "r", encoding="utf-8") as arquivo:
        return json.load(arquivo)

    #response = requests.get(
        #"URL_DA_API_DO_TAPE",
        #headers={
            #"Authorization": "Bearer TOKEN_DO_TAPE"
        #},
        #timeout=120,
    #)
    #response.raise_for_status()
    #return response.json()

def transformar_para_service_tracker(dados_origem: list[dict]) -> dict:
    items = []
    #quando a estrutura do TAPE for diferente, aqui é onde faremos as adaptações para o formato esperado pelo Service Tracker
    #exemplo de mapeamento:
    #  "ticket": str(item.get("id", ""))
    #  para:
    #  "ticket": str(item.get("o que tiver no tape", "")),
    
    for item in dados_origem:
        items.append(
            {
                "ticket": str(item.get("id", "")),
                "status": item.get("status"),
                "raw_location": item.get("local"),
                "praca": item.get("praca"),
                "service_description": item.get("descricao"),
                "supplier": item.get("fornecedor"),
                "visit_date": item.get("data_visita"),
                "solution_text": item.get("solucao"),
                "raw_signature": None,
                "created_on": item.get("criado_em"),
            }
        )

    return {
        "source_name": "Mock TAPE API",
        "items": items,
    }


def enviar_para_backend(payload: dict) -> None:
    response = requests.post(
        API_URL,
        headers={
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=120,
    )

    print("Status:", response.status_code)
    print("Resposta:", response.text)


if __name__ == "__main__":
    dados_origem = buscar_dados_origem()
    payload = transformar_para_service_tracker(dados_origem)
    enviar_para_backend(payload)