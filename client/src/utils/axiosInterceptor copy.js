// utils/axiosInterceptor.js - BETTER APPROACH
import axios from 'axios';

export const setupAxiosInterceptor = (navigate) => {
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            // Handle suspension responses ONLY when user is already logged in
            if (error.response?.status === 403 && error.response?.data?.suspended) {
                const currentPath = window.location.pathname;
                const isOnLoginPage = currentPath === '/login' || currentPath === '/';

                // Only handle if user is logged in and NOT on login page
                if (!isOnLoginPage && localStorage.getItem('token')) {
                    // Clear session
                    localStorage.clear();
                    
                    // Redirect to login (without toast since dialog will show)
                    navigate('/login', { replace: true });
                }
            }
            
            // Handle token expiration
            if (error.response?.status === 401 && error.response?.data?.message?.includes('token')) {
                const currentPath = window.location.pathname;
                const isOnLoginPage = currentPath === '/login' || currentPath === '/';

                if (!isOnLoginPage) {
                    localStorage.clear();
                    navigate('/login', { replace: true });
                }
            }
            
            return Promise.reject(error);
        }
    );
};