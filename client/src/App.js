import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// routes
import Router from './routes';
// theme
import ThemeProvider from './theme';
// components
import ScrollToTop from './components/ScrollToTop';
import AuthProvider from './context/AuthContext';
import { BaseOptionChartStyle } from './components/chart/BaseOptionChart';
import { setupAxiosInterceptor } from './utils/axiosInterceptor';
// ----------------------------------------------------------------------

export default function App() {
      const navigate = useNavigate();

    useEffect(() => {
        setupAxiosInterceptor(navigate);
    }, [navigate]);

  return (
    <ThemeProvider>
      <ScrollToTop />
      <BaseOptionChartStyle />
      <AuthProvider>
      <Router />
      </AuthProvider>
    </ThemeProvider>
  );
}
