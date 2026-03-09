function ImportModal({
  isOpen,
  onClose,
  selectedFile,
  onFileChange,
  importPassword,
  onPasswordChange,
  onImport,
  importMessage,
  isImporting,
}) {
  if (!isOpen) {
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
        zIndex: 1100,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "520px",
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
          <h2 style={{ margin: 0 }}>Importar planilha</h2>

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
          Informe a senha de importação e selecione a planilha Excel.
        </p>

        <div style={{ display: "grid", gap: "16px" }}>
          <div>
            <label
              htmlFor="import-password"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Senha de importação
            </label>

            <input
              id="import-password"
              type="password"
              value={importPassword}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="Digite a senha"
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

          <div>
            <label
              htmlFor="import-file"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Arquivo Excel
            </label>

            <input
              id="import-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                onFileChange(file);
              }}
            />
          </div>

          {selectedFile && (
            <p style={{ margin: 0, color: "#374151" }}>
              Arquivo selecionado: <strong>{selectedFile.name}</strong>
            </p>
          )}

          <button
            onClick={onImport}
            disabled={isImporting}
            style={{
              padding: "12px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: isImporting ? "#93c5fd" : "#2563eb",
              color: "#ffffff",
              cursor: isImporting ? "not-allowed" : "pointer",
              fontWeight: "bold",
            }}
          >
            {isImporting ? "Importando..." : "Importar planilha"}
          </button>

          {importMessage && (
            <p style={{ margin: 0, color: "#374151" }}>{importMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportModal;