// components/waste/PublishedProductsTab.jsx - NEW FILE
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardMedia,
  Stack,
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Iconify from '../../components/Iconify';

export default function PublishedProductsTab() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    deactivated: 0
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `http://localhost:7070/api/products/my-products?page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Fetched products:', response.data);
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.totalPages);
      setStatusCounts(response.data.statusCounts);
      setLoading(false);
    } catch (error) {
      console.error('Fetch products error:', error);
      setLoading(false);
      toast.error('Failed to load products');
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');

      await axios.delete(
        `http://localhost:7070/api/products/${selectedProduct._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Delete error:', error);
      
      if (error.response?.status === 403) {
        toast.error(error.response.data.message || 'Cannot delete approved products');
      } else {
        toast.error('Failed to delete product');
      }
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending_verification': return 'warning';
      case 'rejected': return 'error';
      case 'deactivated': return 'default';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return 'eva:checkmark-circle-2-fill';
      case 'pending_verification': return 'eva:clock-outline';
      case 'rejected': return 'eva:close-circle-fill';
      case 'deactivated': return 'eva:slash-outline';
      default: return 'eva:question-mark-circle-outline';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_verification': return 'PENDING';
      case 'approved': return 'APPROVED';
      case 'rejected': return 'REJECTED';
      case 'deactivated': return 'DEACTIVATED';
      default: return status.toUpperCase();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {/* Status Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'warning.lighter' }}>
            <CardContent>
              <Typography variant="h4" color="warning.dark">
                {statusCounts.pending}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'success.lighter' }}>
            <CardContent>
              <Typography variant="h4" color="success.dark">
                {statusCounts.approved}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Approved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'error.lighter' }}>
            <CardContent>
              <Typography variant="h4" color="error.dark">
                {statusCounts.rejected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejected
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'grey.300' }}>
            <CardContent>
              <Typography variant="h4" color="text.secondary">
                {statusCounts.deactivated}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deactivated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Empty State */}
      {products.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Iconify
              icon="eva:inbox-outline"
              sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              No Published Products Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Go to Submission History tab and publish an idea to get started
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Products List */}
          <Stack spacing={2}>
            {products.map((product) => (
              <Card key={product._id} sx={{ '&:hover': { boxShadow: 4 } }}>
                <Grid container>
                  {/* Product Image */}
                  <Grid item xs={12} md={3}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={product.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={product.name}
                      sx={{ objectFit: 'cover', height: '100%' }}
                    />
                  </Grid>

                  {/* Product Details */}
                  <Grid item xs={12} md={9}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        {/* Status Badge */}
                        <Grid item xs={12}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Chip
                              label={getStatusLabel(product.status)}
                              color={getStatusColor(product.status)}
                              icon={<Iconify icon={getStatusIcon(product.status)} />}
                              size="small"
                            />
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                color="primary"
                                onClick={() => navigate(`/dashboard/waste/results/${product.submissionId}`)}
                                title="View Details"
                                size="small"
                              >
                                <Iconify icon="eva:eye-fill" />
                              </IconButton>
                              {(product.status === 'pending_verification' || product.status === 'rejected') && (
                                <IconButton
                                  color="error"
                                  onClick={() => openDeleteDialog(product)}
                                  title="Delete"
                                  size="small"
                                >
                                  <Iconify icon="eva:trash-2-outline" />
                                </IconButton>
                              )}
                            </Stack>
                          </Box>
                        </Grid>

                        {/* Product Info */}
                        <Grid item xs={12}>
                          <Typography variant="h5" gutterBottom>
                            {product.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 2
                            }}
                          >
                            {product.description}
                          </Typography>

                          {/* Waste Details */}
                          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
                            <Chip label={product.material} size="small" variant="outlined" />
                            <Chip label={`${product.quantity}`} size="small" variant="outlined" />
                            <Chip label={product.industry} size="small" variant="outlined" />
                          </Stack>

                          {/* Metrics */}
                          <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  CO₂ Saved
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="success.main">
                                  {product.co2Saved} tons/year
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Water Saved
                                </Typography>
                                <Typography variant="body2" fontWeight="bold" color="info.main">
                                  {(product.waterSaved / 1000).toFixed(0)}K liters/year
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Profit Margin
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {product.profitMargin}%
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Feasibility
                                </Typography>
                                <Typography variant="body2" fontWeight="bold">
                                  {product.feasibilityScore}/100
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Grid>

                        {/* Timestamps */}
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="caption" color="text.secondary">
                            Submitted: {format(new Date(product.createdAt), 'MMM dd, yyyy hh:mm a')}
                            {product.reviewedAt && (
                              <> • Reviewed: {format(new Date(product.reviewedAt), 'MMM dd, yyyy')}</>
                            )}
                          </Typography>
                        </Grid>

                        {/* Status Messages */}
                        {product.status === 'pending_verification' && (
                          <Grid item xs={12}>
                            <Alert severity="info" icon={<Iconify icon="eva:clock-outline" />}>
                              Your product is under review. This may take 1-2 working days.
                            </Alert>
                          </Grid>
                        )}

                        {product.status === 'rejected' && product.rejectionReason && (
                          <Grid item xs={12}>
                            <Alert severity="error">
                              <Typography variant="body2">
                                <strong>Rejection Reason:</strong> {product.rejectionReason}
                              </Typography>
                            </Alert>
                          </Grid>
                        )}

                        {product.status === 'deactivated' && product.deactivationReason && (
                          <Grid item xs={12}>
                            <Alert severity="warning">
                              <Typography variant="body2">
                                <strong>Deactivation Reason:</strong> {product.deactivationReason}
                              </Typography>
                            </Alert>
                          </Grid>
                        )}

                        {product.status === 'approved' && (
                          <Grid item xs={12}>
                            <Alert severity="success" icon={<Iconify icon="eva:checkmark-circle-2-fill" />}>
                              Your product is live on the marketplace! 
                              {product.viewCount > 0 && ` Views: ${product.viewCount}`}
                            </Alert>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            ))}
          </Stack>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(event, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Iconify icon="eva:alert-triangle-fill" sx={{ color: 'error.main', mr: 1 }} />
            Confirm Delete
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this product?
          </Typography>
          {selectedProduct && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Product:</strong> {selectedProduct.name}
              </Typography>
            </Alert>
          )}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleDelete}
            variant="contained"
            color="error"
            loading={deleting}
            startIcon={<Iconify icon="eva:trash-2-outline" />}
          >
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}