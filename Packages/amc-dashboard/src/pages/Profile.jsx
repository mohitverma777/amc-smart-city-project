import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Divider,
  Alert,
  Tab,
  Tabs,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import authService from '../services/auth';

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => (
  <div hidden={value !== index} {...other}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

// Profile Update Schema
const profileSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  mobileNumber: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid mobile number'),
});

// Password Change Schema
const passwordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required('Current password is required'),
  newPassword: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});

const Profile = () => {
  const [user, setUser] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Profile form
  const profileForm = useForm({
    resolver: yupResolver(profileSchema),
  });

  // Password form
  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    
    if (currentUser) {
      profileForm.reset({
        name: currentUser.name || '',
        email: currentUser.email || '',
        mobileNumber: currentUser.mobileNumber || '',
      });
    }
  }, [profileForm]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  const onProfileSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Profile update failed');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully!');
      passwordForm.reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Password change failed');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                fontSize: '2rem',
              }}
              src={user.profilePicture}
            >
              {user.name?.charAt(0)}
            </Avatar>
            <Typography variant="h6" gutterBottom>
              {user.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {user.role?.toUpperCase()} • {user.ward}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Employee ID: {user.citizenId}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Profile Information" />
              <Tab label="Change Password" />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ m: 3 }}>
                {error}
              </Alert>
            )}

            {/* Profile Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 3 }}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        {...profileForm.register('name')}
                        fullWidth
                        label="Full Name"
                        error={!!profileForm.formState.errors.name}
                        helperText={profileForm.formState.errors.name?.message}
                        disabled={loading}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        {...profileForm.register('email')}
                        fullWidth
                        label="Email Address"
                        type="email"
                        error={!!profileForm.formState.errors.email}
                        helperText={profileForm.formState.errors.email?.message}
                        disabled={loading}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        {...profileForm.register('mobileNumber')}
                        fullWidth
                        label="Mobile Number"
                        error={!!profileForm.formState.errors.mobileNumber}
                        helperText={profileForm.formState.errors.mobileNumber?.message}
                        disabled={loading}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Employee ID"
                        value={user.citizenId}
                        disabled
                        helperText="Employee ID cannot be changed"
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Ward Assignment"
                        value={user.ward}
                        disabled
                        helperText="Contact admin to change ward"
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{ mr: 1 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => profileForm.reset()}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                  </Box>
                </form>
              </Box>
            </TabPanel>

            {/* Password Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: 3 }}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        {...passwordForm.register('currentPassword')}
                        fullWidth
                        label="Current Password"
                        type="password"
                        error={!!passwordForm.formState.errors.currentPassword}
                        helperText={passwordForm.formState.errors.currentPassword?.message}
                        disabled={loading}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        {...passwordForm.register('newPassword')}
                        fullWidth
                        label="New Password"
                        type="password"
                        error={!!passwordForm.formState.errors.newPassword}
                        helperText={passwordForm.formState.errors.newPassword?.message}
                        disabled={loading}
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        {...passwordForm.register('confirmPassword')}
                        fullWidth
                        label="Confirm New Password"
                        type="password"
                        error={!!passwordForm.formState.errors.confirmPassword}
                        helperText={passwordForm.formState.errors.confirmPassword?.message}
                        disabled={loading}
                      />
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 3 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{ mr: 1 }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Change Password'}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => passwordForm.reset()}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                  </Box>
                </form>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
