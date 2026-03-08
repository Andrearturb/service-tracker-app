const DEFAULT_FLOW = ["BackLog", "Em atendimento", "Agendado", "Completa"];
const REJECTED_FLOW = ["BackLog", "Não aprovado"];

function TrackingBar({ status }) {
  const flow = status === "Não aprovado" ? REJECTED_FLOW : DEFAULT_FLOW;

  const currentIndex = flow.indexOf(status);

  return (
    <div style={{ marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
        }}
      >
        {flow.map((step, index) => {
          const isCompleted = currentIndex >= index;
          const isCurrent = currentIndex === index;

          return (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: "120px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: "bold",
                    backgroundColor: isCompleted ? "#2563eb" : "#e5e7eb",
                    color: isCompleted ? "#ffffff" : "#374151",
                    border: isCurrent ? "3px solid #93c5fd" : "none",
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: isCurrent ? "bold" : "normal",
                    color: isCompleted ? "#111827" : "#6b7280",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step}
                </div>

                {index < flow.length - 1 && (
                  <div
                    style={{
                      height: "4px",
                      flex: 1,
                      borderRadius: "999px",
                      backgroundColor:
                        currentIndex > index ? "#2563eb" : "#e5e7eb",
                      marginLeft: "8px",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TrackingBar;