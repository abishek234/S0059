// pages/ProfilePage.jsx - UPDATED with separate verification and account status
import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  Grid, 
  Alert, 
  Box, 
  Card, 
  CardContent,
  Divider,
  Stack,
  Chip,
  Paper
} from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, isValid, parseISO } from 'date-fns';
import Iconify from '../components/Iconify';
import Page from '../components/Page';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const id = localStorage.getItem('id');
  const email = localStorage.getItem('email');
  const role = localStorage.getItem('role');

  useEffect(() => {
    fetchUserData();
  }, [id]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:7070/api/auth/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error('Failed to load profile data');
      setLoading(false);
    }
  };

  // Safe date formatter
  const formatDate = (dateValue, formatString = 'MMM dd, yyyy') => {
    if (!dateValue) return 'N/A';
    
    try {
      const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
      if (isValid(date)) {
        return format(date, formatString);
      }
      return 'Invalid Date';
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const requestOtp = async () => {
    if (!currentPassword || !newPassword) {
      toast.warning('Please enter both current and new passwords first');
      return;
    }

    if (newPassword.length < 6) {
      toast.warning('New password must be at least 6 characters');
      return;
    }

    try {
      await axios.post('http://localhost:7070/api/auth/request-otp', { email });
      toast.success('OTP sent to your email');
      setOtpSent(true);
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error('Failed to send OTP. Please try again.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      toast.warning('Please enter the OTP');
      return;
    }

    setChangingPassword(true);

    try {
      await axios.post('http://localhost:7070/api/auth/change-password', {
        email: user.email,
        currentPassword,
        newPassword,
        otp,
      });
      
      toast.success('Password changed successfully!');
      
      // Reset fields
      setCurrentPassword('');
      setNewPassword('');
      setOtp('');
      setOtpSent(false);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || 'Failed to change password. Check your OTP or current password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const getVerificationStatus = () => {
    if (role === 'admin') {
      return {
        color: 'error',
        icon: 'eva:shield-fill',
        label: 'Admin Account',
        message: 'You have administrator privileges'
      };
    }

    if (user?.isVerified) {
      return {
        color: 'success',
        icon: 'eva:checkmark-circle-2-fill',
        label: 'Verified',
        message: `Verified on ${formatDate(user.verifiedAt)}`
      };
    }

    return {
      color: 'warning',
      icon: 'eva:clock-outline',
      label: 'Pending Verification',
      message: 'Your account will be verified after your first product approval'
    };
  };

  const getAccountStatusColor = (status) => {
    if (status === 'suspended') return 'error';
    if (status === 'active') return 'success';
    return 'default';
  };

  const getAccountStatusLabel = (status) => {
    if (status === 'suspended') return 'Suspended';
    if (status === 'active') return 'Active';
    return 'Pending';
  };

  if (loading) {
    return (
      <Page title="Profile">
        <Container>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <Typography>Loading...</Typography>
          </Box>
        </Container>
      </Page>
    );
  }

  if (!user) {
    return (
      <Page title="Profile">
        <Container>
          <Alert severity="error">Failed to load user data</Alert>
        </Container>
      </Page>
    );
  }

  const verificationStatus = getVerificationStatus();

  return (
    <Page title="Profile">
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom>
            My Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account information and security settings
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Profile Card */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar 
                    alt={user.name} 
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: role === 'admin' ? 'error.main' : 'primary.main',
                      fontSize: 32,
                      mr: 3
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h5">{user.name}</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {user.email}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {/* Verification Status Badge */}
                      <Chip 
                        label={verificationStatus.label}
                        color={verificationStatus.color}
                        size="small"
                        icon={<Iconify icon={verificationStatus.icon} />}
                      />
                      {/* Account Status Badge (Active/Suspended) */}
                      {role !== 'admin' && (
                        <Chip 
                          label={getAccountStatusLabel(user.status)}
                          color={getAccountStatusColor(user.status)}
                          size="small"
                        />
                      )}
                    </Stack>
                  </Box>
                </Box>

                {/* Verification Status Alert */}
                <Alert 
                  severity={verificationStatus.color === 'error' ? 'info' : verificationStatus.color}
                  icon={<Iconify icon={verificationStatus.icon} />}
                  sx={{ mb: 3 }}
                >
                  <Typography variant="body2">
                    <strong>{verificationStatus.label}:</strong> {verificationStatus.message}
                  </Typography>
                </Alert>

                {/* Suspension Warning */}
                {user.status === 'suspended' && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      <strong>Account Suspended:</strong> {user.suspensionReason || 'Contact admin for details'}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Contact admin at <strong>admin@dashboard.com</strong> for reactivation
                    </Typography>
                  </Alert>
                )}

                <Divider sx={{ my: 3 }} />

                {/* User Information */}
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Account Information
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Full Name"
                      value={user.name || ''}
                      fullWidth
                      disabled
                      InputProps={{
                        startAdornment: <Iconify icon="eva:person-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Email Address"
                      value={user.email || ''}
                      fullWidth
                      disabled
                      InputProps={{
                        startAdornment: <Iconify icon="eva:email-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Phone Number"
                      value={user.phone || ''}
                      fullWidth
                      disabled
                      InputProps={{
                        startAdornment: <Iconify icon="eva:phone-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Role"
                      value={role === 'admin' ? 'Administrator' : 'User'}
                      fullWidth
                      disabled
                      InputProps={{
                        startAdornment: <Iconify icon="eva:shield-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>

                  {user.companyName && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Company Name"
                        value={user.companyName || ''}
                        fullWidth
                        disabled
                        InputProps={{
                          startAdornment: <Iconify icon="eva:briefcase-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                  )}

                  {user.location && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Location"
                        value={user.location || ''}
                        fullWidth
                        disabled
                        InputProps={{
                          startAdornment: <Iconify icon="eva:pin-outline" sx={{ mr: 1, color: 'text.secondary' }} />
                        }}
                      />
                    </Grid>
                  )}
                </Grid>

                {/* Account Metadata */}
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Account Details
                </Typography>

                <Paper sx={{ p: 2, bgcolor: 'background.neutral' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Account Created
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(user.createdAt, 'MMM dd, yyyy hh:mm a')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Last Updated
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(user.updatedAt, 'MMM dd, yyyy hh:mm a')}
                      </Typography>
                    </Grid>
                    {user.isVerified && user.verifiedAt && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Verification Date
                        </Typography>
                        <Typography variant="body2">
                          {formatDate(user.verifiedAt, 'MMM dd, yyyy hh:mm a')}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Paper>
              </CardContent>
            </Card>
          </Grid>

          {/* Password Change Card */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Iconify icon="eva:lock-outline" sx={{ mr: 1 }} />
                  Change Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Update your password to keep your account secure
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    fullWidth
                    disabled={otpSent}
                  />

                  <TextField
                    label="New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    disabled={otpSent}
                    helperText="Must be at least 6 characters"
                  />

                  {otpSent && (
                    <TextField
                      label="Enter OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      fullWidth
                      helperText="Check your email for the OTP code"
                    />
                  )}

                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    {!otpSent ? (
                      <Button 
                        variant="contained" 
                        onClick={requestOtp}
                        startIcon={<Iconify icon="eva:paper-plane-fill" />}
                        disabled={!currentPassword || !newPassword}
                      >
                        Request OTP
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="contained" 
                          onClick={handleChangePassword}
                          startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                          disabled={changingPassword || !otp}
                        >
                          {changingPassword ? 'Changing...' : 'Change Password'}
                        </Button>
                        <Button 
                          variant="outlined" 
                          onClick={() => {
                            setOtpSent(false);
                            setOtp('');
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Page>
  );
};

export default ProfilePage;