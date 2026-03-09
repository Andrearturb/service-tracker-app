import TrackingBar from "./TrackingBar";

function ServiceDetailsModal({ service, onClose }) {
  if (!service) {
    return null;
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "900px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Ticket #{service.ticket}</h2>
            <p style={{ margin: "8px 0 0 0", color: "#6b7280" }}>
              Status atual: <strong>{service.status || "-"}</strong>
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              border: "none",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              padding: "10px 14px",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Fechar
          </button>
        </div>

        <TrackingBar status={service.status} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <p><strong>Loja:</strong> {service.store_name || "-"}</p>
            <p><strong>Praça:</strong> {service.praca || "-"}</p>
            <p><strong>BPCS:</strong> {service.bpcs_number || "-"}</p>
            <p><strong>SAP:</strong> {service.sap_number || "-"}</p>
          </div>

          <div>
            <p><strong>Fornecedor:</strong> {service.supplier || "-"}</p>
            <p>
              <strong>Data da visita:</strong>{" "}
              {service.visit_date
                ? new Date(service.visit_date).toLocaleString()
                : "-"}
            </p>
            <p>
              <strong>Criado em:</strong>{" "}
              {service.created_on
                ? new Date(service.created_on).toLocaleString()
                : "-"}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "8px", color: "#1f2937" }}>
            Descrição do serviço
          </h3>
          <div
            style={{
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "16px",
              lineHeight: "1.6",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {service.service_description || "-"}
          </div>
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ marginBottom: "8px", color: "#1f2937" }}>
            Solução
          </h3>
          <div
            style={{
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              padding: "16px",
              lineHeight: "1.6",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {service.solution_text || "-"}
          </div>
        </div>

        <div>
          <h3 style={{ marginBottom: "8px", color: "#1f2937" }}>
            Assinatura
          </h3>

          <p>
            <strong>Status da assinatura:</strong>{" "}
            {service.signature_status || "-"}
          </p>

          {service.signed_pdf_url ? (
            <a
              href={service.signed_pdf_url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                marginTop: "8px",
                color: "#2563eb",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              Abrir PDF assinado
            </a>
          ) : (
            <p style={{ marginTop: "8px", color: "#6b7280" }}>
              Nenhum PDF assinado disponível.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceDetailsModal;