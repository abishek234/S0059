// components/dashboard/UserDashboard.jsx - Existing user dashboard design
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Paper,
  LinearProgress,
  Chip,
  Avatar,
  Divider,
  alpha
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Page from '../../components/Page';
import Iconify from '../../components/Iconify';

export default function UserDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const userName = localStorage.getItem('name') || 'User';
  const companyName = localStorage.getItem('companyName') || 'Your Company';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      const [statsRes, historyRes] = await Promise.all([
        axios.get('http://localhost:7070/api/waste/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:7070/api/waste/history?limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data.stats);
      setRecentSubmissions(historyRes.data.submissions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toLocaleString() || 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Page title="Dashboard">
        <Container maxWidth="xl">
          <Box sx={{ py: 8 }}>
            <Typography variant="h4">Loading Dashboard...</Typography>
            <LinearProgress sx={{ mt: 3 }} />
          </Box>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="Dashboard">
      <Container maxWidth="xl" sx={{ py: 5 }}>
        {/* Hero Section */}
        <Box sx={{ mb: 6 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                Welcome back, {userName}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {companyName}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                Transform your industrial waste into valuable products with AI-powered upcycling recommendations
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Iconify icon="eva:plus-circle-fill" />}
                  onClick={() => navigate('/dashboard/waste')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  New Analysis
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Iconify icon="eva:clock-outline" />}
                  onClick={() => navigate('/dashboard/history')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  History
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Impact Metrics Cards */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64 }}>
                    <Iconify icon="eva:file-text-fill" width={32} />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.totalSubmissions || 0}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Total Waste Analyses
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64 }}>
                    <Iconify icon="eva:bulb-fill" width={32} />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stats?.totalIdeas || 0}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Product Ideas Generated
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar sx={{ bgcolor: 'info.main', width: 64, height: 64 }}>
                    <Iconify icon="eva:trending-down-outline" width={32} />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {formatNumber(stats?.totalCO2Saved)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Tons CO₂ Saved Per Year
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card 
              sx={{ 
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 64, height: 64 }}>
                    <Iconify icon="eva:droplet-fill" width={32} />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {formatNumber(stats?.totalWaterSaved)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Liters Water Saved Per Year
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={4}>
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Recent Analyses
                  </Typography>
                  <Button
                    endIcon={<Iconify icon="eva:arrow-forward-fill" />}
                    onClick={() => navigate('/dashboard/history')}
                  >
                    View All
                  </Button>
                </Box>

                {recentSubmissions.length === 0 ? (
                  <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'background.neutral' }}>
                    <Iconify icon="eva:file-text-outline" width={80} sx={{ color: 'text.disabled', mb: 3 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No analyses yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                      Start by submitting your first waste data for AI analysis
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Iconify icon="eva:plus-fill" />}
                      onClick={() => navigate('/dashboard/waste')}
                    >
                      Submit Waste Data
                    </Button>
                  </Paper>
                ) : (
                  <Stack spacing={3}>
                    {recentSubmissions.map((submission) => (
                      <Paper
                        key={submission._id}
                        sx={{
                          p: 3,
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            boxShadow: 4,
                            transform: 'translateY(-4px)',
                            borderColor: 'primary.main'
                          }
                        }}
                        onClick={() => {
                          if (submission.status === 'completed') {
                            navigate(`/dashboard/waste/results/${submission._id}`);
                          }
                        }}
                      >
                        <Stack direction="row" spacing={3} alignItems="center">
                          <Avatar sx={{ bgcolor: `${getStatusColor(submission.status)}.lighter`, width: 56, height: 56 }}>
                            <Iconify 
                              icon={submission.status === 'completed' ? 'eva:checkmark-circle-2-fill' : 'eva:clock-outline'} 
                              width={28}
                              sx={{ color: `${getStatusColor(submission.status)}.main` }}
                            />
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {submission.material}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {submission.quantity} • {submission.industry}
                            </Typography>
                          </Box>
                          <Stack alignItems="flex-end" spacing={1}>
                            <Chip
                              label={submission.status.toUpperCase()}
                              size="small"
                              color={getStatusColor(submission.status)}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(submission.createdAt), 'MMM dd, yyyy')}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Stack spacing={4}>
              <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.08) }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Environmental Impact
                  </Typography>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Average Profit Margin
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {stats?.avgProfitMargin || 0}%
                        </Typography>
                        <Chip label="Viable" size="small" color="success" />
                      </Box>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 1.5 }}>
                        Industries Analyzed
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {stats?.industries?.slice(0, 3).map((industry, index) => (
                          <Chip key={index} label={industry} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
}