const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || window.location.origin;

export default apiBaseUrl.replace(/\/$/, '');
