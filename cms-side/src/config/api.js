const productionApiBaseUrl = 'https://issa-api.macnesa.com';
const productionFrontendHostnames = new Set([
  'issa.macnesa.com',
  'issa-cms.macnesa.com',
]);

export function resolveApiBaseUrl({
  configuredApiBaseUrl,
  location,
}) {
  if (productionFrontendHostnames.has(location.hostname)) {
    return productionApiBaseUrl;
  }

  return (
    configuredApiBaseUrl?.trim() || location.origin
  ).replace(/\/$/, '');
}

const apiBaseUrl = resolveApiBaseUrl({
  configuredApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  location: window.location,
});

export default apiBaseUrl;
