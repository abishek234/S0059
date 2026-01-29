// pages/DashboardApp.jsx - Role-based dashboard (User + Admin)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';
import Page from '../components/Page';
import UserDashboard from '../sections/dashboard/UserDashboard';
import AdminDashboard from '../sections/dashboard/AdminDashboard';

export default function DashboardApp() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check authentication and role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) {
      navigate('/login');
      return;
    }

    setUserRole(role);
  }, [navigate]);

  if (!userRole) {
    return (
      <Page title="Dashboard">
        <Container maxWidth="xl" sx={{ py: 5 }}>
          Loading...
        </Container>
      </Page>
    );
  }

  // Render based on role
  return userRole === 'admin' ? <AdminDashboard /> : <UserDashboard />;
}