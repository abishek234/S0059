import axios from 'axios';

let interceptorId = null;

export const setupAxiosInterceptor = (navigate) => {
  // Prevent duplicate interceptors
  if (interceptorId !== null) {
    axios.interceptors.response.eject(interceptorId);
  }

  interceptorId = axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const data = error.response?.data;
      const token = localStorage.getItem('token');

      const currentPath = window.location.pathname;
      const isOnLoginPage =
        currentPath === '/login' || currentPath === '/';

      // 🔒 Account suspended (logged-in users only)
      if (status === 403 && data?.suspended && token && !isOnLoginPage) {
        localStorage.clear();
        navigate('/login', { replace: true });
        return Promise.reject(error);
      }

      // ⏰ Token expired / unauthorized
      if (status === 401 && token && !isOnLoginPage) {
        localStorage.clear();
        navigate('/login', { replace: true });
        return Promise.reject(error);
      }

      return Promise.reject(error);
    }
  );
};
