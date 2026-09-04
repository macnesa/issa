const DEFAULT_MESSAGE = 'Terjadi kendala. Silakan coba lagi.';

function getMessageForHttpStatus(httpStatus) {
  if (httpStatus === 403) return 'Anda tidak memiliki akses ke data ini.';
  if (httpStatus === 404) return 'Data yang diminta tidak ditemukan.';
  if (httpStatus >= 500) return 'Server sedang tidak tersedia. Silakan coba lagi nanti.';
  return DEFAULT_MESSAGE;
}

export default function normalizeApiError(apiError) {
  const status = apiError?.response?.status ?? null;
  const payload = apiError?.response?.data;
  const nestedError = payload?.error && typeof payload.error === 'object'
    ? payload.error
    : null;
  const backendMessage = typeof nestedError?.message === 'string'
    ? nestedError.message
    : typeof payload?.message === 'string'
    ? payload.message
    : typeof payload?.msg === 'string'
      ? payload.msg
      : typeof payload?.error === 'string'
        ? payload.error
        : '';

  if (!status && (apiError?.request || apiError?.code === 'ERR_NETWORK')) {
    return {
      status: null,
      code: 'NETWORK_ERROR',
      message: 'Tidak dapat terhubung ke server. Silakan coba lagi.',
    };
  }

  return {
    status,
    code: typeof nestedError?.code === 'string'
      ? nestedError.code
      : typeof payload?.code === 'string'
        ? payload.code
        : '',
    message: backendMessage || getMessageForHttpStatus(status),
  };
}
