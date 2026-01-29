// pages/admin/ReportsPage.jsx - Complete reports management
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Card,
  Table,
  Stack,
  Button,
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
  IconButton,
  Divider,
  Avatar
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import { toast } from 'react-toastify';
import Page from '../components/Page';
import Scrollbar from '../components/Scrollbar';
import Iconify from '../components/Iconify';
import { ReportListHead } from '../sections/Report';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'product', label: 'Product', alignRight: false },
  { id: 'reporter', label: 'Reported By', alignRight: false },
  { id: 'reason', label: 'Reason', alignRight: false },
  { id: 'date', label: 'Date', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
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

function applySortFilter(array, comparator, statusFilter) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredArray = stabilizedThis.map((el) => el[0]);

  if (statusFilter) {
    filteredArray = filteredArray.filter((report) => report.status === statusFilter);
  }

  return filteredArray;
}

export default function ReportsPage() {
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveAction, setResolveAction] = useState('dismiss'); // 'dismiss' or 'deactivate'
  const [adminNotes, setAdminNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:7070/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.reports || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
      setLoading(false);
    }
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setViewModalOpen(true);
  };

  const handleOpenResolveModal = (report, action) => {
    setSelectedReport(report);
    setResolveAction(action);
    setAdminNotes('');
    setResolveModalOpen(true);
  };

  const handleResolveReport = async () => {
    try {
      setResolving(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:7070/api/admin/reports/${selectedReport._id}/resolve`,
        { action: resolveAction, adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        resolveAction === 'deactivate'
          ? 'Report resolved and product deactivated'
          : 'Report dismissed'
      );
      setResolveModalOpen(false);
      fetchReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('Failed to resolve report');
    } finally {
      setResolving(false);
    }
  };

  const getStatusColor = (status) => {
    return status === 'pending' ? 'warning' : 'default';
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - reports.length) : 0;

  const filteredReports = applySortFilter(reports, getComparator(order, orderBy), statusFilter);

  return (
    <Page title="Reports Management">
      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Box>
            <Typography variant="h3" gutterBottom>
              Reports Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and resolve user-reported content
            </Typography>
          </Box>
        </Stack>

        {/* Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.lighter' }}>
              <Typography variant="h4" color="warning.dark">
                {reports.filter((r) => r.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pending Reports
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter' }}>
              <Typography variant="h4" color="success.dark">
                {reports.filter((r) => r.status === 'resolved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Resolved Reports
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.lighter' }}>
              <Typography variant="h4" color="primary.dark">
                {reports.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Reports
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Filter Buttons */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant={statusFilter === 'pending' ? 'contained' : 'outlined'}
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'resolved' ? 'contained' : 'outlined'}
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved
          </Button>
          <Button variant={statusFilter === '' ? 'contained' : 'outlined'} onClick={() => setStatusFilter('')}>
            All
          </Button>
        </Stack>

        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <ReportListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  onRequestSort={handleRequestSort}
                />
                <TableBody>
                  {filteredReports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const { _id, productId, reportedBy, reason, createdAt, status } = row;

                    return (
                      <TableRow hover key={_id} tabIndex={-1}>
                        {/* Product */}
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar
                              variant="rounded"
                              src={productId?.imageUrl}
                              sx={{ width: 48, height: 48 }}
                            />
                            <Box>
                              <Typography variant="subtitle2" noWrap>
                                {productId?.name || 'Deleted Product'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {productId?.material || 'N/A'}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        {/* Reporter */}
                        <TableCell>
                          <Typography variant="body2">{reportedBy || 'Anonymous'}</Typography>
                        </TableCell>

                        {/* Reason */}
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {reason}
                          </Typography>
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          <Typography variant="caption">
                            {format(new Date(createdAt), 'MMM dd, yyyy')}
                          </Typography>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip label={status.toUpperCase()} color={getStatusColor(status)} size="small" />
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <IconButton size="small" color="info" onClick={() => handleViewReport(row)}>
                              <Iconify icon="eva:eye-fill" />
                            </IconButton>
                            {status === 'pending' && (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="success"
                                  onClick={() => handleOpenResolveModal(row, 'dismiss')}
                                >
                                  Dismiss
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="error"
                                  onClick={() => handleOpenResolveModal(row, 'deactivate')}
                                >
                                  Deactivate
                                </Button>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>

                {filteredReports.length === 0 && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <Typography variant="h6" color="text.secondary">
                          No reports found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                )}
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredReports.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>

        {/* View Report Modal */}
        <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h5">Report Details</Typography>
              <IconButton onClick={() => setViewModalOpen(false)}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedReport && (
              <Grid container spacing={3}>
                {/* Product Info */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Reported Product
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar
                        variant="rounded"
                        src={selectedReport.productId?.imageUrl}
                        sx={{ width: 64, height: 64 }}
                      />
                      <Box>
                        <Typography variant="subtitle1">
                          {selectedReport.productId?.name || 'Deleted Product'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedReport.productId?.material || 'N/A'}
                        </Typography>
                        <Chip
                          label={selectedReport.productId?.status || 'N/A'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>

                {/* Report Details */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Report Information
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Reported By" value={selectedReport.reportedBy || 'Anonymous'} fullWidth disabled />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Report Date"
                    value={format(new Date(selectedReport.createdAt), 'MMM dd, yyyy hh:mm a')}
                    fullWidth
                    disabled
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Reason"
                    value={selectedReport.reason}
                    fullWidth
                    multiline
                    rows={3}
                    disabled
                  />
                </Grid>
                {selectedReport.description && (
                  <Grid item xs={12}>
                    <TextField
                      label="Additional Details"
                      value={selectedReport.description}
                      fullWidth
                      multiline
                      rows={3}
                      disabled
                    />
                  </Grid>
                )}

                {/* Resolution Info */}
                {selectedReport.status === 'resolved' && (
                  <>
                    <Grid item xs={12}>
                      <Divider />
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Resolution
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Resolved By"
                        value={selectedReport.resolvedBy?.name || 'N/A'}
                        fullWidth
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Resolved On"
                        value={
                          selectedReport.resolvedAt
                            ? format(new Date(selectedReport.resolvedAt), 'MMM dd, yyyy hh:mm a')
                            : 'N/A'
                        }
                        fullWidth
                        disabled
                      />
                    </Grid>
                    {selectedReport.adminNotes && (
                      <Grid item xs={12}>
                        <TextField
                          label="Admin Notes"
                          value={selectedReport.adminNotes}
                          fullWidth
                          multiline
                          rows={3}
                          disabled
                        />
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setViewModalOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Resolve Report Modal */}
        <Dialog open={resolveModalOpen} onClose={() => setResolveModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Iconify
                icon={resolveAction === 'deactivate' ? 'eva:alert-triangle-fill' : 'eva:checkmark-circle-2-fill'}
                sx={{ color: resolveAction === 'deactivate' ? 'error.main' : 'success.main', mr: 1 }}
              />
              {resolveAction === 'deactivate' ? 'Deactivate Product' : 'Dismiss Report'}
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedReport && (
              <>
                <Alert severity={resolveAction === 'deactivate' ? 'error' : 'success'} sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    {resolveAction === 'deactivate' ? (
                      <>
                        <strong>This will:</strong>
                        <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                          <li>Deactivate the product "{selectedReport.productId?.name}"</li>
                          <li>Remove it from the marketplace</li>
                          <li>Mark this report as resolved</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        This will mark the report as resolved without taking action on the product. Use this when
                        the report is invalid or doesn't require product removal.
                      </>
                    )}
                  </Typography>
                </Alert>
                <TextField
                  label="Admin Notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  fullWidth
                  multiline
                  rows={4}
                  placeholder="Add notes about your decision..."
                />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setResolveModalOpen(false)} disabled={resolving}>
              Cancel
            </Button>
            <LoadingButton
              onClick={handleResolveReport}
              variant="contained"
              color={resolveAction === 'deactivate' ? 'error' : 'success'}
              loading={resolving}
            >
              {resolveAction === 'deactivate' ? 'Deactivate Product' : 'Dismiss Report'}
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Container>
    </Page>
  );
}