// pages/WasteHistoryPage.jsx - UPDATED with tabs
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { toast } from 'react-toastify';
import Iconify from '../components/Iconify';
import SubmissionHistoryTab from '../sections/waste/SubmissionHistoryTab';
import PublishedProductsTab from '../sections/waste/PublishedProductsTab';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ marginTop: '24px' }}>
      {value === index && children}
    </div>
  );
}

export default function WasteHistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to continue');
      navigate('/login');
    }
  }, [navigate]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" gutterBottom>
            My Workspace
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your submissions and published products
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={() => navigate('/dashboard/waste/')}
          size="large"
        >
          New Submission
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontSize: '1rem',
              fontWeight: 600,
              py: 2
            }
          }}
        >
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Iconify icon="eva:file-text-outline" />
                Submission History
              </Box>
            }
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                <Iconify icon="eva:checkmark-circle-2-outline" />
                Published Products
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <SubmissionHistoryTab />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <PublishedProductsTab />
      </TabPanel>
    </Container>
  );
}