import { useEffect, useMemo, useState } from "react";
import AdvancedFiltersModal from "./components/AdvancedFiltersModal";
import ImportModal from "./components/ImportModal";
import LoginAdminModal from "./components/LoginAdminModal";
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

  // Quick filter por status, ativado ao clicar nas métricas
  const [quickStatusFilter, setQuickStatusFilter] = useState("");

  // Controle do modal de filtros avançados
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  // Filtros em edição dentro do modal
  const [advancedFiltersDraft, setAdvancedFiltersDraft] = useState([]);

  // Filtros efetivamente aplicados
  const [advancedFiltersApplied, setAdvancedFiltersApplied] = useState([]);

  // Serviço selecionado para exibir no modal de detalhes
  const [selectedService, setSelectedService] = useState(null);

  // Controle do modal de login administrativo
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Controle do modal de importação
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Arquivo Excel selecionado para importação
  const [selectedFile, setSelectedFile] = useState(null);

  // Senha digitada no login administrativo
  const [adminPassword, setAdminPassword] = useState("");

  // Mensagem exibida no modal de login
  const [loginMessage, setLoginMessage] = useState("");

  // Estado visual do botão de login
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Token administrativo salvo na sessão do navegador
  const [adminToken, setAdminToken] = useState(
    sessionStorage.getItem("admin_token") || ""
  );

  // Mensagem exibida no modal de importação
  const [importMessage, setImportMessage] = useState("");

  // Estado visual do botão de importação
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Converte qualquer valor em texto minúsculo
   * para facilitar comparações.
   */
  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  /**
   * Gera um filtro vazio novo para o modal.
   */
  function createEmptyAdvancedFilter() {
    return {
      id: `${Date.now()}-${Math.random()}`,
      field: "ticket",
      operator: "equals",
      value: "",
    };
  }

  /**
   * Busca os dados públicos do painel no backend.
   */
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

  /**
   * Carrega os dados da API quando a tela abre.
   */
  useEffect(() => {
    loadServicesData().catch((error) => {
      console.error("Erro ao buscar dados:", error);
    });
  }, []);

  /**
   * Aplica os filtros avançados sobre um conjunto de serviços.
   * Todos são aplicados com AND.
   */
  function applyAdvancedFilters(data) {
    if (!advancedFiltersApplied.length) {
      return data;
    }

    return data.filter((service) => {
      return advancedFiltersApplied.every((filter) => {
        const rawValue = service[filter.field];
        const serviceValue = normalizeText(rawValue);

        // Operador "qualquer um desses"
        if (filter.operator === "any_of") {
          const values = Array.isArray(filter.value) ? filter.value : [];

          if (!values.length) {
            return true;
          }

          return values.some(
            (value) => serviceValue === normalizeText(value)
          );
        }

        const filterValue = normalizeText(filter.value);

        if (!filterValue) {
          return true;
        }

        if (filter.operator === "equals") {
          return serviceValue === filterValue;
        }

        if (filter.operator === "contains") {
          return serviceValue.includes(filterValue);
        }

        return true;
      });
    });
  }

  /**
   * Filtra os serviços pela praça selecionada
   * e também pelos filtros adicionais.
   */
  const filteredServices = useMemo(() => {
    if (!selectedPraca) {
      return [];
    }

    let resultado = services.filter(
      (service) => service.praca === selectedPraca
    );

    // Quick filter por status vindo das métricas
    if (quickStatusFilter) {
      resultado = resultado.filter(
        (service) => service.status === quickStatusFilter
      );
    }

    // Filtros avançados aplicados
    resultado = applyAdvancedFilters(resultado);

    // Ordena os tickets do maior para o menor
    return resultado.sort((a, b) => Number(b.ticket) - Number(a.ticket));
  }, [services, selectedPraca, quickStatusFilter, advancedFiltersApplied]);

  /**
   * Agrupa os serviços filtrados por status
   * para montar as colunas do quadro Kanban.
   */
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

  /**
   * Gera as métricas do topo com base
   * na quantidade de serviços por status filtrados pela praça.
   */
  const statusMetrics = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      total: groupedServices[status]?.length || 0,
    }));
  }, [groupedServices]);

  /**
   * Conta quantos filtros estão ativos no momento.
   * Considera:
   * - quick filter por status
   * - filtros avançados aplicados
   */
  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (quickStatusFilter) {
      count += 1;
    }

    count += advancedFiltersApplied.length;

    return count;
  }, [quickStatusFilter, advancedFiltersApplied]);

  /**
   * Gera métricas gerais antes de selecionar a praça.
   */
  const globalStatusMetrics = useMemo(() => {
    const counts = {};

    STATUS_ORDER.forEach((status) => {
      counts[status] = 0;
    });

    services.forEach((service) => {
      const status = service.status;

      if (counts[status] !== undefined) {
        counts[status] += 1;
      }
    });

    return STATUS_ORDER.map((status) => ({
      status,
      total: counts[status] || 0,
    }));
  }, [services]);

  /**
   * Ao selecionar uma praça:
   * - salva a praça
   * - limpa os filtros
   * - fecha o modal de detalhes
   */
  function handleSelectPraca(praca) {
    setSelectedPraca(praca);
    setQuickStatusFilter("");
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
    setSelectedService(null);
  }

  /**
   * Limpa todos os filtros visuais.
   */
  function handleClearFilters() {
    setSelectedPraca("");
    setQuickStatusFilter("");
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
    setSelectedService(null);
  }

  /**
   * Limpa os filtros internos da praça selecionada.
   */
  function handleClearSearchFilters() {
    setQuickStatusFilter("");
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
  }

  /**
   * Liga ou desliga o quick filter de status
   * ao clicar nas métricas.
   */
  function handleQuickStatusFilter(status) {
    setQuickStatusFilter((current) => (current === status ? "" : status));
  }

  /**
   * Abre o modal de filtros avançados.
   * Se não houver rascunho, inicia com os filtros aplicados atuais
   * ou com uma linha vazia.
   */
  function handleOpenAdvancedFilters() {
    if (advancedFiltersApplied.length > 0) {
      setAdvancedFiltersDraft(advancedFiltersApplied);
    } else if (advancedFiltersDraft.length === 0) {
      setAdvancedFiltersDraft([createEmptyAdvancedFilter()]);
    }

    setIsAdvancedFiltersOpen(true);
  }

  /**
   * Fecha o modal de filtros avançados.
   */
  function handleCloseAdvancedFilters() {
    setIsAdvancedFiltersOpen(false);
  }

  /**
   * Altera uma propriedade de um filtro do modal.
   * Se o campo mudar, ajusta operador/valor para evitar inconsistências.
   */
  function handleChangeAdvancedFilter(filterId, key, value) {
    setAdvancedFiltersDraft((current) =>
      current.map((filter) => {
        if (filter.id !== filterId) {
          return filter;
        }

        // Se mudar o campo, resetamos operador/valor de forma coerente
        if (key === "field") {
          if (value === "status") {
            return {
              ...filter,
              field: value,
              operator: "equals",
              value: "",
            };
          }

          if (value === "ticket") {
            return {
              ...filter,
              field: value,
              operator: "equals",
              value: "",
            };
          }

          return {
            ...filter,
            field: value,
            operator: "contains",
            value: "",
          };
        }

        // Se mudar o operador para any_of, o valor vira array
        if (key === "operator" && value === "any_of") {
          return {
            ...filter,
            operator: value,
            value: [],
          };
        }

        // Se sair de any_of, voltamos o valor para string
        if (key === "operator" && value !== "any_of") {
          return {
            ...filter,
            operator: value,
            value: "",
          };
        }

        return {
          ...filter,
          [key]: value,
        };
      })
    );
  }

  /**
   * Adiciona uma nova linha de filtro no modal.
   */
  function handleAddAdvancedFilter() {
    setAdvancedFiltersDraft((current) => [
      ...current,
      createEmptyAdvancedFilter(),
    ]);
  }

  /**
   * Remove uma linha de filtro do modal.
   */
  function handleRemoveAdvancedFilter(filterId) {
    setAdvancedFiltersDraft((current) =>
      current.filter((filter) => filter.id !== filterId)
    );
  }

  /**
   * Limpa os filtros do modal.
   */
  function handleClearAdvancedFilters() {
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
  }

  /**
   * Aplica os filtros do modal que tenham valor preenchido.
   */
  function handleApplyAdvancedFilters() {
    const validFilters = advancedFiltersDraft.filter((filter) => {
      if (filter.operator === "any_of") {
        return Array.isArray(filter.value) && filter.value.length > 0;
      }

      return String(filter.value || "").trim() !== "";
    });

    setAdvancedFiltersApplied(validFilters);
    setIsAdvancedFiltersOpen(false);
  }

  /**
   * Fecha o modal de login e limpa a mensagem.
   */
  function handleCloseLoginModal() {
    setIsLoginModalOpen(false);
    setLoginMessage("");
  }

  /**
   * Fecha o modal de importação e limpa a mensagem.
   */
  function handleCloseImportModal() {
    setIsImportModalOpen(false);
    setImportMessage("");
  }

  /**
   * Faz login administrativo no backend.
   * Se a senha estiver correta, salva o token
   * e abre o modal de importação.
   */
  async function handleAdminLogin() {
    if (!adminPassword.trim()) {
      setLoginMessage("Informe a senha administrativa.");
      return;
    }

    try {
      setIsLoggingIn(true);
      setLoginMessage("Validando acesso...");

      const response = await fetch("http://127.0.0.1:8000/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: adminPassword.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Falha no login administrativo.");
      }

      sessionStorage.setItem("admin_token", data.token);
      setAdminToken(data.token);
      setAdminPassword("");
      setLoginMessage("");
      setIsLoginModalOpen(false);
      setIsImportModalOpen(true);
    } catch (error) {
      setLoginMessage(String(error.message || error));
    } finally {
      setIsLoggingIn(false);
    }
  }

  /**
   * Envia a planilha para o backend usando o token administrativo.
   */
  async function handleImportFile() {
    if (!selectedFile) {
      setImportMessage("Selecione um arquivo antes de importar.");
      return;
    }

    if (!adminToken) {
      setImportMessage("Acesso administrativo não autorizado.");
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
          Authorization: `Bearer ${adminToken}`,
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

  /**
   * Abre a área administrativa.
   * Se já existir token salvo, abre direto a importação.
   * Caso contrário, abre o login.
   */
  function handleOpenAdminArea() {
    if (adminToken) {
      setIsImportModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  }

  /**
   * Gera um rótulo amigável para exibir os filtros aplicados.
   */
  function formatAdvancedFilterLabel(filter) {
    const fieldLabels = {
      ticket: "Ticket",
      bpcs_number: "BPCS",
      sap_number: "SAP",
      store_name: "Loja",
      status: "Status",
    };

    const operatorLabels = {
      equals: "igual a",
      contains: "contém",
      any_of: "qualquer um desses",
    };

    const valueLabel = Array.isArray(filter.value)
      ? filter.value.join(", ")
      : filter.value;

    return `${fieldLabels[filter.field] || filter.field} ${
      operatorLabels[filter.operator] || filter.operator
    } ${valueLabel}`;
  }

  return (
    <div
      style={{
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
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
          width: "100%",
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
          onClick={handleOpenAdminArea}
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
          Área administrativa
        </button>
      </div>

      <h2 style={{ marginBottom: "12px" }}>Selecione uma praça</h2>

      {/* Botões das praças */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          width: "100%",
        }}
      >
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

      {/* Botões principais */}
      <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button
          onClick={handleClearFilters}
          className="btn-secondary"
        >
          Limpar filtros
        </button>

        {selectedPraca && (
          <>
            <button
              onClick={handleOpenAdvancedFilters}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                fontWeight: "500",
              }}
            >
              <span>Filtros avançados</span>

              {activeFiltersCount > 0 && (
                <span
                  style={{
                    minWidth: "22px",
                    height: "22px",
                    padding: "0 6px",
                    borderRadius: "999px",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "bold",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={handleClearSearchFilters}
              className="btn-secondary"
            >
              Limpar filtros desta praça
            </button>
          </>
        )}
      </div>

      {/* Resumo dos filtros aplicados */}
      {selectedPraca &&
        (advancedFiltersApplied.length > 0 || quickStatusFilter) && (
          <div style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {quickStatusFilter && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                }}
              >
                Quick filter: <strong>{quickStatusFilter}</strong>
                <button
                  onClick={() => setQuickStatusFilter("")}
                  style={{
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  ✕
                </button>
              </span>
            )}

            {advancedFiltersApplied.map((filter) => (
              <span
                key={filter.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  fontSize: "14px",
                }}
              >
                {formatAdvancedFilterLabel(filter)}

                <button
                  onClick={() =>
                    setAdvancedFiltersApplied((current) =>
                      current.filter((item) => item.id !== filter.id)
                    )
                  }
                  style={{
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

      {/* Painel padrão antes de selecionar praça */}
      {!selectedPraca && (
        <div style={{ marginTop: "24px", width: "100%" }}>
          <div
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
              boxSizing: "border-box",
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: "12px" }}>
              Visão geral do painel
            </h2>

            <p style={{ margin: 0, color: "#555", lineHeight: "1.6" }}>
              Selecione uma praça para visualizar os chamados no quadro Kanban.
              Enquanto isso, abaixo está o resumo geral de todos os serviços
              importados no sistema.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              width: "100%",
            }}
          >
            {globalStatusMetrics.map((item) => (
              <div
                key={item.status}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  padding: "18px",
                  border: "1px solid #e5e7eb",
                  borderLeft: `6px solid ${STATUS_COLORS[item.status]}`,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  boxSizing: "border-box",
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
        </div>
      )}

      {/* Área principal da praça selecionada */}
      {selectedPraca && (
        <div style={{ marginTop: "16px", width: "100%" }}>
          <h2 style={{ marginBottom: "8px" }}>Serviços de {selectedPraca}</h2>

          <p style={{ marginBottom: "24px", color: "#555" }}>
            Total de serviços: {filteredServices.length}
          </p>

          {/* Métricas por status transformadas em quick filters */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
              width: "100%",
            }}
          >
            {statusMetrics.map((item) => {
              const isActive = quickStatusFilter === item.status;

              return (
                <div
                  key={item.status}
                  onClick={() => handleQuickStatusFilter(item.status)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    padding: "18px",
                    border: isActive
                      ? `2px solid ${STATUS_COLORS[item.status]}`
                      : "1px solid #e5e7eb",
                    borderLeft: `6px solid ${STATUS_COLORS[item.status]}`,
                    boxShadow: isActive
                      ? "0 4px 14px rgba(0, 0, 0, 0.10)"
                      : "0 2px 8px rgba(0, 0, 0, 0.04)",
                    boxSizing: "border-box",
                    cursor: "pointer",
                    transform: isActive ? "translateY(-2px)" : "none",
                    transition: "all 0.2s ease",
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
              );
            })}
          </div>

          {/* Quadro estilo Kanban */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(260px, 1fr))",
              gap: "16px",
              alignItems: "start",
              width: "100%",
              boxSizing: "border-box",
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
                    minHeight: "70vh",
                    maxHeight: "70vh",
                    overflowY: "auto",
                    borderTop: `6px solid ${STATUS_COLORS[status] || "#e5e7eb"}`,
                    boxSizing: "border-box",
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
                          boxSizing: "border-box",
                          width: "100%",
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

      {/* Modal de filtros avançados */}
      <AdvancedFiltersModal
        isOpen={isAdvancedFiltersOpen}
        onClose={handleCloseAdvancedFilters}
        filtersDraft={advancedFiltersDraft}
        onChangeFilter={handleChangeAdvancedFilter}
        onAddFilter={handleAddAdvancedFilter}
        onRemoveFilter={handleRemoveAdvancedFilter}
        onApplyFilters={handleApplyAdvancedFilters}
        onClearFilters={handleClearAdvancedFilters}
        statusOptions={STATUS_ORDER}
      />

      {/* Modal de login administrativo */}
      <LoginAdminModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        password={adminPassword}
        onPasswordChange={setAdminPassword}
        onLogin={handleAdminLogin}
        loginMessage={loginMessage}
        isLoggingIn={isLoggingIn}
      />

      {/* Modal de importação */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
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