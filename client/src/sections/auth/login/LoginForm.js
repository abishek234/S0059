// sections/auth/login/LoginForm.jsx 
import * as Yup from 'yup';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { 
  Stack, 
  IconButton, 
  InputAdornment, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  Button,
  Alert,
  Chip,
  Box,
  Typography,
  Link
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Iconify from '../../../components/Iconify';
import { FormProvider, RHFTextField } from '../../../components/hook-form';

export default function LoginForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [suspendedDialogOpen, setSuspendedDialogOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [suspensionDetails, setSuspensionDetails] = useState({
    reason: '',
    adminEmail: ''
  });

  const LoginSchema = Yup.object().shape({
    email: Yup.string().email('Email must be a valid email address').required('Email is required'),
    password: Yup.string().required('Password is required'),
  });

  const methods = useForm({
    resolver: yupResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = async (data) => {
    try {
      const response = await axios.post('http://localhost:7070/api/auth/login', data);
      
      if (response.status === 200) {
        setEmail(data.email);
        setUserRole(response.data.role);
        setOtpDialogOpen(true);
        
        if (response.data.role === 'admin') {
          toast.info('Admin login detected. OTP sent to your email.');
        } else {
          toast.info('OTP sent to your email');
        }
      }
    } catch (error) {
      console.error(error);
      
      // Handle suspension - NO TOAST, just show dialog
      if (error.response?.status === 403 && error.response?.data?.suspended) {
        const { suspensionReason, adminEmail } = error.response.data;
        setSuspensionDetails({
          reason: suspensionReason,
          adminEmail
        });
        setSuspendedDialogOpen(true);
        // REMOVED: toast.error('Account Suspended');
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      }
    }
  };

  const handleVerifyOtp = async () => {
    setLoadingOtp(true);
    try {
      const response = await axios.post('http://localhost:7070/api/auth/verification-otp', { 
        email, 
        userOtp: otp 
      });

      if (response.status === 200) {
        const { user, token } = response.data;

        // Check if suspended (double-check)
        if (user.status === 'suspended') {
          setSuspensionDetails({
            reason: 'Your account has been suspended. Please contact admin.',
            adminEmail: 'stjosephmtp@gmail.com'
          });
          setOtpDialogOpen(false);
          setSuspendedDialogOpen(true);
          return;
        }

        // Store common session data
        localStorage.setItem('token', token);
        localStorage.setItem('email', user.email);
        localStorage.setItem('name', user.name);
        localStorage.setItem('id', user.id);
        localStorage.setItem('role', user.role);

        // Role-based redirection
        if (user.role === 'admin') {
          localStorage.setItem('isAdmin', 'true');
          toast.success('Admin login successful');
          setOtpDialogOpen(false);
          navigate('/dashboard/app', { replace: true });
        } else {
          localStorage.setItem('companyName', user.companyName || '');
          localStorage.setItem('location', user.location || '');
          toast.success('Logged in successfully');
          setOtpDialogOpen(false);
          navigate('/dashboard/app', { replace: true });
        }
      }
    } catch (error) {
      console.error(error);
      
      // Handle suspension during OTP verification - NO TOAST
      if (error.response?.status === 403 && error.response?.data?.suspended) {
        const { suspensionReason, adminEmail } = error.response.data;
        setSuspensionDetails({
          reason: suspensionReason,
          adminEmail
        });
        setOtpDialogOpen(false);
        setSuspendedDialogOpen(true);
        // REMOVED: toast.error('Account Suspended');
      } else if (error.response?.status === 400) {
        toast.error('Invalid or expired OTP');
      } else {
        toast.error('OTP verification failed');
      }
    } finally {
      setLoadingOtp(false);
    }
  };

  const getRoleChipColor = () => {
    if (userRole === 'admin') return 'error';
    if (userRole === 'user') return 'primary';
    return 'default';
  };

  const getRoleLabel = () => {
    if (userRole === 'admin') return '👨‍💼 Admin Login';
    if (userRole === 'user') return ' User Login';
    return 'Login';
  };

  return (
    <>
      <FormProvider methods={methods} onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={3}>
          <RHFTextField name="email" label="Email address" />
          <RHFTextField
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    <Iconify icon={showPassword ? 'eva:eye-fill' : 'eva:eye-off-fill'} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Stack>
        <br />
        <LoadingButton fullWidth size="large" type="submit" variant="contained" loading={isSubmitting}>
          Login
        </LoadingButton>
      </FormProvider>

      {/* OTP Dialog */}
      <Dialog 
        open={otpDialogOpen} 
        onClose={() => !loadingOtp && setOtpDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <span>Enter OTP</span>
            {userRole && (
              <Chip 
                label={getRoleLabel()} 
                color={getRoleChipColor()} 
                size="small"
                icon={<Iconify icon={userRole === 'admin' ? 'eva:shield-fill' : 'eva:person-fill'} />}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {userRole === 'admin' && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Admin Verification:</strong> Please enter the OTP sent to your registered admin email.
            </Alert>
          )}
          {userRole === 'user' && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Enter the 6-digit OTP sent to your email address.
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="OTP Code"
            type="text"
            fullWidth
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            inputProps={{ 
              maxLength: 6,
              style: { 
                textAlign: 'center', 
                fontSize: '1.5rem', 
                letterSpacing: '0.5rem',
                fontWeight: 'bold'
              }
            }}
            helperText="Enter the 6-digit code from your email"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => {
              setOtpDialogOpen(false);
              setOtp('');
              setUserRole('');
            }} 
            disabled={loadingOtp}
          >
            Cancel
          </Button>
          <LoadingButton 
            onClick={handleVerifyOtp} 
            loading={loadingOtp} 
            variant="contained"
            disabled={otp.length !== 6}
            color={userRole === 'admin' ? 'error' : 'primary'}
          >
            {userRole === 'admin' ? 'Verify Admin' : 'Verify OTP'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Account Suspended Dialog */}
      <Dialog 
        open={suspendedDialogOpen} 
        onClose={() => setSuspendedDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" sx={{ color: 'error.main' }}>
            <Iconify icon="eva:alert-triangle-fill" sx={{ mr: 1, width: 28, height: 28 }} />
            <span>Account Suspended</span>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your account has been suspended and you cannot log in at this time.
            </Typography>
          </Alert>

          <Box sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Suspension Reason:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {suspensionDetails.reason}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            To resolve this issue and reactivate your account, please contact our admin team:
          </Typography>

          <Box sx={{ bgcolor: 'primary.lighter', p: 2, borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Admin Contact:
            </Typography>
            <Link 
              href={`mailto:${suspensionDetails.adminEmail}`}
              sx={{ 
                fontSize: '1.1rem', 
                fontWeight: 600,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {suspensionDetails.adminEmail}
            </Link>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => {
              setSuspendedDialogOpen(false);
              // Reset form
              methods.reset();
            }}
            variant="contained"
            color="error"
            fullWidth
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
