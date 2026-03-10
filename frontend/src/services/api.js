const API_BASE_URL = "http://127.0.0.1:8000";

/**
 * Busca os dados públicos do dashboard.
 */
export async function fetchServicesData() {
  const response = await fetch(`${API_BASE_URL}/services`);

  if (!response.ok) {
    throw new Error(`Erro ao buscar serviços: ${response.status}`);
  }

  return response.json();
}

/**
 * Faz login administrativo.
 */
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

/**
 * Envia planilha para importação.
 */
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Erro ao importar planilha.");
  }

  return data;
}