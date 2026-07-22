const DEFAULT_MESSAGE = 'Something went wrong';

function messageForStatus(status) {
  if (status === 403) return 'You do not have access to this resource.';
  if (status === 404) return 'The requested data was not found.';
  if (status >= 500) return 'The server is unavailable. Please try again later.';
  return DEFAULT_MESSAGE;
}

export default function normalizeApiError(error) {
  const status = error?.response?.status ?? null;
  const payload = error?.response?.data;
  const backendMessage = typeof payload?.message === 'string'
    ? payload.message
    : typeof payload?.msg === 'string'
      ? payload.msg
      : typeof payload?.error === 'string'
        ? payload.error
        : '';

  if (!status && (error?.request || error?.code === 'ERR_NETWORK')) {
    return { status: null, code: 'NETWORK_ERROR', message: 'Cannot connect to the server. Please try again.' };
  }

  return {
    status,
    code: typeof payload?.code === 'string' ? payload.code : '',
    message: backendMessage || messageForStatus(status),
  };
}
