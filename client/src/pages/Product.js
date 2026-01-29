// pages/admin/AllProductsPage.jsx - Complete admin products management
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Card,
  Table,
  Stack,
  Avatar,
  Button,
  Checkbox,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  TableContainer,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Box,
  Paper,
  Grid,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import { toast } from 'react-toastify';
import Page from '../components/Page';
import Scrollbar from '../components/Scrollbar';
import Iconify from '../components/Iconify';
import SearchNotFound from '../components/SearchNotFound';
import { ProductListHead, ProductListToolbar } from '../sections/Product';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'view', label: 'View', alignRight: false },
  { id: 'name', label: 'Product Name', alignRight: false },
  { id: 'user', label: 'User', alignRight: false },
  { id: 'material', label: 'Material', alignRight: false },
  { id: 'industry', label: 'Industry', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: 'submitted', label: 'Submitted', alignRight: false },
  { id: 'action', label: 'Action', alignRight: false },
];

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query, statusFilter, materialFilter, industryFilter) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredArray = stabilizedThis.map((el) => el[0]);

  // Apply text query filter
  if (query) {
    filteredArray = filteredArray.filter((product) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.material?.toLowerCase().includes(query.toLowerCase()) ||
      product.userId?.name?.toLowerCase().includes(query.toLowerCase()) ||
      product.userId?.companyName?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Apply status filter
  if (statusFilter) {
    filteredArray = filteredArray.filter((product) => product.status === statusFilter);
  }

  // Apply material filter
  if (materialFilter) {
    filteredArray = filteredArray.filter((product) =>
      product.material?.toLowerCase().includes(materialFilter.toLowerCase())
    );
  }

  // Apply industry filter
  if (industryFilter) {
    filteredArray = filteredArray.filter((product) =>
      product.industry?.toLowerCase().includes(industryFilter.toLowerCase())
    );
  }

  return filteredArray;
}

export default function AllProductsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [materialFilter, setMaterialFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for products
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [reactivationNotes, setReactivationNotes] = useState(''); 
  const [deactivating, setDeactivating] = useState(false);
  const [reactivating, setReactivating] = useState(false); 

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:7070/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setLoading(false);
    }
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = products.map((n) => n._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterByName = (event) => {
    setFilterName(event.target.value);
  };

  // View product details
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setViewModalOpen(true);
  };

  // Deactivate product
  const handleOpenDeactivateModal = (product) => {
    setSelectedProduct(product);
    setDeactivationReason('');
    setDeactivateModalOpen(true);
  };

  const handleDeactivateProduct = async () => {
    if (!deactivationReason.trim()) {
      toast.warning('Please provide a deactivation reason');
      return;
    }

    try {
      setDeactivating(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:7070/api/admin/products/${selectedProduct._id}/deactivate`,
        { deactivationReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Product deactivated successfully');
      setDeactivateModalOpen(false);
      setDeactivationReason('');
      fetchProducts();
    } catch (error) {
      console.error('Error deactivating product:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate product');
    } finally {
      setDeactivating(false);
    }
  };

  // Open reactivation modal
  const handleOpenReactivateModal = (product) => {
    setSelectedProduct(product);
    setReactivationNotes('');
    setReactivateModalOpen(true);
  };

  // Reactivate product
  const handleReactivateProduct = async () => {
    try {
      setReactivating(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:7070/api/admin/products/${selectedProduct._id}/reactivate`,
        { reactivationNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Product reactivated successfully');
      setReactivateModalOpen(false);
      setReactivationNotes('');
      fetchProducts();
    } catch (error) {
      console.error('Error reactivating product:', error);
      toast.error(error.response?.data?.message || 'Failed to reactivate product');
    } finally {
      setReactivating(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending_verification':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'deactivated':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_verification':
        return 'PENDING';
      case 'approved':
        return 'APPROVED';
      case 'rejected':
        return 'REJECTED';
      case 'deactivated':
        return 'DEACTIVATED';
      default:
        return status.toUpperCase();
    }
  };

  const getDeactivationLabel = (type) => {
  switch (type) {
    case 'user_suspension':
      return 'User Suspension';
    case 'admin_action':
      return 'Admin Action';
    default:
      return type?.replace('_', ' ');
  }
};


  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toLocaleString() || 0;
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - products.length) : 0;

  const filteredProducts = applySortFilter(
    products,
    getComparator(order, orderBy),
    filterName,
    statusFilter,
    materialFilter,
    industryFilter
  );

  const isProductNotFound = filteredProducts.length === 0;

  return (
    <Page title="All Products">
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Box>
            <Typography variant="h3" gutterBottom>
              All Products
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage all products on the platform
            </Typography>
          </Box>
        </Stack>

        {/* Stats Cards - 5 Cards Layout */}
<Grid container spacing={3} sx={{ mb: 4 }}>
  {/* Total Products */}
  <Grid item xs={12} sm={6} md={2.4}>
    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter' }}>
      <Typography variant="h4" color="primary.dark">
        {products.length}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Total Products
      </Typography>
    </Paper>
  </Grid>

  {/* Pending Review */}
  <Grid item xs={12} sm={6} md={2.4}>
    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.lighter' }}>
      <Typography variant="h4" color="warning.dark">
        {products.filter((p) => p.status === 'pending_verification').length}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Pending Review
      </Typography>
    </Paper>
  </Grid>

  {/* Approved */}
  <Grid item xs={12} sm={6} md={2.4}>
    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter' }}>
      <Typography variant="h4" color="success.dark">
        {products.filter((p) => p.status === 'approved').length}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Approved
      </Typography>
    </Paper>
  </Grid>

  {/* Rejected */}
  <Grid item xs={12} sm={6} md={2.4}>
    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.lighter' }}>
      <Typography variant="h4" color="error.dark">
        {products.filter((p) => p.status === 'rejected').length}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Rejected
      </Typography>
    </Paper>
  </Grid>

  {/* Deactivated */}
  <Grid item xs={12} sm={6} md={2.4}>
    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.300' }}>
      <Typography variant="h4" color="grey.800">
        {products.filter((p) => p.status === 'deactivated').length}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Deactivated
      </Typography>
    </Paper>
  </Grid>
</Grid>

         <Card>
          <ProductListToolbar
            numSelected={selected.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            statusFilter={statusFilter}
            onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
            materialFilter={materialFilter}
            onMaterialFilterChange={(e) => setMaterialFilter(e.target.value)}
            industryFilter={industryFilter}
            onIndustryFilterChange={(e) => setIndustryFilter(e.target.value)}
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <ProductListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={filteredProducts.length}
                  numSelected={selected.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  {filteredProducts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const { _id, name, material, industry, status, userId, createdAt, deactivationType } = row;
                      const isItemSelected = selected.indexOf(_id) !== -1;

                      return (
                        <TableRow
                          hover
                          key={_id}
                          tabIndex={-1}
                          role="checkbox"
                          selected={isItemSelected}
                          aria-checked={isItemSelected}
                        >


                          {/* View Button */}
                          <TableCell>
                            <IconButton
                              onClick={() => handleViewProduct(row)}
                              color="primary"
                              size="small"
                            >
                              <Iconify icon="eva:eye-fill" />
                            </IconButton>
                          </TableCell>

                          {/* Product Name */}
                          <TableCell>
                            <Typography variant="subtitle2" noWrap>
                              {name}
                            </Typography>
                          </TableCell>

                          {/* User */}
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar
                                alt={userId?.name}
                                sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}
                              >
                                {userId?.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" noWrap>
                                  {userId?.name || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {userId?.companyName || ''}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {material}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Typography variant="body2" noWrap>
                              {industry}
                            </Typography>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Stack spacing={0.5}>
                              <Chip
                                label={getStatusLabel(status)}
                                color={getStatusColor(status)}
                                size="small"
                              />
                              {/* Show deactivation type if deactivated */}
                              {status === 'deactivated' && deactivationType && (
                                <Chip
                                  label={getDeactivationLabel(deactivationType)}
                                  size="small"
                                  variant="outlined"
                                  color="default"
                                  sx={{ fontSize: '0.65rem' }}
                                />
                              )}
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <Typography variant="caption">
                              {format(new Date(createdAt), 'MMM dd, yyyy')}
                            </Typography>
                          </TableCell>

                          {/* Actions - UPDATED */}
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {status === 'pending_verification' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => navigate(`/admin/products/${_id}/review`)}
                                >
                                  Review
                                </Button>
                              )}
                              {status === 'approved' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleOpenDeactivateModal(row)}
                                >
                                  Deactivate
                                </Button>
                              )}
                              {status === 'deactivated' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleOpenReactivateModal(row)}
                                  startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                                >
                                  Reactivate
                                </Button>
                              )}
                              {status === 'rejected' && (
                                <Chip label="No Action" size="small" variant="outlined" />
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={8} />
                    </TableRow>
                  )}
                </TableBody>

                {isProductNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={8} sx={{ py: 3 }}>
                        <SearchNotFound searchQuery={filterName} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>

        {/* View Product Details Modal */}
        <Dialog
          open={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h5">Product Details</Typography>
              <IconButton onClick={() => setViewModalOpen(false)}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <Grid container spacing={3}>
                {/* Product Image */}
                <Grid item xs={12}>
                  <Box
                    component="img"
                    src={selectedProduct.imageUrl || 'https://via.placeholder.com/400x300'}
                    alt={selectedProduct.name}
                    sx={{
                      width: '100%',
                      height: 300,
                      objectFit: 'cover',
                      borderRadius: 2,
                    }}
                  />
                </Grid>

                {/* Product Info */}
                <Grid item xs={12}>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={getStatusLabel(selectedProduct.status)}
                      color={getStatusColor(selectedProduct.status)}
                    />
                    {selectedProduct.isPublic && (
                      <Chip label="Public" color="success" variant="outlined" />
                    )}
                  </Stack>
                  <Typography variant="h4" gutterBottom>
                    {selectedProduct.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {selectedProduct.description}
                  </Typography>
                </Grid>

                {/* Details */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Material"
                    value={selectedProduct.material || ''}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Quantity"
                    value={selectedProduct.quantity || ''}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Industry"
                    value={selectedProduct.industry || ''}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Target Market"
                    value={selectedProduct.targetMarket || ''}
                    fullWidth
                    disabled
                  />
                </Grid>

                {/* Metrics */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Impact Metrics
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.lighter' }}>
                    <Typography variant="h6" color="success.dark">
                      {formatNumber(selectedProduct.co2Saved)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      CO₂ Saved (tons/yr)
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.lighter' }}>
                    <Typography variant="h6" color="info.dark">
                      {formatNumber(selectedProduct.waterSaved)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Water Saved (L/yr)
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.lighter' }}>
                    <Typography variant="h6" color="warning.dark">
                      {selectedProduct.profitMargin}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Profit Margin
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.200' }}>
                    <Typography variant="h6">
                      {selectedProduct.feasibilityScore}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Feasibility Score
                    </Typography>
                  </Paper>
                </Grid>

                {/* User Info */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Submitted By
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="User Name"
                    value={selectedProduct.userId?.name || 'N/A'}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Company"
                    value={selectedProduct.userId?.companyName || 'N/A'}
                    fullWidth
                    disabled
                  />
                </Grid>

                {/* Timestamps */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Submitted On"
                    value={format(new Date(selectedProduct.createdAt), 'MMM dd, yyyy hh:mm a')}
                    fullWidth
                    disabled
                  />
                </Grid>
                {selectedProduct.reviewedAt && (
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Reviewed On"
                      value={format(new Date(selectedProduct.reviewedAt), 'MMM dd, yyyy hh:mm a')}
                      fullWidth
                      disabled
                    />
                  </Grid>
                )}

                {/* Rejection/Deactivation Reason */}
                {selectedProduct.rejectionReason && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="subtitle2" gutterBottom>
                        Rejection Reason
                      </Typography>
                      <Typography variant="body2">
                        {selectedProduct.rejectionReason}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
                {selectedProduct.deactivationReason && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      <Typography variant="subtitle2" gutterBottom>
                        Deactivation Reason
                      </Typography>
                      <Typography variant="body2">
                        {selectedProduct.deactivationReason}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Deactivate Product Modal */}
        <Dialog open={deactivateModalOpen} onClose={() => setDeactivateModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Iconify icon="eva:alert-triangle-fill" sx={{ color: 'error.main', mr: 1 }} />
              Deactivate Product
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    You are about to deactivate <strong>{selectedProduct.name}</strong>.
                    It will be removed from the public marketplace.
                  </Typography>
                </Alert>
                <TextField
                  label="Deactivation Reason"
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Provide a clear reason for deactivation..."
                  required
                />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setDeactivateModalOpen(false)} disabled={deactivating}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleDeactivateProduct}
              variant="contained"
              color="error"
              loading={deactivating}
              disabled={!deactivationReason.trim()}
              startIcon={<Iconify icon="eva:slash-outline" />}
            >
              Deactivate Product
            </LoadingButton>
          </DialogActions>
        </Dialog>

          {/* NEW: Reactivate Product Modal */}
        <Dialog 
          open={reactivateModalOpen} 
          onClose={() => setReactivateModalOpen(false)} 
          maxWidth="sm" 
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: 'success.main', mr: 1 }} />
              Reactivate Product
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>This will:</strong>
                    <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                      <li>Reactivate the product "{selectedProduct.name}"</li>
                      <li>Make it visible on the public marketplace</li>
                      <li>Restore it to approved status</li>
                    </ul>
                  </Typography>
                </Alert>

                {/* Show deactivation context */}
                <Box sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 1, mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Original Deactivation Reason:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    {selectedProduct.deactivationReason}
                  </Typography>
                  {selectedProduct.deactivationType && (
                    <>
                      <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ mt: 1 }}>
                        Deactivation Type:
                      </Typography>
                      <Chip 
                        label={getDeactivationLabel(selectedProduct.deactivationType)}
                        size="small"
                        color="default"
                      />
                    </>
                  )}
                </Box>

                {/* Check if user is suspended */}
                {selectedProduct.userId?.status === 'suspended' && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      ⚠️ <strong>Warning:</strong> The product owner's account is currently suspended. 
                      You cannot reactivate this product until the user is reactivated.
                    </Typography>
                  </Alert>
                )}

                <TextField
                  label="Reactivation Notes (Optional)"
                  value={reactivationNotes}
                  onChange={(e) => setReactivationNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Add notes about why this product is being reactivated..."
                  disabled={selectedProduct.userId?.status === 'suspended'}
                />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setReactivateModalOpen(false)} disabled={reactivating}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleReactivateProduct}
              variant="contained"
              color="success"
              loading={reactivating}
              disabled={selectedProduct?.userId?.status === 'suspended'}
              startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
            >
              Reactivate Product
            </LoadingButton>
          </DialogActions>
        </Dialog>


      </Container>
    </Page>
  );
}