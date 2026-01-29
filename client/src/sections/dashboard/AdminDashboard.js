// components/dashboard/AdminDashboard.jsx - NEW Admin Analytics Dashboard
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
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import Page from '../../components/Page';
import Iconify from '../../components/Iconify';

export default function AdminDashboard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const adminName = localStorage.getItem('name') || 'Admin';

  useEffect(() => {
    fetchAdminDashboardData();
  }, []);

  const fetchAdminDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      const [statsRes, pendingRes, reportsRes] = await Promise.all([
        axios.get('http://localhost:7070/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:7070/api/admin/products/pending?limit=5', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:7070/api/admin/reports/pending', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data.stats);
      setPendingProducts(pendingRes.data.products);
      setRecentReports(reportsRes.data.reports);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toLocaleString() || 0;
  };

  const handleQuickApprove = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:7070/api/admin/products/${productId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Product approved successfully');
      fetchAdminDashboardData();
    } catch (error) {
      toast.error('Failed to approve product');
    }
  };

  if (loading) {
    return (
      <Page title="Admin Dashboard">
        <Container maxWidth="xl">
          <Box sx={{ py: 8 }}>
            <Typography variant="h4">Loading Admin Dashboard...</Typography>
            <LinearProgress sx={{ mt: 3 }} />
          </Box>
        </Container>
      </Page>
    );
  }

  return (
    <Page title="Admin Dashboard">
      <Container maxWidth="xl" sx={{ py: 5 }}>
        {/* Hero Section */}
        <Box sx={{ mb: 6 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main', width: 56, height: 56 }}>
                  <Iconify icon="eva:shield-fill" width={28} />
                </Avatar>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    Admin Dashboard
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Welcome back, {adminName}
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600 }}>
                Manage products, users, and monitor platform analytics
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="warning"
                  size="large"
                  startIcon={<Iconify icon="eva:clock-outline" />}
                  onClick={() => navigate('/dashboard/products')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Pending ({stats?.products.pending || 0})
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Iconify icon="eva:people-outline" />}
                  onClick={() => navigate('/dashboard/users')}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Users
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Admin Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {/* Total Users */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Users
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats?.users.total || 0}
                    </Typography>
                    <Chip label={`${stats?.users.verified || 0} Verified`} size="small" color="success" />
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Iconify icon="eva:people-fill" width={24} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Products */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Pending Review
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats?.products.pending || 0}
                    </Typography>
                    <Chip label="Needs Attention" size="small" color="warning" />
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Iconify icon="eva:clock-fill" width={24} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Approved Products */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Approved Products
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats?.products.approved || 0}
                    </Typography>
                    <Chip label="Live on Marketplace" size="small" color="success" />
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <Iconify icon="eva:checkmark-circle-fill" width={24} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Pending Reports */}
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              sx={{ 
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
              }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Pending Reports
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                      {stats?.reports.pending || 0}
                    </Typography>
                    <Chip label={stats?.reports.pending > 0 ? "Action Required" : "All Clear"} size="small" color={stats?.reports.pending > 0 ? "error" : "default"} />
                  </Box>
                  <Avatar sx={{ bgcolor: 'error.main' }}>
                    <Iconify icon="eva:alert-triangle-fill" width={24} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Environmental Impact */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Iconify icon="eva:trending-down-outline" width={48} sx={{ color: 'success.main', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main', mb: 1 }}>
                  {formatNumber(stats?.impact.totalCO2Saved)} tons
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total CO₂ Saved Annually
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Iconify icon="eva:droplet-fill" width={48} sx={{ color: 'info.main', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main', mb: 1 }}>
                  {formatNumber(stats?.impact.totalWaterSaved)} liters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Water Saved Annually
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Iconify icon="eva:trending-up-outline" width={48} sx={{ color: 'warning.main', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main', mb: 1 }}>
                  {stats?.impact.avgProfitMargin || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Profit Margin
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={4}>
          {/* Pending Products */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Products Awaiting Review
                  </Typography>
                  <Button
                    endIcon={<Iconify icon="eva:arrow-forward-fill" />}
                    onClick={() => navigate('/dashboard/products')}
                  >
                    View All
                  </Button>
                </Box>

                {pendingProducts.length === 0 ? (
                  <Paper sx={{ p: 6, textAlign: 'center', bgcolor: 'background.neutral' }}>
                    <Iconify icon="eva:checkmark-circle-2-outline" width={80} sx={{ color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      All caught up!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No products pending review
                    </Typography>
                  </Paper>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell>User</TableCell>
                          <TableCell>Submitted</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingProducts.map((product) => (
                          <TableRow key={product._id} hover>
                            <TableCell>
                              <Box>
                                <Typography variant="subtitle2">{product.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {product.material}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2">{product.userId?.name || 'N/A'}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {product.userId?.companyName || ''}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {format(new Date(product.createdAt), 'MMM dd, yyyy')}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={1} justifyContent="center">
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleQuickApprove(product._id)}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => navigate(`/dashboard/product/${product._id}/review`)}
                                >
                                  Review
                                </Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Stats Sidebar */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              {/* Recent Reports */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Recent Reports
                  </Typography>
                  {recentReports.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No pending reports
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {recentReports.slice(0, 3).map((report) => (
                        <Paper key={report._id} sx={{ p: 2, bgcolor: 'error.lighter' }}>
                          <Typography variant="subtitle2" color="error.main" gutterBottom>
                            {report.reason}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(report.createdAt), 'MMM dd, yyyy')}
                          </Typography>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/dashboard/reports')}
                  >
                    Manage Reports
                  </Button>
                </CardContent>
              </Card>

              {/* Product Status Breakdown */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Product Status
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Approved</Typography>
                      <Chip label={stats?.products.approved || 0} size="small" color="success" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Pending</Typography>
                      <Chip label={stats?.products.pending || 0} size="small" color="warning" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Rejected</Typography>
                      <Chip label={stats?.products.rejected || 0} size="small" color="error" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Deactivated</Typography>
                      <Chip label={stats?.products.deactivated || 0} size="small" color="default" />
                    </Box>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">Total Products</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {stats?.products.total || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
}
