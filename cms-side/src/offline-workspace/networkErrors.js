export function isAuthenticationError(error) {
  return error?.status === 401 || error?.status === 403;
}

export function isNetworkFailure(error) {
  return !isAuthenticationError(error) && (
    typeof error?.status === "undefined"
    || error?.name === "TypeError"
  );
}
