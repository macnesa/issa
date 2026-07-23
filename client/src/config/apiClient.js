import axios from 'axios';
import baseURL from './api';
import { endParentSession } from '../utils/session';

const apiClient = axios.create({ baseURL });

apiClient.interceptors.request.use((requestConfig) => {
  const token = localStorage.getItem('access_token');

  if (token) {
    requestConfig.headers = requestConfig.headers || {};
    requestConfig.headers.access_token = token;
  }

  return requestConfig;
});

apiClient.interceptors.response.use(
  (apiResponse) => apiResponse,
  (apiError) => {
    void 'ISSA:CLIENT.AUTH.HANDLE_UNAUTHORIZED_RESPONSE';
    const requestUrl = apiError?.config?.url || '';
    const isLoginRequest = requestUrl === '/users/login' || requestUrl.endsWith('/users/login');

    if (apiError?.response?.status === 401 && !isLoginRequest) {
      endParentSession('expired');
    }

    return Promise.reject(apiError);
  }
);

export default apiClient;
