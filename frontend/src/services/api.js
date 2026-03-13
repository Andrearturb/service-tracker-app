const API_BASE_URL = "/api";

export async function fetchServicesData() {
  const response = await fetch(`${API_BASE_URL}/services`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar serviços: ${response.status}`);
  }

  return response.json();
}

export async function adminLogin(password) {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Falha no login administrativo.");
  }

  return data;
}

export async function importExcelFile(file, adminToken) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/imports/excel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
    body: formData,
  });

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Erro ao importar planilha.");
    }

    return data;
  }

  const text = await response.text();
  throw new Error(`Resposta inesperada do servidor: ${text.slice(0, 120)}`);
}