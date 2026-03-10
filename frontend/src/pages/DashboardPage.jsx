import { useEffect, useMemo, useState } from "react";
import AdvancedFiltersModal from "../components/AdvancedFiltersModal";
import ImportModal from "../components/ImportModal";
import LoginAdminModal from "../components/LoginAdminModal";
import ServiceDetailsModal from "../components/ServiceDetailsModal";
import { STATUS_COLORS, STATUS_ORDER } from "../constants/status";
import {
  adminLogin,
  fetchServicesData,
  importExcelFile,
} from "../services/api";
import {
  buildGlobalStatusMetrics,
  buildStatusMetrics,
  createEmptyAdvancedFilter,
  filterServices,
  formatAdvancedFilterLabel,
  groupServicesByStatus,
} from "../utils/filters";
import logoGentil from "../assets/logo-gentil.png";
import logoManutencao from "../assets/logo-manutencao.png";

function DashboardPage() {
  // Dados principais
  const [services, setServices] = useState([]);
  const [pracas, setPracas] = useState([]);
  const [uploadDate, setUploadDate] = useState(null);

  // Filtros
  const [selectedPraca, setSelectedPraca] = useState("");
  const [quickStatusFilter, setQuickStatusFilter] = useState("");

  // Filtros avançados
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [advancedFiltersDraft, setAdvancedFiltersDraft] = useState([]);
  const [advancedFiltersApplied, setAdvancedFiltersApplied] = useState([]);

  // Modal de detalhes
  const [selectedService, setSelectedService] = useState(null);

  // Área administrativa
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [adminToken, setAdminToken] = useState(
    sessionStorage.getItem("admin_token") || ""
  );
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Busca os dados atualizados do backend.
   */
  async function loadServicesData() {
    const data = await fetchServicesData();
    setServices(data.dados || []);
    setPracas(data.pracas || []);
    setUploadDate(data.upload_data || null);
  }

  /**
   * Carrega os dados quando a página abre.
   */
  useEffect(() => {
    loadServicesData().catch((error) => {
      console.error("Erro ao buscar dados:", error);
    });
  }, []);

  /**
   * Aplica os filtros atuais.
   */
  const filteredServices = useMemo(() => {
    return filterServices({
      services,
      selectedPraca,
      quickStatusFilter,
      advancedFiltersApplied,
    });
  }, [services, selectedPraca, quickStatusFilter, advancedFiltersApplied]);

  /**
   * Agrupa os serviços por status para montar o kanban.
   */
  const groupedServices = useMemo(() => {
    return groupServicesByStatus(filteredServices, STATUS_ORDER);
  }, [filteredServices]);

  /**
   * Métricas da praça selecionada.
   */
  const statusMetrics = useMemo(() => {
    return buildStatusMetrics(groupedServices, STATUS_ORDER);
  }, [groupedServices]);

  /**
   * Métricas gerais da base inteira.
   */
  const globalStatusMetrics = useMemo(() => {
    return buildGlobalStatusMetrics(services, STATUS_ORDER);
  }, [services]);

  /**
   * Conta filtros ativos para exibir badge no botão.
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
   * Seleciona praça e reseta filtros relacionados.
   */
  function handleSelectPraca(praca) {
    setSelectedPraca(praca);
    setQuickStatusFilter("");
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
    setSelectedService(null);
  }

  /**
   * Limpa tudo.
   */
  function handleClearFilters() {
    setSelectedPraca("");
    setQuickStatusFilter("");
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
    setSelectedService(null);
  }

  /**
   * Limpa apenas filtros da praça atual.
   */
  function handleClearSearchFilters() {
    setQuickStatusFilter("");
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
  }

  /**
   * Ativa ou desativa quick filter ao clicar na métrica.
   */
  function handleQuickStatusFilter(status) {
    setQuickStatusFilter((current) => (current === status ? "" : status));
  }

  /**
   * Abre o modal de filtros avançados.
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
   * Atualiza uma linha de filtro avançado.
   */
  function handleChangeAdvancedFilter(filterId, key, value) {
    setAdvancedFiltersDraft((current) =>
      current.map((filter) => {
        if (filter.id !== filterId) {
          return filter;
        }

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

        if (key === "operator" && value === "any_of") {
          return {
            ...filter,
            operator: value,
            value: [],
          };
        }

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
   * Adiciona nova regra.
   */
  function handleAddAdvancedFilter() {
    setAdvancedFiltersDraft((current) => [
      ...current,
      createEmptyAdvancedFilter(),
    ]);
  }

  /**
   * Remove regra de filtro.
   */
  function handleRemoveAdvancedFilter(filterId) {
    setAdvancedFiltersDraft((current) =>
      current.filter((filter) => filter.id !== filterId)
    );
    setAdvancedFiltersApplied((current) =>
      current.filter((filter) => filter.id !== filterId)
    );
  }

  /**
   * Limpa filtros avançados.
   */
  function handleClearAdvancedFilters() {
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
  }

  /**
   * Aplica apenas filtros válidos.
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
   * Fecha modal de login.
   */
  function handleCloseLoginModal() {
    setIsLoginModalOpen(false);
    setLoginMessage("");
  }

  /**
   * Fecha modal de importação.
   */
  function handleCloseImportModal() {
    setIsImportModalOpen(false);
    setImportMessage("");
  }

  /**
   * Faz login administrativo.
   */
  async function handleAdminLogin() {
    if (!adminPassword.trim()) {
      setLoginMessage("Informe a senha administrativa.");
      return;
    }

    try {
      setIsLoggingIn(true);
      setLoginMessage("Validando acesso...");

      const data = await adminLogin(adminPassword.trim());

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
   * Importa planilha e recarrega o painel.
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

    try {
      setIsImporting(true);
      setImportMessage("Importando planilha...");

      await importExcelFile(selectedFile, adminToken);

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
   */
  function handleOpenAdminArea() {
    if (adminToken) {
      setIsImportModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
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
      {/* Header com fundo azul */}
      <div
        style={{
          background: "linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)",
          padding: "18px 24px",
          borderRadius: "16px",
          marginBottom: "12px",
          boxShadow: "0 8px 24px rgba(37, 99, 235, 0.18)",
          color: "#ffffff",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr 200px",
            alignItems: "center",
            gap: "20px",
            width: "100%",
          }}
        >
          {/* Logo esquerda */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src={logoGentil}
              alt="Gentil Negócios"
              style={{
                maxHeight: "65px",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Centro */}
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "2rem",
                fontWeight: "800",
                letterSpacing: "0.5px",
                color: "#ffffff",
              }}
            >
              Acompanhamento das Manutenções
            </h1>

            {uploadDate && (
              <p
                style={{
                  margin: "6px 0 0 0",
                  color: "#dbeafe",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Última atualização: {new Date(uploadDate).toLocaleString()}
              </p>
            )}
          </div>

          {/* Logo direita */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <img
              src={logoManutencao}
              alt="Manutenção"
              style={{
                maxHeight: "65px",
                objectFit: "contain",
              }}
            />
          </div>
        </div>
      </div>

      {/* Botão administrativo fora do fundo do header */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={handleOpenAdminArea}
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            fontWeight: "700",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          }}
        >
          Área administrativa
        </button>
      </div>

      {/* Praça */}
      <h2 style={{ marginBottom: "12px" }}>Selecione uma praça</h2>

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

      {/* Ações */}
      <div
        style={{
          marginTop: "16px",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
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
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                backgroundColor: "#ffffff",
                cursor: "pointer",
              }}
            >
              Limpar filtros desta praça
            </button>
          </>
        )}
      </div>

      {/* Chips de filtros ativos */}
      {selectedPraca &&
        (advancedFiltersApplied.length > 0 || quickStatusFilter) && (
          <div
            style={{
              marginTop: "16px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
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
                Status: <strong>{quickStatusFilter}</strong>
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
                  onClick={() => handleRemoveAdvancedFilter(filter.id)}
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

      {/* Visão geral antes de selecionar praça */}
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

      {/* Dashboard da praça */}
      {selectedPraca && (
        <div style={{ marginTop: "16px", width: "100%" }}>
          <h2 style={{ marginBottom: "8px" }}>Serviços de {selectedPraca}</h2>

          <p style={{ marginBottom: "24px", color: "#555" }}>
            Total de serviços: {filteredServices.length}
          </p>

          {/* Métricas / quick filters */}
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

          {/* Kanban */}
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
                    backgroundColor: "#f8fafc",
                    borderRadius: "16px",
                    padding: "0",
                    border: "1px solid #e5e7eb",
                    minHeight: "72vh",
                    maxHeight: "72vh",
                    overflowY: "auto",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Conteúdo da coluna */}
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      padding: "12px",
                    }}
                  >
                    {items.length === 0 && (
                      <div
                        style={{
                          border: "1px dashed #cbd5e1",
                          borderRadius: "12px",
                          padding: "20px 14px",
                          backgroundColor: "#ffffff",
                          textAlign: "center",
                          color: "#6b7280",
                          fontSize: "14px",
                          minHeight: "120px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        Nenhum chamado neste status
                      </div>
                    )}

                    {items.map((service) => (
                      <div
                        key={service.ticket}
                        onClick={() => setSelectedService(service)}
                        style={{
                          cursor: "pointer",
                          border: "1px solid #d1d5db",
                          borderRadius: "14px",
                          padding: "14px",
                          backgroundColor: STATUS_COLORS[status] || "#ffffff",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
                          boxSizing: "border-box",
                          width: "100%",
                          minHeight: "170px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "12px",
                            gap: "12px",
                          }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: "18px",
                              fontWeight: "800",
                              color: "#111827",
                            }}
                          >
                            #{service.ticket}
                          </h4>

                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#475569",
                              backgroundColor: "#ffffff",
                              border: "1px solid #e2e8f0",
                              padding: "6px 10px",
                              borderRadius: "999px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {service.status || "-"}
                          </span>
                        </div>

                        <div style={{ display: "grid", gap: "8px" }}>
                          <p
                            style={{
                              margin: 0,
                              lineHeight: "1.5",
                              color: "#334155",
                            }}
                          >
                            <strong>Loja:</strong> {service.store_name || "-"}
                          </p>

                          <p
                            style={{
                              margin: 0,
                              lineHeight: "1.5",
                              color: "#334155",
                            }}
                          >
                            <strong>BPCS:</strong> {service.bpcs_number || "-"}
                          </p>

                          <p
                            style={{
                              margin: 0,
                              lineHeight: "1.5",
                              color: "#334155",
                            }}
                          >
                            <strong>SAP:</strong> {service.sap_number || "-"}
                          </p>

                          <div
                            style={{
                              marginTop: "4px",
                              padding: "10px 12px",
                              borderRadius: "10px",
                              backgroundColor: "rgba(255,255,255,0.55)",
                              border: "1px solid rgba(229,231,235,0.9)",
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                lineHeight: "1.5",
                                color: "#334155",
                                fontSize: "14px",
                              }}
                            >
                              <strong>Descrição:</strong>{" "}
                              {service.service_description?.slice(0, 120) || "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modais */}
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

      <LoginAdminModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        password={adminPassword}
        onPasswordChange={setAdminPassword}
        onLogin={handleAdminLogin}
        loginMessage={loginMessage}
        isLoggingIn={isLoggingIn}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        selectedFile={selectedFile}
        onFileChange={setSelectedFile}
        onImport={handleImportFile}
        importMessage={importMessage}
        isImporting={isImporting}
      />

      <ServiceDetailsModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      />
    </div>
  );
}

export default DashboardPage;