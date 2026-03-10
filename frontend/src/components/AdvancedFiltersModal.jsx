function AdvancedFiltersModal({
  isOpen,
  onClose,
  filtersDraft,
  onChangeFilter,
  onAddFilter,
  onRemoveFilter,
  onApplyFilters,
  onClearFilters,
  statusOptions,
}) {
  // Se o modal estiver fechado, não renderiza nada
  if (!isOpen) {
    return null;
  }

  // Campos disponíveis para filtrar
  const fieldOptions = [
    { value: "ticket", label: "Ticket" },
    { value: "bpcs_number", label: "BPCS" },
    { value: "sap_number", label: "SAP" },
    { value: "store_name", label: "Loja" },
    { value: "status", label: "Status" },
  ];

  /**
   * Retorna os operadores permitidos conforme o campo escolhido.
   */
  function getOperatorOptions(field) {
    if (field === "status") {
      return [
        { value: "equals", label: "igual a" },
        { value: "contains", label: "contém" },
        { value: "any_of", label: "qualquer um desses" },
      ];
    }

    if (field === "ticket") {
      return [{ value: "equals", label: "igual a" }];
    }

    return [
      { value: "equals", label: "igual a" },
      { value: "contains", label: "contém" },
    ];
  }

  /**
   * Marca ou desmarca um status dentro do operador "qualquer um desses".
   */
  function handleToggleStatusValue(filter, status) {
    const currentValues = Array.isArray(filter.value) ? filter.value : [];
    const alreadySelected = currentValues.includes(status);

    const nextValues = alreadySelected
      ? currentValues.filter((item) => item !== status)
      : [...currentValues, status];

    onChangeFilter(filter.id, "value", nextValues);
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
        zIndex: 1300,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "920px",
          maxHeight: "90vh",
          overflowY: "auto",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          boxSizing: "border-box",
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            gap: "12px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Filtros avançados</h2>
            <p style={{ margin: "8px 0 0 0", color: "#6b7280" }}>
              Monte regras combinadas para refinar os chamados da praça selecionada.
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
              flexShrink: 0,
            }}
          >
            Fechar
          </button>
        </div>

        {/* Lista de filtros */}
        <div style={{ display: "grid", gap: "12px" }}>
          {filtersDraft.map((filter) => {
            const operatorOptions = getOperatorOptions(filter.field);

            return (
              <div
                key={filter.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.1fr 1fr 1.6fr auto",
                  gap: "12px",
                  alignItems: "start",
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  backgroundColor: "#f9fafb",
                }}
              >
                {/* Campo */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    Campo
                  </label>

                  <select
                    value={filter.field}
                    onChange={(event) =>
                      onChangeFilter(filter.id, "field", event.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                      backgroundColor: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    {fieldOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operador */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    Operador
                  </label>

                  <select
                    value={filter.operator}
                    onChange={(event) =>
                      onChangeFilter(filter.id, "operator", event.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #ccc",
                      fontSize: "14px",
                      backgroundColor: "#ffffff",
                      boxSizing: "border-box",
                    }}
                  >
                    {operatorOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Valor */}
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "8px",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    Valor
                  </label>

                  {/* Caso especial: status com "qualquer um desses" */}
                  {filter.field === "status" && filter.operator === "any_of" ? (
                    <div
                      style={{
                        border: "1px solid #ccc",
                        borderRadius: "10px",
                        backgroundColor: "#ffffff",
                        padding: "10px",
                        display: "grid",
                        gap: "8px",
                        maxHeight: "180px",
                        overflowY: "auto",
                      }}
                    >
                      {statusOptions.map((status) => {
                        const selectedValues = Array.isArray(filter.value)
                          ? filter.value
                          : [];
                        const isChecked = selectedValues.includes(status);

                        return (
                          <label
                            key={status}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 10px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              backgroundColor: isChecked ? "#eff6ff" : "#ffffff",
                              border: isChecked
                                ? "1px solid #bfdbfe"
                                : "1px solid transparent",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleStatusValue(filter, status)}
                            />
                            <span style={{ fontSize: "14px" }}>{status}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : filter.field === "status" ? (
                    <select
                      value={typeof filter.value === "string" ? filter.value : ""}
                      onChange={(event) =>
                        onChangeFilter(filter.id, "value", event.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        fontSize: "14px",
                        backgroundColor: "#ffffff",
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="">Selecione</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={typeof filter.value === "string" ? filter.value : ""}
                      onChange={(event) =>
                        onChangeFilter(filter.id, "value", event.target.value)
                      }
                      placeholder="Digite o valor"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        backgroundColor: "#ffffff",
                      }}
                    />
                  )}
                </div>

                {/* Remover */}
                <button
                  onClick={() => onRemoveFilter(filter.id)}
                  style={{
                    border: "none",
                    backgroundColor: "#ffffff",
                    color: "#ef4444",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "#fecaca",
                    alignSelf: "end",
                  }}
                >
                  Remover
                </button>
              </div>
            );
          })}
        </div>

        {/* Rodapé */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            marginTop: "20px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              onClick={onAddFilter}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                backgroundColor: "#ffffff",
                cursor: "pointer",
              }}
            >
              + Adicionar filtro
            </button>

            <button
              onClick={onClearFilters}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                backgroundColor: "#ffffff",
                cursor: "pointer",
              }}
            >
              Limpar
            </button>
          </div>

          <button
            onClick={onApplyFilters}
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
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvancedFiltersModal;