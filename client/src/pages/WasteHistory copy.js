import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
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
  Divider,
  LinearProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Iconify from '../components/Iconify';

export default function WasteHistoryPage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(null);
  const [processingSubmissions, setProcessingSubmissions] = useState(new Set());



  useEffect(() => {
    fetchSubmissions();
  }, [page]);

  // Poll for processing submissions
  useEffect(() => {
    if (processingSubmissions.size === 0) return;

    const pollInterval = setInterval(() => {
      processingSubmissions.forEach(async (submissionId) => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get(
            `http://localhost:7070/api/waste/status/${submissionId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data.status === 'completed') {
            // Remove from processing set and refresh list
            setProcessingSubmissions(prev => {
              const newSet = new Set(prev);
              newSet.delete(submissionId);
              return newSet;
            });
            fetchSubmissions();
            toast.success('Re-analysis completed! New ideas generated.');
          } else if (response.data.status === 'failed') {
            setProcessingSubmissions(prev => {
              const newSet = new Set(prev);
              newSet.delete(submissionId);
              return newSet;
            });
            fetchSubmissions();
            toast.error('Re-analysis failed. Please try again.');
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [processingSubmissions]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `http://localhost:7070/api/waste/history?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSubmissions(response.data.submissions);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to load submissions');
      }
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');

      await axios.delete(
        `http://localhost:7070/api/waste/${selectedSubmission._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Submission deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete submission');
    } finally {
      setDeleting(false);
    }
  };

  const handleReanalyze = async (submissionId) => {
    try {
      setReanalyzing(submissionId);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `http://localhost:7070/api/waste/reanalyze/${submissionId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.status === 202) {
        const newSubmissionId = response.data.submissionId;
        
        toast.success('Re-analysis started! Watch the progress below...');
        
        // Add to processing set for polling
        setProcessingSubmissions(prev => new Set(prev).add(newSubmissionId));
        
        // Refresh list to show new submission
        fetchSubmissions();
        setReanalyzing(null);
      }
    } catch (error) {
      console.error('Re-analyze error:', error);
      setReanalyzing(null);
      
      if (error.response?.status === 429) {
        toast.warning(error.response.data.message || 'You have a submission being processed. Please wait.');
      } else if (error.response?.status === 404) {
        toast.error('Original submission not found');
      } else {
        toast.error('Failed to re-analyze. Please try again.');
      }
    }
  };

  const openDeleteDialog = (submission) => {
    setSelectedSubmission(submission);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'eva:checkmark-circle-2-fill';
      case 'processing':
        return 'eva:loader-outline';
      case 'failed':
        return 'eva:alert-triangle-fill';
      default:
        return 'eva:question-mark-circle-outline';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" gutterBottom>
            Submission History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage your waste analysis submissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={() => navigate('/dashboard/waste/')}
        >
          New Submission
        </Button>
      </Box>

      {/* Empty State */}
      {submissions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Iconify
              icon="eva:file-text-outline"
              sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom>
              No Submissions Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start by submitting your first waste data for AI analysis
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => navigate('/dashboard/waste')}
            >
              Submit Waste Data
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Submissions List */}
          <Stack spacing={2}>
            {submissions.map((submission) => (
              <Card key={submission._id} sx={{ '&:hover': { boxShadow: 4 } }}>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    {/* Status Badge */}
                    <Grid item xs={12} sm={2}>
                      <Chip
                        label={submission.status.toUpperCase()}
                        color={getStatusColor(submission.status)}
                        icon={<Iconify icon={getStatusIcon(submission.status)} />}
                        size="small"
                      />
                    </Grid>

                    {/* Submission Details */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="h6" gutterBottom>
                        {submission.material}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Quantity:</strong> {submission.quantity} • 
                        <strong> Industry:</strong> {submission.industry}
                      </Typography>
                      {submission.properties && submission.properties.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {submission.properties.slice(0, 3).map((prop, index) => (
                            <Chip
                              key={index}
                              label={prop}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                          {submission.properties.length > 3 && (
                            <Chip
                              label={`+${submission.properties.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}
                    </Grid>

                    {/* Meta Info */}
                    <Grid item xs={12} sm={2}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Submitted
                      </Typography>
                      <Typography variant="body2">
                        {format(new Date(submission.createdAt), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(submission.createdAt), 'hh:mm a')}
                      </Typography>
                    </Grid>

                    {/* Actions */}
                    <Grid item xs={12} sm={2}>
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        {submission.status === 'completed' && (
                          <>
                            <IconButton
                              color="primary"
                              onClick={() => navigate(`/dashboard/waste/results/${submission._id}`)}
                              title="View Results"
                            >
                              <Iconify icon="eva:eye-fill" />
                            </IconButton>
                            <IconButton
                              color="success"
                              onClick={() => handleReanalyze(submission._id)}
                              disabled={reanalyzing === submission._id}
                              title="Re-analyze with New Ideas"
                            >
                              {reanalyzing === submission._id ? (
                                <CircularProgress size={20} />
                              ) : (
                                <Iconify icon="eva:refresh-outline" />
                              )}
                            </IconButton>
                          </>
                        )}
                        {submission.status === 'processing' && (
                          <Box sx={{ width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="caption" color="warning.main">
                                Processing... AI is generating ideas
                              </Typography>
                            </Box>
                            <LinearProgress 
                              color="warning" 
                              sx={{ height: 6, borderRadius: 1 }}
                            />
                          </Box>
                        )}
                        <IconButton
                          color="error"
                          onClick={() => openDeleteDialog(submission)}
                          title="Delete"
                        >
                          <Iconify icon="eva:trash-2-outline" />
                        </IconButton>
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Ideas Preview for Completed Submissions */}
                  {submission.status === 'completed' && submission.productIdeas.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Generated Ideas ({submission.productIdeas.length})
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {submission.productIdeas.map((idea, index) => (
                            <Chip
                              key={index}
                              label={idea.name}
                              color="success"
                              variant="outlined"
                              size="small"
                              icon={<Iconify icon="eva:bulb-outline" />}
                            />
                          ))}
                        </Stack>
                      </Box>
                    </>
                  )}
                </CardContent>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Iconify icon="eva:alert-triangle-fill" sx={{ color: 'error.main', mr: 1 }} />
            Confirm Delete
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this submission?
          </Typography>
          {selectedSubmission && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Material:</strong> {selectedSubmission.material}<br />
                <strong>Quantity:</strong> {selectedSubmission.quantity}
              </Typography>
            </Alert>
          )}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            This action cannot be undone. All associated data including AI-generated ideas will be permanently deleted.
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
    </Container>
  );
}