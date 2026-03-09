const DEFAULT_FLOW = ["BackLog", "Em atendimento", "Agendado", "Completa"];
const REJECTED_FLOW = ["BackLog", "Não aprovado"];

const CIRCLE_SIZE = 40;
const CONNECTOR_HEIGHT = 6;

function TrackingBar({ status }) {
  // Define qual fluxo será exibido
  const flow = status === "Não aprovado" ? REJECTED_FLOW : DEFAULT_FLOW;

  // Descobre a posição atual no fluxo
  const currentIndex = flow.indexOf(status);

  // Regras globais de estado do fluxo
  const isRejectedFlow = status === "Não aprovado";
  const isCompletedFlow = status === "Completa";

  return (
    <div style={{ marginBottom: "32px" }}>
      <style>
        {`
          @keyframes pulseStep {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.20);
            }
            50% {
              transform: scale(1.08);
              box-shadow: 0 0 0 10px rgba(37, 99, 235, 0.08);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
            }
          }

          @keyframes pulseGreen {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.20);
            }
            50% {
              transform: scale(1.08);
              box-shadow: 0 0 0 10px rgba(34, 197, 94, 0.08);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
            }
          }

          @keyframes pulseRed {
            0% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.20);
            }
            50% {
              transform: scale(1.08);
              box-shadow: 0 0 0 10px rgba(239, 68, 68, 0.08);
            }
            100% {
              transform: scale(1);
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
            }
          }
        `}
      </style>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          width: "100%",
        }}
      >
        {flow.map((step, index) => {
          const isCompleted = currentIndex > index;
          const isCurrent = currentIndex === index;
          const isPending = currentIndex < index;

          const showConnector = index < flow.length - 1;
          const isConnectorCompleted = currentIndex > index;

          let circleContent = index + 1;
          let circleColor = "#e5e7eb";
          let circleTextColor = "#4b5563";
          let labelColor = "#6b7280";
          let borderColor = "#ffffff";
          let animationName = "none";
          let circleFontSize = "15px";
          let circleLetterSpacing = "0";

          // CASO 1: fluxo completo finalizado
          if (isCompletedFlow) {
            circleColor = "#22c55e";
            circleTextColor = "#ffffff";
            labelColor = "#166534";
            borderColor = "#bbf7d0";
            animationName = isCurrent
              ? "pulseGreen 1.8s ease-in-out infinite"
              : "none";

            // Etapa final recebe destaque visual com duplo check
            if (step === "Completa") {
              circleContent = "✓✓";
              circleFontSize = "11px";
              circleLetterSpacing = "-1px";
            } else {
              circleContent = "✓";
              circleFontSize = "15px";
            }
          }
          // CASO 2: fluxo não aprovado
          else if (isRejectedFlow) {
            circleColor = "#ef4444";
            circleTextColor = "#ffffff";
            labelColor = "#991b1b";
            borderColor = "#fecaca";
            animationName = isCurrent
              ? "pulseRed 1.8s ease-in-out infinite"
              : "none";

            // Tanto o BackLog quanto o Não aprovado ficam com X
            circleContent = "✕";
            circleFontSize = "15px";
          }
          // CASO 3: fluxo normal em andamento
          else {
            if (isCompleted) {
              circleContent = "✓";
              circleColor = "#2563eb";
              circleTextColor = "#ffffff";
              labelColor = "#111827";
              borderColor = "#dbeafe";
            }

            if (isCurrent) {
              circleContent = index + 1;
              circleColor = "#2563eb";
              circleTextColor = "#ffffff";
              labelColor = "#111827";
              borderColor = "#93c5fd";
              animationName = "pulseStep 1.8s ease-in-out infinite";
            }

            if (isPending) {
              circleContent = index + 1;
              circleColor = "#e5e7eb";
              circleTextColor = "#4b5563";
              labelColor = "#6b7280";
              borderColor = "#ffffff";
            }
          }

          // Cor do segmento entre etapas
          let connectorColor = "#e5e7eb";

          if (isCompletedFlow) {
            connectorColor = "#22c55e";
          } else if (isRejectedFlow) {
            connectorColor = "#ef4444";
          } else if (isConnectorCompleted) {
            connectorColor = "#2563eb";
          }

          return (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "flex-start",
                flex: 1,
              }}
            >
              {/* Etapa */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: `${CIRCLE_SIZE}px`,
                }}
              >
                {/* Círculo */}
                <div
                  style={{
                    width: `${CIRCLE_SIZE}px`,
                    height: `${CIRCLE_SIZE}px`,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: circleColor,
                    color: circleTextColor,
                    fontSize: circleFontSize,
                    fontWeight: "bold",
                    letterSpacing: circleLetterSpacing,
                    border: isCurrent
                      ? `4px solid ${borderColor}`
                      : `2px solid ${borderColor}`,
                    boxSizing: "border-box",
                    animation: animationName,
                    transition: "all 0.3s ease",
                  }}
                >
                  {circleContent}
                </div>

                {/* Nome da etapa */}
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "13px",
                    fontWeight: isCurrent ? "700" : "500",
                    color: labelColor,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step}
                </div>
              </div>

              {/* Segmento entre etapas */}
              {showConnector && (
                <div
                  style={{
                    flex: 1,
                    height: `${CIRCLE_SIZE}px`,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 8px",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: `${CONNECTOR_HEIGHT}px`,
                      backgroundColor: connectorColor,
                      borderRadius: "999px",
                      transition: "background-color 0.35s ease",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TrackingBar;