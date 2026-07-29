const DEFAULT_MESSAGE = 'Something went wrong';

function getMessageForHttpStatus(httpStatus) {
  if (httpStatus === 403) return 'You do not have access to this resource.';
  if (httpStatus === 404) return 'The requested data was not found.';
  if (httpStatus >= 500) return 'The server is unavailable. Please try again later.';
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
    return { status: null, code: 'NETWORK_ERROR', message: 'Cannot connect to the server. Please try again.' };
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
