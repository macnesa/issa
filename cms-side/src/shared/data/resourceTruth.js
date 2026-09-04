export const RESOURCE_STATUS = Object.freeze({
  LOADING: "loading",
  KNOWN: "known",
  EMPTY: "empty",
  ERROR: "error",
  UNAVAILABLE: "unavailable",
  PARTIAL: "partial",
  PENDING: "pending",
  CONFLICTED: "conflicted",
});

export const RESOURCE_PROVENANCE = Object.freeze({
  SERVER: "server",
  SNAPSHOT: "snapshot",
  LOCAL_PENDING: "local_pending",
  DERIVED: "derived",
  DRAFT: "draft",
});

const resolvedStatuses = new Set([
  RESOURCE_STATUS.KNOWN,
  RESOURCE_STATUS.EMPTY,
  RESOURCE_STATUS.PARTIAL,
  RESOURCE_STATUS.PENDING,
  RESOURCE_STATUS.CONFLICTED,
]);

function normalizeError(error) {
  if (!error) return "";
  if (typeof error === "string") return error;
  return error.message || String(error);
}

function defaultData(data) {
  return data === undefined ? null : data;
}

export function createResourceState({
  status = RESOURCE_STATUS.LOADING,
  data = null,
  error = "",
  provenance = RESOURCE_PROVENANCE.SERVER,
  reason = "",
  scope = "",
  updatedAt = null,
  meta = {},
} = {}) {
  return {
    status,
    data: defaultData(data),
    error: normalizeError(error),
    provenance,
    reason,
    scope,
    updatedAt,
    meta: meta && typeof meta === "object" ? meta : {},
  };
}

export function resourceLoading({
  data = null,
  provenance = RESOURCE_PROVENANCE.SERVER,
  scope = "",
  meta = {},
} = {}) {
  return createResourceState({
    status: RESOURCE_STATUS.LOADING,
    data,
    provenance,
    scope,
    meta,
  });
}

export function resourceFromData(data, {
  provenance = RESOURCE_PROVENANCE.SERVER,
  partial = false,
  reason = "",
  scope = "",
  updatedAt = null,
  meta = {},
} = {}) {
  const empty = Array.isArray(data)
    ? data.length === 0
    : data === null || data === undefined;

  return createResourceState({
    status: partial
      ? RESOURCE_STATUS.PARTIAL
      : empty ? RESOURCE_STATUS.EMPTY : RESOURCE_STATUS.KNOWN,
    data,
    provenance,
    reason,
    scope,
    updatedAt,
    meta,
  });
}

export function resourceError(error, {
  data = null,
  provenance = RESOURCE_PROVENANCE.SERVER,
  reason = "",
  scope = "",
  meta = {},
} = {}) {
  return createResourceState({
    status: RESOURCE_STATUS.ERROR,
    data,
    error,
    provenance,
    reason,
    scope,
    meta,
  });
}

export function resourceUnavailable({
  data = null,
  provenance = RESOURCE_PROVENANCE.SNAPSHOT,
  reason = "",
  scope = "",
  meta = {},
} = {}) {
  return createResourceState({
    status: RESOURCE_STATUS.UNAVAILABLE,
    data,
    provenance,
    reason,
    scope,
    meta,
  });
}

export function resourcePartial(data, options = {}) {
  return resourceFromData(data, { ...options, partial: true });
}

export function resourcePending(data, {
  provenance = RESOURCE_PROVENANCE.LOCAL_PENDING,
  reason = "",
  scope = "",
  meta = {},
} = {}) {
  return createResourceState({
    status: RESOURCE_STATUS.PENDING,
    data,
    provenance,
    reason,
    scope,
    meta,
  });
}

export function resourceConflicted(data, {
  provenance = RESOURCE_PROVENANCE.LOCAL_PENDING,
  reason = "",
  scope = "",
  meta = {},
} = {}) {
  return createResourceState({
    status: RESOURCE_STATUS.CONFLICTED,
    data,
    provenance,
    reason,
    scope,
    meta,
  });
}

export function isResourceResolved(resource) {
  return resolvedStatuses.has(resource?.status);
}

export function resourceHasData(resource) {
  const data = resource?.data;
  if (Array.isArray(data)) return data.length > 0;
  return data !== null && data !== undefined;
}

export function resourceIsEmpty(resource) {
  return resource?.status === RESOURCE_STATUS.EMPTY;
}

export function resourceIsDegraded(resource) {
  return [
    RESOURCE_STATUS.PARTIAL,
    RESOURCE_STATUS.UNAVAILABLE,
    RESOURCE_STATUS.PENDING,
    RESOURCE_STATUS.CONFLICTED,
  ].includes(resource?.status);
}

export function summarizeResourceSet(resources) {
  const entries = Object.entries(resources || {}).filter(([, resource]) => resource);
  if (!entries.length) {
    return createResourceState({
      status: RESOURCE_STATUS.UNAVAILABLE,
      provenance: RESOURCE_PROVENANCE.DERIVED,
      reason: "Tidak ada sumber data yang didefinisikan.",
      data: {},
    });
  }

  const data = Object.fromEntries(entries.map(([key, resource]) => [key, resource.data]));
  const statuses = entries.map(([, resource]) => resource.status);
  const provenance = RESOURCE_PROVENANCE.DERIVED;

  if (statuses.every((status) => status === RESOURCE_STATUS.LOADING)) {
    return resourceLoading({ data, provenance });
  }

  const available = entries.filter(([, resource]) => (
    resolvedStatuses.has(resource.status) && resource.status !== RESOURCE_STATUS.EMPTY
  ));
  const hasUnavailable = statuses.some((status) => (
    status === RESOURCE_STATUS.ERROR || status === RESOURCE_STATUS.UNAVAILABLE
  ));
  const hasDegraded = statuses.some((status) => (
    status === RESOURCE_STATUS.PARTIAL
    || status === RESOURCE_STATUS.PENDING
    || status === RESOURCE_STATUS.CONFLICTED
  ));
  const hasLoading = statuses.some((status) => status === RESOURCE_STATUS.LOADING);
  const allEmpty = statuses.every((status) => status === RESOURCE_STATUS.EMPTY);

  if (allEmpty) return resourceFromData([], { provenance });

  const sourceStatuses = Object.fromEntries(entries.map(([key, resource]) => [key, resource.status]));

  if (available.length > 0 && (hasUnavailable || hasDegraded || hasLoading)) {
    return resourcePartial(data, {
      provenance,
      reason: "Sebagian sumber belum lengkap atau belum tersedia.",
      meta: { sourceStatuses },
    });
  }

  if (available.length > 0) {
    return resourceFromData(data, { provenance, meta: { sourceStatuses } });
  }

  if (hasLoading) {
    return resourceLoading({ data, provenance, meta: { sourceStatuses } });
  }

  if (statuses.some((status) => status === RESOURCE_STATUS.ERROR)) {
    const errors = entries
      .map(([key, resource]) => resource.status === RESOURCE_STATUS.ERROR ? `${key}: ${resource.error}` : "")
      .filter(Boolean)
      .join("; ");
    return resourceError(errors || "Sumber data gagal dimuat.", { data, provenance });
  }

  if (statuses.some((status) => status === RESOURCE_STATUS.UNAVAILABLE)) {
    return resourceUnavailable({
      data,
      provenance,
      reason: "Sumber data tidak tersedia dalam konteks ini.",
    });
  }

  return resourceLoading({ data, provenance });
}
