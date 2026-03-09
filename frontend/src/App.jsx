import { useEffect, useMemo, useState } from "react";
import ImportModal from "./components/ImportModal";
import ServiceDetailsModal from "./components/ServiceDetailsModal";

// Ordem fixa das colunas do quadro
const STATUS_ORDER = [
  "BackLog",
  "Em atendimento",
  "Agendado",
  "Completa",
  "Não aprovado",
];

// Cores usadas em cada status
const STATUS_COLORS = {
  BackLog: "#f3f4f6",
  "Em atendimento": "#fef3c7",
  Agendado: "#dbeafe",
  Completa: "#dcfce7",
  "Não aprovado": "#fee2e2",
};

function App() {
  // Lista completa de serviços retornada pela API
  const [services, setServices] = useState([]);

  // Lista de praças retornada pela API
  const [pracas, setPracas] = useState([]);

  // Data da última atualização da planilha
  const [uploadDate, setUploadDate] = useState(null);

  // Praça selecionada pelo usuário
  const [selectedPraca, setSelectedPraca] = useState("");

  // Busca exata por ticket
  const [ticketSearch, setTicketSearch] = useState("");

  // Serviço selecionado para exibir no modal
  const [selectedService, setSelectedService] = useState(null);

  // Estado para abrir/fechar modal de importação
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Arquivo Excel selecionado para importação
  const [selectedFile, setSelectedFile] = useState(null);

  // Senha administrativa para importar a planilha
  const [importPassword, setImportPassword] = useState("");

  // Mensagem de retorno da importação
  const [importMessage, setImportMessage] = useState("");

  // Estado visual para indicar importação em andamento
  const [isImporting, setIsImporting] = useState(false);

  // Busca os dados no backend
  async function loadServicesData() {
    const response = await fetch("http://127.0.0.1:8000/services");

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    setServices(data.dados || []);
    setPracas(data.pracas || []);
    setUploadDate(data.upload_data || null);
  }

  // Carrega os dados da API quando a tela abre
  useEffect(() => {
    loadServicesData().catch((error) => {
      console.error("Erro ao buscar dados:", error);
    });
  }, []);

  // Filtra os serviços pela praça selecionada
  // e pela busca exata de ticket, se houver
  const filteredServices = useMemo(() => {
    if (!selectedPraca) {
      return [];
    }

    let resultado = services.filter(
      (service) => service.praca === selectedPraca
    );

    if (ticketSearch.trim()) {
      resultado = resultado.filter(
        (service) => String(service.ticket) === ticketSearch.trim()
      );
    }

    return resultado.sort((a, b) => Number(b.ticket) - Number(a.ticket));
  }, [services, selectedPraca, ticketSearch]);

  // Agrupa os serviços por status para montar as colunas do quadro
  const groupedServices = useMemo(() => {
    const groups = {};

    STATUS_ORDER.forEach((status) => {
      groups[status] = [];
    });

    filteredServices.forEach((service) => {
      const status = service.status || "Sem status";

      if (!groups[status]) {
        groups[status] = [];
      }

      groups[status].push(service);
    });

    return groups;
  }, [filteredServices]);

  // Gera os cards de métricas do topo
  const statusMetrics = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      total: groupedServices[status]?.length || 0,
    }));
  }, [groupedServices]);

  // Ao selecionar uma praça:
  // - salva a nova praça
  // - limpa a busca por ticket
  // - fecha o modal de detalhes
  function handleSelectPraca(praca) {
    setSelectedPraca(praca);
    setTicketSearch("");
    setSelectedService(null);
  }

  // Limpa todos os filtros visuais
  function handleClearFilters() {
    setSelectedPraca("");
    setTicketSearch("");
    setSelectedService(null);
  }

  // Fecha o modal de importação e limpa mensagens visuais
  function handleCloseImportModal() {
    setIsImportModalOpen(false);
    setImportMessage("");
  }

  // Envia a planilha para o backend
  async function handleImportFile() {
    if (!selectedFile) {
      setImportMessage("Selecione um arquivo antes de importar.");
      return;
    }

    if (!importPassword.trim()) {
      setImportMessage("Informe a senha de importação.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setIsImporting(true);
      setImportMessage("Importando planilha...");

      const response = await fetch("http://127.0.0.1:8000/imports/excel", {
        method: "POST",
        headers: {
          "import-password": importPassword.trim(),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Erro ao importar planilha.");
      }

      setImportMessage("Planilha importada com sucesso.");
      await loadServicesData();

      setSelectedFile(null);
      setSelectedService(null);
    } catch (error) {
      setImportMessage(String(error.message || error));
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Cabeçalho principal */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "8px" }}>Service Tracker</h1>

          {uploadDate && (
            <p style={{ margin: 0, color: "#555" }}>
              Última atualização: {new Date(uploadDate).toLocaleString()}
            </p>
          )}
        </div>

        <button
          onClick={() => setIsImportModalOpen(true)}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Importar planilha
        </button>
      </div>

      <h2 style={{ marginBottom: "12px" }}>Selecione uma praça</h2>

      {/* Botões das praças */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {pracas.map((praca) => (
          <button
            key={praca}
            onClick={() => handleSelectPraca(praca)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              backgroundColor: selectedPraca === praca ? "#dbeafe" : "#fff",
              cursor: "pointer",
            }}
          >
            {praca}
          </button>
        ))}
      </div>

      {/* Botão para limpar os filtros */}
      <div style={{ marginTop: "16px" }}>
        <button
          onClick={handleClearFilters}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            backgroundColor: "#ffffff",
            cursor: "pointer",
          }}
        >
          Limpar filtros
        </button>
      </div>

      {/* Campo de busca por ticket */}
      {selectedPraca && (
        <div style={{ marginTop: "20px", marginBottom: "24px" }}>
          <label
            htmlFor="ticket-search"
            style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
          >
            Buscar ticket
          </label>

          <input
            id="ticket-search"
            type="text"
            value={ticketSearch}
            onChange={(event) => setTicketSearch(event.target.value)}
            placeholder="Digite o número do ticket"
            style={{
              width: "280px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
          />
        </div>
      )}

      {/* Área principal da praça selecionada */}
      {selectedPraca && (
        <div style={{ marginTop: "16px" }}>
          <h2 style={{ marginBottom: "8px" }}>Serviços de {selectedPraca}</h2>

          <p style={{ marginBottom: "24px", color: "#555" }}>
            Total de serviços: {filteredServices.length}
          </p>

          {/* Métricas por status */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {statusMetrics.map((item) => (
              <div
                key={item.status}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  padding: "18px",
                  border: "1px solid #e5e7eb",
                  borderLeft: `6px solid ${STATUS_COLORS[item.status]}`,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "14px",
                    color: "#374151",
                    fontWeight: "bold",
                  }}
                >
                  {item.status}
                </p>

                <h3
                  style={{
                    margin: 0,
                    fontSize: "30px",
                    lineHeight: "1",
                  }}
                >
                  {item.total}
                </h3>
              </div>
            ))}
          </div>

          {/* Quadro estilo Kanban */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 280px)",
              gap: "16px",
              alignItems: "start",
              overflowX: "auto",
            }}
          >
            {STATUS_ORDER.map((status) => {
              const items = groupedServices[status] || [];

              return (
                <div
                  key={status}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    padding: "12px",
                    border: "1px solid #e5e7eb",
                    height: "70vh",
                    overflowY: "auto",
                    borderTop: `6px solid ${STATUS_COLORS[status] || "#e5e7eb"}`,
                  }}
                >
                  <div style={{ display: "grid", gap: "12px" }}>
                    {items.map((service) => (
                      <div
                        key={service.ticket}
                        onClick={() => setSelectedService(service)}
                        style={{
                          cursor: "pointer",
                          border: "1px solid #d1d5db",
                          borderRadius: "10px",
                          padding: "12px",
                          backgroundColor: STATUS_COLORS[status] || "#ffffff",
                          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.06)",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                          transition:
                            "transform 0.2s ease, box-shadow 0.2s ease",
                        }}
                      >
                        <h4
                          style={{
                            marginTop: 0,
                            marginBottom: "10px",
                            fontSize: "18px",
                            fontWeight: "bold",
                          }}
                        >
                          #{service.ticket}
                        </h4>

                        <p style={{ margin: "0 0 8px 0", lineHeight: "1.5" }}>
                          <strong>Loja:</strong> {service.store_name || "-"}
                        </p>

                        <p style={{ margin: "0 0 8px 0", lineHeight: "1.5" }}>
                          <strong>BPCS:</strong> {service.bpcs_number || "-"}
                        </p>

                        <p style={{ margin: "0 0 8px 0", lineHeight: "1.5" }}>
                          <strong>SAP:</strong> {service.sap_number || "-"}
                        </p>

                        <p style={{ margin: "0 0 8px 0", lineHeight: "1.5" }}>
                          <strong>Descrição:</strong>{" "}
                          {service.service_description?.slice(0, 120) || "-"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de importação */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        importPassword={importPassword}
        onPasswordChange={setImportPassword}
        onImport={handleImportFile}
        importMessage={importMessage}
        isImporting={isImporting}
      />

      {/* Modal de detalhes do chamado */}
      <ServiceDetailsModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </div>
  );
}

export default App;