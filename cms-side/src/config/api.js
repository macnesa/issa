const productionApiBaseUrl = 'https://issa-api.macnesa.com';
const productionFrontendHostnames = new Set([
  'issa.macnesa.com',
  'issa-cms.macnesa.com',
]);
const localHostnames = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

function isLocalHostname(hostname) {
  return localHostnames.has(String(hostname || '').toLowerCase());
}

function isConfiguredLocalApi(configuredApiBaseUrl) {
  try {
    return isLocalHostname(new URL(configuredApiBaseUrl).hostname);
  } catch (error) {
    return false;
  }
}

export function resolveApiBaseUrl({
  configuredApiBaseUrl,
  location,
}) {
  if (productionFrontendHostnames.has(location.hostname)) {
    return productionApiBaseUrl;
  }

  const configured = configuredApiBaseUrl?.trim();
  if (
    configured
    && !isLocalHostname(location.hostname)
    && isConfiguredLocalApi(configured)
  ) {
    throw new Error(
      'Unsafe API configuration: a remote CMS host cannot use a localhost API target.'
    );
  }

  return (configured || location.origin).replace(/\/$/, '');
}

const apiBaseUrl = resolveApiBaseUrl({
  configuredApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  location: window.location,
});

export default apiBaseUrl;
