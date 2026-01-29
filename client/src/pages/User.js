// pages/admin/UserManagementPage.jsx - Complete admin user management
import { filter } from 'lodash';
import { useState, useEffect } from 'react';
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
  Divider,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import IconButton from '@mui/material/IconButton';
import axios from 'axios';
import { toast } from 'react-toastify';
import Page from '../components/Page';
import Scrollbar from '../components/Scrollbar';
import Iconify from '../components/Iconify';
import SearchNotFound from '../components/SearchNotFound';
import { UserListHead, UserListToolbar } from '../sections/User';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'view', label: 'View', alignRight: false },
  { id: 'email', label: 'Email', alignRight: false },
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'company', label: 'Company', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: 'verification', label: 'Verification', alignRight: false },
  { id: 'role', label: 'Role', alignRight: false },
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

function applySortFilter(array, comparator, query, statusFilter, verificationFilter) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredArray = stabilizedThis.map((el) => el[0]);

  // Apply text query filter
  if (query) {
    filteredArray = filteredArray.filter((user) =>
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.companyName?.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Apply status filter
  if (statusFilter) {
    filteredArray = filteredArray.filter((user) => user.status === statusFilter);
  }

  // Apply verification filter
  if (verificationFilter !== '') {
    const isVerified = verificationFilter === 'verified';
    filteredArray = filteredArray.filter((user) => user.isVerified === isVerified);
  }

  return filteredArray;
}

export default function UserManagementPage() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // State for users
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspending, setSuspending] = useState(false);
  const [reactivateProducts, setReactivateProducts] = useState(true);
