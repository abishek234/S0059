// pages/admin/ProductReviewPage.jsx - Complete product review interface
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
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
  Chip,
  Avatar,
  Divider,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  LinearProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { toast } from 'react-toastify';
import Page from '../components/Page';
import Iconify from '../components/Iconify';

export default function ProductReviewPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  
  // Form states
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:7070/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProduct(response.data.product);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      setLoading(false);
      navigate('/dashboard/products');
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:7070/api/admin/products/${id}/approve`,
        { adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Product approved successfully! User has been verified.');
      setApproveModalOpen(false);
      navigate('/dashboard/products');
    } catch (error) {
      console.error('Error approving product:', error);
      toast.error(error.response?.data?.message || 'Failed to approve product');
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.warning('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:7070/api/admin/products/${id}/reject`,
        { rejectionReason, adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Product rejected');
      setRejectModalOpen(false);
      navigate('/dashboard/products');
    } catch (error) {
      console.error('Error rejecting product:', error);
      toast.error(error.response?.data?.message || 'Failed to reject product');
      setActionLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toLocaleString() || 0;
  };

  if (loading) {
    return (
      <Page title="Review Product">
        <Container maxWidth="lg">
          <Box sx={{ py: 8 }}>
            <Typography variant="h4" gutterBottom>Loading Product...</Typography>
            <LinearProgress sx={{ mt: 3 }} />
          </Box>
        </Container>
      </Page>
    );
  }

  if (!product) {
    return (
      <Page title="Review Product">
        <Container maxWidth="lg">
          <Alert severity="error">Product not found</Alert>
        </Container>
      </Page>
    );
  }

  return (
    <Page title={`Review: ${product.name}`}>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Box>
            <Button
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
              onClick={() => navigate('/dashboard/products')}
              sx={{ mb: 2 }}
            >
              Back to Pending Products
            </Button>
            <Typography variant="h3" gutterBottom>
              Review Product
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review this product submission for marketplace approval
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Product Image */}
            <Card sx={{ mb: 3 }}>
              <Box
                component="img"
                src={product.imageUrl || 'https://via.placeholder.com/800x400?text=Product+Image'}
                alt={product.name}
                sx={{
                  width: '100%',
                  height: 400,
                  objectFit: 'cover',
                }}
              />
            </Card>

            {/* Product Details */}
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip label="PENDING REVIEW" color="warning" />
                  <Chip
                    label={`Submitted ${format(new Date(product.createdAt), 'MMM dd, yyyy')}`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>

                <Typography variant="h4" gutterBottom>
                  {product.name}
                </Typography>

                <Typography variant="body1" paragraph sx={{ mt: 2 }}>
                  {product.description}
                </Typography>

                <Divider sx={{ my: 3 }} />

                {/* Basic Information */}
                <Typography variant="h6" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Material Type
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {product.material}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Quantity Available
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {product.quantity}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Industry
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {product.industry}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Target Market
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {product.targetMarket}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Production Process */}
                {product.productionProcess && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>
                      Production Process
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="body2">{product.productionProcess}</Typography>
                    </Paper>
                  </>
                )}

                {/* Market Analysis */}
                {product.marketAnalysis && (
                  <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom>
                      Market Analysis
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="body2">{product.marketAnalysis}</Typography>
                    </Paper>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* User Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Submitted By
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Avatar
                      alt={product.userId?.name}
                      sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}
                    >
                      {product.userId?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1">{product.userId?.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.userId?.email}
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Company:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {product.userId?.companyName || 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Location:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {product.userId?.location || 'N/A'}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Verified:
                      </Typography>
                      <Chip
                        label={product.userId?.isVerified ? 'Yes' : 'No'}
                        size="small"
                        color={product.userId?.isVerified ? 'success' : 'warning'}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Impact Metrics */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Environmental Impact
                  </Typography>
                  <Stack spacing={2}>
                    <Paper sx={{ p: 2, bgcolor: 'success.lighter', textAlign: 'center' }}>
                      <Iconify icon="eva:trending-down-outline" width={32} sx={{ color: 'success.main', mb: 1 }} />
                      <Typography variant="h5" color="success.dark">
                        {formatNumber(product.co2Saved)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tons CO₂ Saved/Year
                      </Typography>
                    </Paper>
                    <Paper sx={{ p: 2, bgcolor: 'info.lighter', textAlign: 'center' }}>
                      <Iconify icon="eva:droplet-fill" width={32} sx={{ color: 'info.main', mb: 1 }} />
                      <Typography variant="h5" color="info.dark">
                        {formatNumber(product.waterSaved)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Liters Water Saved/Year
                      </Typography>
                    </Paper>
                  </Stack>
                </CardContent>
              </Card>

              {/* Business Metrics */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Business Viability
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Profit Margin
                        </Typography>
                        <Typography variant="h6" color="warning.main">
                          {product.profitMargin}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={product.profitMargin}
                        color="warning"
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                    <Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Feasibility Score
                        </Typography>
                        <Typography variant="h6" color="primary.main">
                          {product.feasibilityScore}/10
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={product.feasibilityScore * 10}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              {/* Review Actions */}
              <Card sx={{ bgcolor: 'background.neutral' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Review Actions
                  </Typography>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      Approving this product will automatically verify the user's account.
                    </Typography>
                  </Alert>
                  <Stack spacing={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                      onClick={() => setApproveModalOpen(true)}
                    >
                      Approve Product
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      size="large"
                      startIcon={<Iconify icon="eva:close-circle-fill" />}
                      onClick={() => setRejectModalOpen(true)}
                    >
                      Reject Product
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>

        {/* Approve Modal */}
        <Dialog open={approveModalOpen} onClose={() => setApproveModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: 'success.main', mr: 1 }} />
              Approve Product
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>Approving this product will:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                <li>Make it live on the marketplace</li>
                <li>Verify the user's account (if not already verified)</li>
                <li>Send notification to the user</li>
              </Typography>
            </Alert>
            <TextField
              label="Admin Notes (Optional)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Add internal notes about this approval..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setApproveModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleApprove}
              variant="contained"
              color="success"
              loading={actionLoading}
              startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
            >
              Approve Product
            </LoadingButton>
          </DialogActions>
        </Dialog>

        {/* Reject Modal */}
        <Dialog open={rejectModalOpen} onClose={() => setRejectModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Iconify icon="eva:close-circle-fill" sx={{ color: 'error.main', mr: 1 }} />
              Reject Product
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="body2">
                The user will be notified of the rejection and can resubmit after addressing the issues.
              </Typography>
            </Alert>
            <TextField
              label="Rejection Reason *"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              fullWidth
              multiline
              rows={4}
              placeholder="Clearly explain why this product is being rejected..."
              required
              error={!rejectionReason.trim()}
              helperText="This will be visible to the user"
              sx={{ mb: 2 }}
            />
            <TextField
              label="Admin Notes (Optional)"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              fullWidth
              multiline
              rows={3}
              placeholder="Add internal notes (not visible to user)..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setRejectModalOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleReject}
              variant="contained"
              color="error"
              loading={actionLoading}
              disabled={!rejectionReason.trim()}
              startIcon={<Iconify icon="eva:close-circle-fill" />}
            >
              Reject Product
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </Page>
  );
}