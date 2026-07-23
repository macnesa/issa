import axios from 'axios';
import baseURL from './api';
import { endParentSession } from '../utils/session';

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
    const requestUrl = error?.config?.url || '';
    const isLoginRequest = requestUrl === '/users/login' || requestUrl.endsWith('/users/login');

    if (error?.response?.status === 401 && !isLoginRequest) {
      endParentSession('expired');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
