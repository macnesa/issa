import axios from 'axios';
import baseURL from './api';
import { clearParentSession, SESSION_EXPIRED_EVENT } from '../utils/session';

let sessionExpiryHandled = false;

const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.access_token = token;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error?.config?.url === '/users/login';

    if (error?.response?.status === 401 && !isLoginRequest && !sessionExpiryHandled) {
      sessionExpiryHandled = true;
      clearParentSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export function resetSessionExpiryHandling() {
  sessionExpiryHandled = false;
}

export default apiClient;
