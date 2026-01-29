import * as Yup from 'yup';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Container,
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
  Chip,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import { toast } from 'react-toastify';
import Iconify from '../components/Iconify';
import { FormProvider, RHFTextField, RHFSelect } from '../components/hook-form';

// Industry options
const INDUSTRIES = [
  'Textile Manufacturing',
  'Food Processing',
  'Construction',
  'Plastic Manufacturing',
  'Paper & Pulp',
  'Metal Processing',
  'Chemical Industry',
  'Agriculture',
  'Electronics',
  'Automotive',
  'Other'
];

// Common waste properties
const COMMON_PROPERTIES = [
  'Biodegradable',
  'Recyclable',
  'Fibrous',
  'Organic',
  'Soft',
  'Durable',
  'Lightweight',
  'Heat-resistant',
  'Water-resistant',
  'Flexible',
  'Rigid',
  'Absorbent',
  'Non-toxic'
];

export default function WasteSubmissionPage() {
  const navigate = useNavigate();
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [submissionId, setSubmissionId] = useState(null);
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const WasteSchema = Yup.object().shape({
    material: Yup.string()
      .min(3, 'Material description must be at least 3 characters')
      .max(200, 'Material description must be less than 200 characters')
      .required('Material type is required'),
    quantity: Yup.string()
      .required('Quantity is required')
      .matches(
        /^\d+(\.\d+)?\s*(tons?|kg|tonnes?|metric tons?)(\s*\/\s*(month|year|week|day))?$/i,
        'Format: "10 tons/month" or "500 kg/week"'
      ),
    industry: Yup.string()
      .required('Industry is required'),
  });

  const methods = useForm({
    resolver: yupResolver(WasteSchema),
    defaultValues: {
      material: '',
      quantity: '',
      industry: '',
    },
  });

  const { handleSubmit, formState: { isSubmitting }, reset } = methods;

  // Poll submission status
  const pollSubmissionStatus = async (id) => {
    const token = localStorage.getItem('token');
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes (5 second intervals)

    const poll = setInterval(async () => {
      try {
        attempts+=1;
        
        const response = await axios.get(
          `http://localhost:7070/api/waste/status/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const { status, ideasCount } = response.data;

        if (status === 'completed') {
          clearInterval(poll);
          setIsProcessing(false);
          setProcessingStatus('completed');
          toast.success(`Generated ${ideasCount} innovative product ideas!`);
          
          // Navigate to results page after 1 second
          setTimeout(() => {
            navigate(`/dashboard/waste/results/${id}`);
          }, 1000);
        } else if (status === 'failed') {
          clearInterval(poll);
          setIsProcessing(false);
          toast.error('Processing failed. Please try again.');
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          setIsProcessing(false);
          toast.warning('Processing is taking longer than expected. Check your history later.');
          navigate('/dashboard/history');
        } else {
          // Update status message
          const progress = Math.min((attempts / maxAttempts) * 100, 90);
          setProcessingStatus(`Processing... ${Math.round(progress)}%`);
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    }, 5000); // Check every 5 seconds
  };

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        navigate('/login');
        return;
      }

      // Check cooldown (15 seconds between submissions)
      const now = Date.now();
      const cooldown = 15000; // 15 seconds
      const timeSinceLastSubmission = now - lastSubmissionTime;

      if (timeSinceLastSubmission < cooldown) {
        const remainingSeconds = Math.ceil((cooldown - timeSinceLastSubmission) / 1000);
        toast.warning(`Please wait ${remainingSeconds} seconds before submitting again`);
        return;
      }

      const payload = {
        material: data.material,
        quantity: data.quantity,
        properties: selectedProperties,
        industry: data.industry,
      };

      const response = await axios.post(
        'http://localhost:7070/api/waste/submit',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.status === 202) {
        const { submissionId } = response.data;
        setSubmissionId(submissionId);
        setIsProcessing(true);
        setProcessingStatus('Analyzing waste properties...');
        setLastSubmissionTime(now);
        
        toast.info('Processing your submission. This may take 30-60 seconds...');
        
        // Start polling
        pollSubmissionStatus(submissionId);
        
        // Clear form
        reset();
        setSelectedProperties([]);
      }
    } catch (error) {
      console.error('Submission error:', error);
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else if (error.response?.status === 429) {
        toast.warning(error.response.data.message || 'You have a submission being processed. Please wait.');
      } else if (error.response?.status === 409) {
        const { existingSubmissionId, existingSubmission } = error.response.data;
        
        toast.error(
          error.response.data.message || 'Duplicate submission detected',
          {
            autoClose: 5000,
            onClick: () => {
              if (existingSubmission?.status === 'completed') {
                navigate(`/dashboard/waste/results/${existingSubmissionId}`);
              } else {
                navigate('/dashboard/history');
              }
            }
          }
        );
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.message || 'Invalid input. Please check your data.');
      } else {
        toast.error('Submission failed. Please try again.');
      }
    }
  };

  const handlePropertyToggle = (property) => {
    setSelectedProperties((prev) =>
      prev.includes(property)
        ? prev.filter((p) => p !== property)
        : [...prev, property]
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Submit Waste for AI Analysis
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Enter your industrial waste details and our AI will generate innovative upcycling ideas
          with visual mockups and impact metrics.
        </Typography>
      </Box>

      {/* Processing Status */}
      {isProcessing && (
        <Alert 
          severity="info" 
          icon={<CircularProgress size={20} />}
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {processingStatus}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Our AI is analyzing your waste data and generating creative product ideas...
          </Typography>
          <LinearProgress sx={{ mt: 1 }} />
        </Alert>
      )}

      {/* Main Form Card */}
      <Card>
        <CardContent sx={{ p: 4 }}>
          <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              {/* Material Type */}
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  1. What type of waste material do you have?
                </Typography>
                <RHFTextField
                  name="material"
                  placeholder="e.g., Cotton textile waste, Plastic packaging scraps, Wood sawdust"
                  multiline
                  rows={2}
                  helperText="Describe the waste material in detail"
                />
              </Box>

              {/* Quantity */}
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  2. How much waste do you generate?
                </Typography>
                <RHFTextField
                  name="quantity"
                  placeholder="e.g., 10 tons/month, 500 kg/week"
                  helperText="Include quantity and time period (e.g., tons/month, kg/day)"
                />
              </Box>

              {/* Industry */}
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  3. Which industry does this waste come from?
                </Typography>
                <RHFSelect
                  name="industry"
                  placeholder="Select your industry"
                  options={INDUSTRIES.map((industry) => ({
                    label: industry,
                    value: industry,
                  }))}
                />
              </Box>

              {/* Properties */}
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  4. What are the material properties? (Optional)
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                  Select all that apply to help our AI generate more accurate recommendations
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={1}>
                    {COMMON_PROPERTIES.map((property) => (
                      <Grid item key={property}>
                        <Chip
                          label={property}
                          onClick={() => handlePropertyToggle(property)}
                          color={selectedProperties.includes(property) ? 'primary' : 'default'}
                          variant={selectedProperties.includes(property) ? 'filled' : 'outlined'}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Selected: {selectedProperties.length > 0 ? selectedProperties.join(', ') : 'None'}
                </Typography>
              </Box>

              {/* Info Box */}
              <Alert severity="success" icon={<Iconify icon="eva:bulb-outline" />}>
                <Typography variant="subtitle2" gutterBottom>
                  What happens next?
                </Typography>
                <Typography variant="caption" component="div">
                  • AI generates 3 innovative product ideas<br />
                  • Visual mockups created for each concept<br />
                  • Environmental impact metrics calculated<br />
                  • Profitability analysis provided<br />
                  • Processing time: 30-60 seconds
                </Typography>
              </Alert>

              {/* Submit Button */}
               <LoadingButton
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                loading={isSubmitting || isProcessing}
                startIcon={<Iconify icon="eva:flash-outline" />}
                disabled={isProcessing || cooldownRemaining > 0}
              >
                {(() => {
                  if (isProcessing) return 'Processing...';
                  if (cooldownRemaining > 0) return `Wait ${cooldownRemaining}s`;
                  return 'Generate AI Recommendations';
                })()}
              </LoadingButton>

              {/* Secondary Action */}
              <LoadingButton
                fullWidth
                size="medium"
                variant="outlined"
                onClick={() => navigate('/dashboard/history')}
                startIcon={<Iconify icon="eva:clock-outline" />}
                disabled={isProcessing}
              >
                View Submission History
              </LoadingButton>
            </Stack>
          </FormProvider>
        </CardContent>
      </Card>

      {/* Example Card */}
      <Card sx={{ mt: 3, bgcolor: 'background.neutral' }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <Iconify icon="eva:info-outline" sx={{ mr: 1 }} />
            Example Submission
          </Typography>
          <Box sx={{ pl: 4 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Material:</strong> Cotton textile waste from garment manufacturing<br />
              <strong>Quantity:</strong> 15 tons/month<br />
              <strong>Industry:</strong> Textile Manufacturing<br />
              <strong>Properties:</strong> Biodegradable, Soft, Absorbent, Fibrous
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}