const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users from the server
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:7070/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
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
      const newSelecteds = users.map((n) => n._id);
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

  // View user details
  const handleViewUser = (user) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  // Suspend user
  const handleOpenSuspendModal = (user) => {
    setSelectedUser(user);
    setSuspensionReason('');
    setSuspendModalOpen(true);
  };

  const handleOpenReactivateModal = (user) => {
  setSelectedUser(user);
  setReactivateProducts(true); // Default to true
  setReactivateModalOpen(true);
};

  const handleSuspendUser = async () => {
    if (!suspensionReason.trim()) {
      toast.warning('Please provide a suspension reason');
      return;
    }

    try {
      setSuspending(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:7070/api/admin/users/${selectedUser._id}/suspend`,
        { suspensionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('User suspended successfully');
      setSuspendModalOpen(false);
      setSuspensionReason('');
      fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    } finally {
      setSuspending(false);
    }
  };

  // Reactivate user
const handleReactivateUser = async () => {
  try {
    setReactivating(true);
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `http://localhost:7070/api/admin/users/${selectedUser._id}/reactivate`,
      { reactivateProducts }, // Send option to backend
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const { productsReactivated } = response.data;
    
    toast.success(
      `User reactivated successfully${productsReactivated > 0 ? ` (${productsReactivated} products reactivated)` : ''}`
    );
    
    setReactivateModalOpen(false);
    fetchUsers();
  } catch (error) {
    console.error('Error reactivating user:', error);
    toast.error('Failed to reactivate user');
  } finally {
    setReactivating(false);
  }
};


  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const getVerificationColor = (isVerified) => {
    return isVerified ? 'success' : 'warning';
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - users.length) : 0;

  // Apply sorting and filtering
  const filteredUsers = applySortFilter(
    users,
    getComparator(order, orderBy),
    filterName,
    statusFilter,
    verificationFilter
  );

  const isUserNotFound = filteredUsers.length === 0;

  return (
    <Page title="User Management">
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Box>
            <Typography variant="h3" gutterBottom>
              User Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage platform users, verification status, and account access
            </Typography>
          </Box>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter' }}>
              <Typography variant="h4" color="primary.dark">
                {users.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Users
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter' }}>
              <Typography variant="h4" color="success.dark">
                {users.filter((u) => u.isVerified).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verified Users
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.lighter' }}>
              <Typography variant="h4" color="warning.dark">
                {users.filter((u) => !u.isVerified).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Verification
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'error.lighter' }}>
              <Typography variant="h4" color="error.dark">
                {users.filter((u) => u.status === 'suspended').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Suspended Users
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Card>
          {/* UPDATED: Simplified toolbar - filters moved to popover */}
          <UserListToolbar
            numSelected={selected.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            statusFilter={statusFilter}
            onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
            verificationFilter={verificationFilter}
            onVerificationFilterChange={(e) => setVerificationFilter(e.target.value)}
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <UserListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={filteredUsers.length}
                  numSelected={selected.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  {filteredUsers
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const { _id, name, email, companyName, status, isVerified, role } = row;
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
                              onClick={() => handleViewUser(row)}
                              color="primary"
                              size="small"
                            >
                              <Iconify icon="eva:eye-fill" />
                            </IconButton>
                          </TableCell>

                          {/* Email with Avatar */}
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={2}>
                              <Avatar alt={name} sx={{ bgcolor: 'primary.main' }}>
                                {name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Typography variant="subtitle2" noWrap>
                                {email}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell>{name}</TableCell>
                          <TableCell>{companyName || 'N/A'}</TableCell>

                          {/* Status */}
                          <TableCell>
                            <Chip
                              label={status === 'active' ? 'Active' : 'Suspended'}
                              color={status === 'active' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>

                          {/* Verification */}
                          <TableCell>
                            <Chip
                              label={isVerified ? 'Verified' : 'Pending Verification'}
                              color={isVerified ? 'success' : 'warning'}
                              size="small"
                              icon={
                                <Iconify
                                  icon={isVerified ? 'eva:checkmark-circle-2-fill' : 'eva:clock-outline'}
                                />
                              }
                            />
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={role}
                              size="small"
                              color={role === 'admin' ? 'error' : 'default'}
                            />
                          </TableCell>

                          {/* Actions */}
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              {status === 'active' && role !== 'admin' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => handleOpenSuspendModal(row)}
                                >
                                  Suspend
                                </Button>
                              )}
                              {status === 'suspended' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleOpenReactivateModal(row)}
                                >
                                  Reactivate
                                </Button>
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

                {isUserNotFound && (
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
            count={filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>

        {/* View User Details Modal */}
        <Dialog
          open={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h5">User Details</Typography>
              <IconButton onClick={() => setViewModalOpen(false)}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Grid container spacing={3}>
                {/* User Header */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: 'primary.main',
                        fontSize: 32,
                        mr: 3,
                      }}
                    >
                      {selectedUser.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h5">{selectedUser.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.email}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip
                          label={selectedUser.status === 'active' ? 'Active' : 'Suspended'}
                          color={getStatusColor(selectedUser.status)}
                          size="small"
                        />
                        <Chip
                          label={selectedUser.isVerified ? 'Verified' : 'Pending'}
                          color={getVerificationColor(selectedUser.isVerified)}
                          size="small"
                        />
                        <Chip
                          label={selectedUser.role}
                          size="small"
                          color={selectedUser.role === 'admin' ? 'error' : 'default'}
                        />
                      </Stack>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Divider />
                </Grid>

                {/* User Information */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Full Name"
                    value={selectedUser.name || ''}
                    fullWidth
                    disabled
                    InputProps={{
                      startAdornment: (
                        <Iconify icon="eva:person-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    value={selectedUser.email || ''}
                    fullWidth
                    disabled
                    InputProps={{
                      startAdornment: (
                        <Iconify icon="eva:email-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Phone"
                    value={selectedUser.phone || ''}
                    fullWidth
                    disabled
                    InputProps={{
                      startAdornment: (
                        <Iconify icon="eva:phone-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Company"
                    value={selectedUser.companyName || 'N/A'}
                    fullWidth
                    disabled
                    InputProps={{
                      startAdornment: (
                        <Iconify icon="eva:briefcase-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Location"
                    value={selectedUser.location || 'N/A'}
                    fullWidth
                    disabled
                    InputProps={{
                      startAdornment: (
                        <Iconify icon="eva:pin-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    label="Account Created"
                    value={
                      selectedUser.createdAt
                        ? format(new Date(selectedUser.createdAt), 'MMM dd, yyyy hh:mm a')
                        : 'N/A'
                    }
                    fullWidth
                    disabled
                  />
                </Grid>

                {/* Verification Details */}
                {selectedUser.isVerified && (
                  <>
                    <Grid item xs={12}>
                      <Divider />
                      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                        Verification Details
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Verified On"
                        value={
                          selectedUser.verifiedAt
                            ? format(new Date(selectedUser.verifiedAt), 'MMM dd, yyyy hh:mm a')
                            : 'N/A'
                        }
                        fullWidth
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Verified By"
                        value={selectedUser.verifiedBy?.name || 'System'}
                        fullWidth
                        disabled
                      />
                    </Grid>
                  </>
                )}

                {/* Suspension Details */}
                {selectedUser.status === 'suspended' && (
                  <>
                    <Grid item xs={12}>
                      <Alert severity="error">
                        <Typography variant="subtitle2" gutterBottom>
                          Account Suspended
                        </Typography>
                        <Typography variant="body2">
                          <strong>Reason:</strong> {selectedUser.suspensionReason || 'Not specified'}
                        </Typography>
                      </Alert>
                    </Grid>
                  </>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Suspend User Modal */}
        <Dialog open={suspendModalOpen} onClose={() => setSuspendModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Iconify icon="eva:alert-triangle-fill" sx={{ color: 'error.main', mr: 1 }} />
              Suspend User
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedUser && (
              <>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    You are about to suspend <strong>{selectedUser.name}</strong> ({selectedUser.email}).
                    All their approved products will be deactivated.
                  </Typography>
                </Alert>
                <TextField
                  label="Suspension Reason"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Provide a clear reason for suspension..."
                  required
                />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setSuspendModalOpen(false)} disabled={suspending}>
              Cancel
            </Button>
            <Button
              onClick={handleSuspendUser}
              variant="contained"
              color="error"
              disabled={suspending || !suspensionReason.trim()}
              startIcon={<Iconify icon="eva:slash-outline" />}
            >
              {suspending ? 'Suspending...' : 'Suspend User'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* User Reactivation - Add checkbox for products */}
<Dialog open={reactivateModalOpen} onClose={() => setReactivateModalOpen(false)} maxWidth="sm" fullWidth>
  <DialogTitle>
    <Box display="flex" alignItems="center">
      <Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: 'success.main', mr: 1 }} />
      Reactivate User
    </Box>
  </DialogTitle>
  <DialogContent>
    {selectedUser && (
      <>
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            You are about to reactivate <strong>{selectedUser.name}</strong>'s account.
          </Typography>
        </Alert>

        <Box sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 1, mb: 3 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Original Suspension Reason:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {selectedUser.suspensionReason || 'N/A'}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            ℹ️ <strong>Product Reactivation:</strong> Products that were deactivated due to user suspension will be automatically reactivated.
          </Typography>
        </Alert>

        <FormControlLabel
          control={
            <Checkbox
              checked={reactivateProducts}
              onChange={(e) => setReactivateProducts(e.target.checked)}
              defaultChecked
            />
          }
          label={
            <Typography variant="body2">
              Automatically reactivate user's products that were deactivated due to suspension
            </Typography>
          }
        />
      </>
    )}
  </DialogContent>
  <DialogActions sx={{ p: 3 }}>
    <Button onClick={() => setReactivateModalOpen(false)} disabled={reactivating}>
      Cancel
    </Button>
    <LoadingButton
      onClick={handleReactivateUser}
      variant="contained"
      color="success"
      loading={reactivating}
      startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
    >
      Reactivate User
    </LoadingButton>
  </DialogActions>
</Dialog>

      </Container>
    </Page>
  );
}