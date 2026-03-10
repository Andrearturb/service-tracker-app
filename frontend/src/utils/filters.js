/**
 * Normaliza textos para comparação.
 */
export function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Cria um filtro avançado vazio.
 */
export function createEmptyAdvancedFilter() {
  return {
    id: `${Date.now()}-${Math.random()}`,
    field: "ticket",
    operator: "equals",
    value: "",
  };
}

/**
 * Aplica filtros avançados em uma lista de serviços.
 */
export function applyAdvancedFilters(data, advancedFiltersApplied) {
  if (!advancedFiltersApplied.length) {
    return data;
  }

  return data.filter((service) => {
    return advancedFiltersApplied.every((filter) => {
      const rawValue = service[filter.field];
      const serviceValue = normalizeText(rawValue);

      if (filter.operator === "any_of") {
        const values = Array.isArray(filter.value) ? filter.value : [];

        if (!values.length) {
          return true;
        }

        return values.some((value) => serviceValue === normalizeText(value));
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
 * Filtra serviços por praça + quick filter + filtros avançados.
 */
export function filterServices({
  services,
  selectedPraca,
  quickStatusFilter,
  advancedFiltersApplied,
}) {
  if (!selectedPraca) {
    return [];
  }

  let result = services.filter((service) => service.praca === selectedPraca);

  if (quickStatusFilter) {
    result = result.filter((service) => service.status === quickStatusFilter);
  }

  result = applyAdvancedFilters(result, advancedFiltersApplied);

  return result.sort((a, b) => Number(b.ticket) - Number(a.ticket));
}

/**
 * Agrupa por status para o kanban.
 */
export function groupServicesByStatus(filteredServices, statusOrder) {
  const groups = {};

  statusOrder.forEach((status) => {
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
}

/**
 * Gera métricas da praça filtrada.
 */
export function buildStatusMetrics(groupedServices, statusOrder) {
  return statusOrder.map((status) => ({
    status,
    total: groupedServices[status]?.length || 0,
  }));
}

/**
 * Gera métricas globais.
 */
export function buildGlobalStatusMetrics(services, statusOrder) {
  const counts = {};

  statusOrder.forEach((status) => {
    counts[status] = 0;
  });

  services.forEach((service) => {
    const status = service.status;

    if (counts[status] !== undefined) {
      counts[status] += 1;
    }
  });

  return statusOrder.map((status) => ({
    status,
    total: counts[status] || 0,
  }));
}

/**
 * Formata label do chip de filtro aplicado.
 */
export function formatAdvancedFilterLabel(filter) {
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