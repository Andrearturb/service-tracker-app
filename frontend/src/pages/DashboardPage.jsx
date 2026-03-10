import { useEffect, useMemo, useState } from "react";
import AdvancedFiltersModal from "../components/AdvancedFiltersModal";
import ImportModal from "../components/ImportModal";
import LoginAdminModal from "../components/LoginAdminModal";
import ServiceDetailsModal from "../components/ServiceDetailsModal";
import { STATUS_COLORS, STATUS_ORDER } from "../constants/status";
import { adminLogin, fetchServicesData, importExcelFile } from "../services/api";
import {
  buildGlobalStatusMetrics,
  buildStatusMetrics,
  createEmptyAdvancedFilter,
  filterServices,
  formatAdvancedFilterLabel,
  groupServicesByStatus,
} from "../utils/filters";

function DashboardPage() {
  const [services, setServices] = useState([]);
  const [pracas, setPracas] = useState([]);
  const [uploadDate, setUploadDate] = useState(null);

  const [selectedPraca, setSelectedPraca] = useState("");
  const [quickStatusFilter, setQuickStatusFilter] = useState("");

  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [advancedFiltersDraft, setAdvancedFiltersDraft] = useState([]);
  const [advancedFiltersApplied, setAdvancedFiltersApplied] = useState([]);

  const [selectedService, setSelectedService] = useState(null);

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

  async function loadServicesData() {
    const data = await fetchServicesData();
    setServices(data.dados || []);
    setPracas(data.pracas || []);
    setUploadDate(data.upload_data || null);
  }

  useEffect(() => {
    loadServicesData().catch((error) => {
      console.error("Erro ao buscar dados:", error);
    });
  }, []);

  const filteredServices = useMemo(() => {
    return filterServices({
      services,
      selectedPraca,
      quickStatusFilter,
      advancedFiltersApplied,
    });
  }, [services, selectedPraca, quickStatusFilter, advancedFiltersApplied]);

  const groupedServices = useMemo(() => {
    return groupServicesByStatus(filteredServices, STATUS_ORDER);
  }, [filteredServices]);

  const statusMetrics = useMemo(() => {
    return buildStatusMetrics(groupedServices, STATUS_ORDER);
  }, [groupedServices]);

  const globalStatusMetrics = useMemo(() => {
    return buildGlobalStatusMetrics(services, STATUS_ORDER);
  }, [services]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;

    if (quickStatusFilter) {
      count += 1;
    }

    count += advancedFiltersApplied.length;

    return count;
  }, [quickStatusFilter, advancedFiltersApplied]);

  function handleSelectPraca(praca) {
    setSelectedPraca(praca);
    setQuickStatusFilter("");
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
    setSelectedService(null);
  }

  function handleClearFilters() {
    setSelectedPraca("");
    setQuickStatusFilter("");
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
    setSelectedService(null);
  }

  function handleClearSearchFilters() {
    setQuickStatusFilter("");
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
  }

  function handleQuickStatusFilter(status) {
    setQuickStatusFilter((current) => (current === status ? "" : status));
  }

  function handleOpenAdvancedFilters() {
    if (advancedFiltersApplied.length > 0) {
      setAdvancedFiltersDraft(advancedFiltersApplied);
    } else if (advancedFiltersDraft.length === 0) {
      setAdvancedFiltersDraft([createEmptyAdvancedFilter()]);
    }

    setIsAdvancedFiltersOpen(true);
  }

  function handleCloseAdvancedFilters() {
    setIsAdvancedFiltersOpen(false);
  }

  function handleChangeAdvancedFilter(filterId, key, value) {
    setAdvancedFiltersDraft((current) =>
      current.map((filter) => {
        if (filter.id !== filterId) {
          return filter;
        }

        if (key === "field") {
          if (value === "status") {
            return { ...filter, field: value, operator: "equals", value: "" };
          }

          if (value === "ticket") {
            return { ...filter, field: value, operator: "equals", value: "" };
          }

          return { ...filter, field: value, operator: "contains", value: "" };
        }

        if (key === "operator" && value === "any_of") {
          return { ...filter, operator: value, value: [] };
        }

        if (key === "operator" && value !== "any_of") {
          return { ...filter, operator: value, value: "" };
        }

        return { ...filter, [key]: value };
      })
    );
  }

  function handleAddAdvancedFilter() {
    setAdvancedFiltersDraft((current) => [
      ...current,
      createEmptyAdvancedFilter(),
    ]);
  }

  function handleRemoveAdvancedFilter(filterId) {
    setAdvancedFiltersDraft((current) =>
      current.filter((filter) => filter.id !== filterId)
    );
    setAdvancedFiltersApplied((current) =>
      current.filter((filter) => filter.id !== filterId)
    );
  }

  function handleClearAdvancedFilters() {
    setAdvancedFiltersDraft([]);
    setAdvancedFiltersApplied([]);
  }

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

  function handleCloseLoginModal() {
    setIsLoginModalOpen(false);
    setLoginMessage("");
  }

  function handleCloseImportModal() {
    setIsImportModalOpen(false);
    setImportMessage("");
  }

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

      <div style={{ marginTop: "16px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
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

      {selectedPraca && (advancedFiltersApplied.length > 0 || quickStatusFilter) && (
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

                <h3 style={{ margin: 0, fontSize: "30px", lineHeight: "1" }}>
                  {item.total}
                </h3>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPraca && (
        <div style={{ marginTop: "16px", width: "100%" }}>
          <h2 style={{ marginBottom: "8px" }}>Serviços de {selectedPraca}</h2>

          <p style={{ marginBottom: "24px", color: "#555" }}>
            Total de serviços: {filteredServices.length}
          </p>

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

                  <h3 style={{ margin: 0, fontSize: "30px", lineHeight: "1" }}>
                    {item.total}
                  </h3>
                </div>
              );
            })}
          </div>

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