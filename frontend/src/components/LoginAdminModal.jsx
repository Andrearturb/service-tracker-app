function LoginAdminModal({
  isOpen,
  onClose,
  password,
  onPasswordChange,
  onLogin,
  loginMessage,
  isLoggingIn,
}) {
  // Se o modal estiver fechado, não renderiza nada
  if (!isOpen) {
    return null;
  }

  return (
    <div
      // Clique fora fecha o modal
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        zIndex: 1200,
      }}
    >
      <div
        // Impede que clique dentro feche o modal
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "420px",
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
          <h2 style={{ margin: 0 }}>Área administrativa</h2>

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

        <p style={{ marginTop: 0, marginBottom: "16px", color: "#6b7280" }}>
          Informe a senha para acessar a área de importação.
        </p>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label
              htmlFor="admin-password"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Senha
            </label>

            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Digite a senha administrativa"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            onClick={onLogin}
            disabled={isLoggingIn}
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: isLoggingIn ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              cursor: isLoggingIn ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {isLoggingIn ? "Entrando..." : "Entrar"}
          </button>

          {loginMessage && (
            <p style={{ margin: 0, color: "#374151" }}>{loginMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginAdminModal;