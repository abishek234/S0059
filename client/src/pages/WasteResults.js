// pages/WasteResultsPage.jsx - UPDATED with enterprise-level status tracking
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Typography,
  Box,
  Chip,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Link
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import Iconify from '../components/Iconify';
import Page from '../components/Page';

export default function WasteResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [selectedIdeaIndex, setSelectedIdeaIndex] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [productStatuses, setProductStatuses] = useState({}); // Track product status for each idea

  useEffect(() => {
    fetchSubmission();
    fetchProductStatuses();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      const response = await axios.get(
        `http://localhost:7070/api/waste/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSubmission(response.data.submission);
      }
      setLoading(false);
    } catch (error) {
      console.error('Fetch error:', error);
      setLoading(false);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 404) {
        toast.error('Submission not found');
        navigate('/dashboard/history');
      } else {
        toast.error('Failed to load results');
      }
    }
  };

  // Fetch product status for published ideas
  const fetchProductStatuses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:7070/api/products/my-products?limit=100',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Map product statuses by publishedProductId
        const statusMap = {};
        response.data.products.forEach(product => {
          if (product.submissionId === id) {
            statusMap[product.ideaIndex] = {
              status: product.status,
              productId: product._id,
              rejectionReason: product.rejectionReason,
              deactivationReason: product.deactivationReason,
              reviewedAt: product.reviewedAt
            };
          }
        });
        setProductStatuses(statusMap);
      }
    } catch (error) {
      console.error('Fetch product statuses error:', error);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toLocaleString() || 0;
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setImageDialogOpen(true);
  };

  const handleCloseImage = () => {
    setImageDialogOpen(false);
    setSelectedImage('');
  };

  const openPublishDialog = (ideaIndex) => {
    setSelectedIdeaIndex(ideaIndex);
    setPublishDialogOpen(true);
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'http://localhost:7070/api/products/publish',
        {
          submissionId: submission._id,
          ideaIndex: selectedIdeaIndex
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Product submitted for verification! Check Published Products tab.');
        setPublishDialogOpen(false);
        setSelectedIdeaIndex(null);
        
        // Refresh to update status
        await fetchSubmission();
        await fetchProductStatuses();
      }
    } catch (error) {
      console.error('Publish error:', error);
      setPublishing(false);

      if (error.response?.status === 409) {
        toast.warning(error.response.data.message || 'You already have a product pending verification');
      } else {
        toast.error('Failed to publish product. Please try again.');
      }
    } finally {
      setPublishing(false);
    }
  };

 const getBannerStatus = (type) => {
    switch (type) {
      case 'approved':
        return 'success.main';
      case 'pending':
        return 'warning.main';
      case 'rejected':
        return 'error.main';
      case 'deactivated':
        return 'grey.500';
      default:
        return 'primary.main';
    }
  };

   const getBorderStatus = (type) => {
    switch (type) {
      case 'approved':
        return 'success.main';
      case 'pending':
        return 'warning.main';
      case 'rejected':
        return 'error.main';
      case 'deactivated':
        return 'grey.500';
      default:
        return 'transparent';
    }
  };

  // Get status info for an idea
  const getIdeaStatusInfo = (ideaIndex, idea) => {
    const productStatus = productStatuses[ideaIndex];

    if (!idea.isPublished && !productStatus) {
      return {
        type: 'not_published',
        color: 'default',
        icon: 'eva:paper-plane-outline',
        label: 'Not Published',
        message: null,
        canPublish: true
      };
    }

    if (productStatus) {
      switch (productStatus.status) {
        case 'pending_verification':
          return {
            type: 'pending',
            color: 'warning',
            icon: 'eva:clock-outline',
            label: 'Pending Verification',
            message: 'Your product is under admin review. This may take 1-2 working days.',
            severity: 'info',
            canPublish: false
          };
        
        case 'approved':
          return {
            type: 'approved',
            color: 'success',
            icon: 'eva:checkmark-circle-2-fill',
            label: 'Approved & Live',
            message: 'Your product is live on the marketplace!',
            severity: 'success',
            canPublish: false
          };
        
        case 'rejected':
          return {
            type: 'rejected',
            color: 'error',
            icon: 'eva:close-circle-fill',
            label: 'Rejected',
            message: (
              <>
                <Typography variant="body2" gutterBottom>
                  <strong>Your submission was rejected.</strong>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Reason:</strong> {productStatus.rejectionReason || 'Not specified'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  You can submit a different idea or contact admin for clarification at{' '}
                  <Link href="mailto:admin@dashboard.com" underline="hover">
                    admin@dashboard.com
                  </Link>
                </Typography>
              </>
            ),
            severity: 'error',
            canPublish: false
          };
        
        case 'deactivated':
          return {
            type: 'deactivated',
            color: 'default',
            icon: 'eva:slash-outline',
            label: 'Deactivated',
            message: (
              <>
                <Typography variant="body2" gutterBottom>
                  <strong>Your product has been deactivated.</strong>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Reason:</strong> {productStatus.deactivationReason || 'Not specified'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  To reactivate this product, please contact admin at{' '}
                  <Link href="mailto:admin@dashboard.com" underline="hover">
                    admin@dashboard.com
                  </Link>
                </Typography>
              </>
            ),
            severity: 'warning',
            canPublish: false
          };
        
        default:
          return {
            type: 'unknown',
            color: 'default',
            icon: 'eva:question-mark-circle-outline',
            label: 'Unknown Status',
            message: null,
            canPublish: false
          };
      }
    }

    return {
      type: 'not_published',
      color: 'default',
      icon: 'eva:paper-plane-outline',
      label: 'Not Published',
      message: null,
      canPublish: true
    };
  };

  const handleExport = () => {
    const exportText = `
AI UPCYCLING RECOMMENDATIONS
Generated: ${format(new Date(submission.createdAt), 'PPpp')}

INPUT DATA:
Material: ${submission.material}
Quantity: ${submission.quantity}
Industry: ${submission.industry}
Properties: ${submission.properties.join(', ')}

PRODUCT IDEAS:
${submission.productIdeas.map((idea, index) => `
${index + 1}. ${idea.name}
   Description: ${idea.description}
   Target Market: ${idea.targetMarket || 'N/A'}
   
   IMPACT METRICS:
   - CO₂ Saved: ${formatNumber(idea.co2Saved)} tons/year
   - Water Saved: ${formatNumber(idea.waterSaved)} liters/year
   - Profit Margin: ${idea.profitMargin}%
   - Feasibility Score: ${idea.feasibilityScore}/100
`).join('\n')}

Generated by GenAI Upcycling Designer
    `.trim();

    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upcycling-ideas-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <Page title="Results">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress size={60} />
          </Box>
        </Container>
      </Page>
    );
  }

  if (!submission) {
    return (
      <Page title="Results">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">Submission not found</Alert>
        </Container>
      </Page>
    );
  }

  const totalCO2 = submission.productIdeas.reduce((sum, idea) => sum + (idea.co2Saved || 0), 0);
  const totalWater = submission.productIdeas.reduce((sum, idea) => sum + (idea.waterSaved || 0), 0);
  const avgProfit = Math.round(
    submission.productIdeas.reduce((sum, idea) => sum + (idea.profitMargin || 0), 0) / 
    submission.productIdeas.length
  );

  return (
    <Page title="Results">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Button
                startIcon={<Iconify icon="eva:arrow-back-fill" />}
                onClick={() => navigate('/dashboard/history')}
                sx={{ mb: 2 }}
              >
                Back to History
              </Button>
              <Typography variant="h3" gutterBottom>
                AI-Generated Upcycling Ideas
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Created {format(new Date(submission.createdAt), 'MMMM dd, yyyy • hh:mm a')}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="eva:download-outline" />}
              onClick={handleExport}
            >
              Export Report
            </Button>
          </Box>
        </Box>

        {/* Info Alert about Publishing */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            📋 Publishing Workflow
          </Typography>
          <Typography variant="caption">
            <strong>Step 1:</strong> Select one idea to publish for verification<br />
            <strong>Step 2:</strong> Admin reviews within 1-2 working days<br />
            <strong>Step 3:</strong> Track status in real-time below or in published products<br />
            <strong>Step 4:</strong> Once approved, your product goes live on the marketplace
          </Typography>
        </Alert>

        {/* Input Summary Card */}
        <Card sx={{ mb: 4, bgcolor: 'background.neutral' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Iconify icon="eva:file-text-outline" sx={{ mr: 1 }} />
              Input Data
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Material</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {submission.material}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Quantity</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {submission.quantity}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="text.secondary">Industry</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {submission.industry}
                </Typography>
              </Grid>
              {submission.properties && submission.properties.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Properties
                  </Typography>
                  <Box>
                    {submission.properties.map((prop, index) => (
                      <Chip
                        key={index}
                        label={prop}
                        size="small"
                        variant="outlined"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Aggregate Impact Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.lighter' }}>
              <Iconify icon="eva:trending-down-outline" sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.dark">
                {formatNumber(totalCO2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Tons CO₂ Saved/Year
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.lighter' }}>
              <Iconify icon="eva:droplet-outline" sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.dark">
                {formatNumber(totalWater)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Liters Water Saved/Year
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.lighter' }}>
              <Iconify icon="eva:trending-up-outline" sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.dark">
                {avgProfit}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Profit Margin
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Product Ideas */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
          Product Ideas ({submission.productIdeas.length})
        </Typography>

        <Stack spacing={4}>
          {submission.productIdeas.map((idea, index) => {
            const statusInfo = getIdeaStatusInfo(index, idea);

            return (
              <Card 
                key={index} 
                sx={{ 
                  overflow: 'hidden', 
                  '&:hover': { boxShadow: 6 },
                  border: statusInfo.type !== 'not_published' ? '2px solid' : 'none',
                  borderColor: getBorderStatus(statusInfo.type)
                }}
              >
                {/* Status Banner */}
                {statusInfo.type !== 'not_published' && (
                  <Box 
                    sx={{ 
                      bgcolor: getBannerStatus(statusInfo.type),
                      color: 'white', 
                      py: 1, 
                      px: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <Iconify icon={statusInfo.icon} sx={{ mr: 1, fontSize: 20 }} />
                      <Typography variant="subtitle2" fontWeight="bold">
                        {statusInfo.label}
                      </Typography>
                    </Box>
                    {productStatuses[index]?.reviewedAt && (
                      <Typography variant="caption">
                        Reviewed: {format(new Date(productStatuses[index].reviewedAt), 'MMM dd, yyyy')}
                      </Typography>
                    )}
                  </Box>
                )}

                <Grid container>
                  {/* Image */}
                  <Grid item xs={12} md={5}>
                    <Box 
                      sx={{ 
                        position: 'relative', 
                        cursor: 'pointer',
                        height: '100%'
                      }} 
                      onClick={() => handleImageClick(idea.imageUrl)}
                    >
                      <CardMedia
                        component="img"
                        height="400"
                        image={idea.imageUrl}
                        alt={idea.name}
                        sx={{ 
                          objectFit: 'cover',
                          width: '100%',
                          height: '100%',
                          transition: 'transform 0.3s',
                          '&:hover': {
                            transform: 'scale(1.02)'
                          }
                        }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(0, 0, 0, 0.6)',
                          borderRadius: 1,
                          p: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Iconify icon="eva:expand-outline" sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                    </Box>
                  </Grid>

                  {/* Content */}
                  <Grid item xs={12} md={7}>
                    <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      {/* Header */}
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h5" component="div">
                            {index + 1}. {idea.name}
                          </Typography>
                          <Chip
                            label={`${idea.feasibilityScore}/100`}
                            color="primary"
                            size="small"
                            icon={<Iconify icon="eva:star-fill" />}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {idea.description}
                        </Typography>
                        {idea.targetMarket && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Iconify icon="eva:people-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">
                              <strong>Target Market:</strong> {idea.targetMarket}
                            </Typography>
                          </Box>
                        )}

                        {/* Status Alert */}
                        {statusInfo.message && (
                          <Alert severity={statusInfo.severity} sx={{ mb: 2 }}>
                            {statusInfo.message}
                          </Alert>
                        )}

                        {/* Action Button */}
                        <Box sx={{ mb: 2 }}>
                          {statusInfo.canPublish ? (
                            <Tooltip title="Submit this idea for admin verification. Only one product can be published at a time.">
                              <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                startIcon={<Iconify icon="eva:paper-plane-outline" />}
                                onClick={() => openPublishDialog(index)}
                              >
                                Submit for Verification
                              </Button>
                            </Tooltip>
                          ) : statusInfo.type === 'approved' && (
                            <Button
                              variant="outlined"
                              color="success"
                              fullWidth
                              startIcon={<Iconify icon="eva:eye-outline" />}
                              onClick={() => navigate('/dashboard/history')}
                            >
                              View in Published Products
                            </Button>
                          )}
                        </Box>

                        {/* Business Validation Questions */}
                        {idea.researchQuestions && idea.researchQuestions.length > 0 && (
                          <Paper sx={{ p: 2, bgcolor: 'info.lighter', mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'info.dark' }}>
                              <Iconify icon="eva:question-mark-circle-outline" sx={{ mr: 1 }} />
                              Key Research Questions
                            </Typography>
                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                              {idea.researchQuestions.map((question, idx) => (
                                <Typography key={idx} component="li" variant="caption" color="text.secondary">
                                  {question}
                                </Typography>
                              ))}
                            </Box>
                          </Paper>
                        )}

                        {/* Success Factors */}
                        {idea.successFactors && idea.successFactors.length > 0 && (
                          <Paper sx={{ p: 2, bgcolor: 'success.lighter', mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'success.dark', mb: 1.5 }}>
                              <Iconify icon="eva:checkmark-circle-outline" sx={{ mr: 1 }} />
                              Critical Success Factors
                            </Typography>
                            <Stack spacing={1}>
                              {idea.successFactors.map((factor, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                  <Iconify 
                                    icon="eva:checkmark-fill" 
                                    sx={{ color: 'success.main', mr: 1, mt: 0.5, fontSize: 16 }} 
                                  />
                                  <Typography variant="body2" color="text.secondary">
                                    {factor}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </Paper>
                        )}
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Metrics */}
                      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Iconify icon="eva:bar-chart-outline" sx={{ mr: 1 }} />
                        Impact Metrics
                      </Typography>
                      <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                          <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              CO₂ Saved
                            </Typography>
                            <Typography variant="h6" color="success.dark">
                              {formatNumber(idea.co2Saved)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              tons/year
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Water Saved
                            </Typography>
                            <Typography variant="h6" color="info.dark">
                              {formatNumber(idea.waterSaved)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              liters/year
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ p: 2, bgcolor: 'warning.lighter', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Profit Margin
                            </Typography>
                            <Typography variant="h6" color="warning.dark">
                              {idea.profitMargin}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              estimated
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ p: 2, bgcolor: 'grey.200', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Feasibility
                            </Typography>
                            <Typography variant="h6">
                              {idea.feasibilityScore}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              score
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            );
          })}
        </Stack>

        {/* Bottom Actions */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Iconify icon="eva:arrow-back-outline" />}
            onClick={() => navigate('/dashboard/history')}
          >
            Back to History
          </Button>
          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="eva:plus-outline" />}
            onClick={() => navigate('/dashboard/waste')}
          >
            Submit New Waste
          </Button>
        </Box>

        {/* Business Validation Notice */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            📞 Need Help?
          </Typography>
          <Typography variant="caption">
            For questions about verification status, rejections, or reactivations, contact our admin team at{' '}
            <Link href="mailto:admin@dashboard.com" underline="hover" fontWeight="bold">
              admin@dashboard.com
            </Link>
          </Typography>
        </Alert>
      </Container>

      {/* Image Lightbox Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={handleCloseImage}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={handleCloseImage}
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.9)'
              },
              zIndex: 1
            }}
          >
            <Iconify icon="eva:close-fill" />
          </IconButton>
          <Box
            component="img"
            src={selectedImage}
            alt="Product preview"
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '90vh',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialogOpen} onClose={() => !publishing && setPublishDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Iconify icon="eva:paper-plane-outline" sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
            Submit for Verification
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedIdeaIndex !== null && submission.productIdeas[selectedIdeaIndex] && (
            <>
              <Typography variant="body1" gutterBottom>
                You're about to submit this idea for admin verification:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.neutral', my: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {submission.productIdeas[selectedIdeaIndex].name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {submission.productIdeas[selectedIdeaIndex].description}
                </Typography>
              </Paper>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  ℹ️ <strong>Verification Process:</strong>
                </Typography>
                <Typography variant="caption" component="div" sx={{ mt: 1 }}>
                  • Review time: 1-2 working days<br />
                  • You'll see real-time status updates here<br />
                  • Only ONE product can be pending at a time<br />
                  • Contact admin@dashboard.com for questions
                </Typography>
              </Alert>
              <Alert severity="warning">
                <Typography variant="body2">
                  ⚠️ Once approved, your product will be publicly visible with your company information.
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setPublishDialogOpen(false)} disabled={publishing}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handlePublish}
            variant="contained"
            color="primary"
            loading={publishing}
            startIcon={<Iconify icon="eva:paper-plane-outline" />}
          >
            Submit for Verification
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Page>
  );
}
