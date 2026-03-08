import { useEffect, useMemo, useState } from "react";
import ServiceDetailsModal from "./components/ServiceDetailsModal";

const STATUS_ORDER = [
  "BackLog",
  "Em atendimento",
  "Agendado",
  "Completa",
  "Não aprovado",
];

const STATUS_COLORS = {
  BackLog: "#f3f4f6",
  "Em atendimento": "#fef3c7",
  Agendado: "#dbeafe",
  Completa: "#dcfce7",
  "Não aprovado": "#fee2e2",
};

function App() {
  const [services, setServices] = useState([]);
  const [pracas, setPracas] = useState([]);
  const [uploadDate, setUploadDate] = useState(null);
  const [selectedPraca, setSelectedPraca] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/services")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`);
        }

        return response.json();
      })
      .then((data) => {
        setServices(data.dados || []);
        setPracas(data.pracas || []);
        setUploadDate(data.upload_data || null);
      })
      .catch((error) => {
        console.error("Erro ao buscar dados:", error);
      });
  }, []);

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

  function handleSelectPraca(praca) {
    setSelectedPraca(praca);
    setTicketSearch("");
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
      <h1 style={{ marginBottom: "8px" }}>Service Tracker</h1>

      {uploadDate && (
        <p style={{ marginBottom: "24px", color: "#555" }}>
          Última atualização: {new Date(uploadDate).toLocaleString()}
        </p>
      )}

      <h2 style={{ marginBottom: "12px" }}>Selecione uma praça</h2>

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

      {selectedPraca && (
        <div style={{ marginTop: "16px" }}>
          <h2 style={{ marginBottom: "8px" }}>Serviços de {selectedPraca}</h2>

          <p style={{ marginBottom: "24px", color: "#555" }}>
            Total de serviços: {filteredServices.length}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(240px, 1fr))",
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
                  }}
                >
                  <div
                    style={{
                      backgroundColor: STATUS_COLORS[status] || "#f9fafb",
                      borderRadius: "10px",
                      padding: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <h3 style={{ margin: 0, fontSize: "16px" }}>{status}</h3>
                    <p style={{ margin: "6px 0 0 0", color: "#555" }}>
                      {items.length} item(ns)
                    </p>
                  </div>

                  <div style={{ display: "grid", gap: "12px" }}>
                    {items.map((service) => (
                  <div
                    key={service.ticket}
                    onClick={() => setSelectedService(service)}
                    style={{
                      cursor: "pointer",
                          border: "1px solid #ddd",
                          borderRadius: "10px",
                          padding: "12px",
                          backgroundColor: STATUS_COLORS[status] || "#ffffff",
                          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
                          overflowWrap: "anywhere",
                          wordBreak: "break-word",
                          whiteSpace: "normal",
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
     <ServiceDetailsModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
      /> 
    </div>
  );
}

export default App;