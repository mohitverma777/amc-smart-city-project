import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Grid,
  MenuItem,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import authService from '../../services/auth';

// Validation schema
const registerSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email'),
  mobileNumber: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[6-9]\d{9}$/, 'Please enter a valid mobile number'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one lowercase, uppercase, number and special character'
    ),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  citizenId: yup
    .string()
    .required('Employee ID is required')
    .min(6, 'Employee ID must be at least 6 characters'),
  ward: yup
    .string()
    .required('Ward assignment is required'),
  role: yup
    .string()
    .required('Role is required')
    .oneOf(['officer', 'admin'], 'Invalid role selected'),
  department: yup
    .string()
    .required('Department is required'),
});

const WARDS = [
  'Ward-1', 'Ward-2', 'Ward-3', 'Ward-4', 'Ward-5',
  'Ward-6', 'Ward-7', 'Ward-8', 'Ward-9', 'Ward-10'
];

const DEPARTMENTS = [
  'Administration',
  'Public Works',
  'Water Management',
  'Waste Management',
  'Urban Planning',
  'Revenue',
  'IT Department',
];

const RegisterForm = ({ onRegisterSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      citizenId: '',
      ward: '',
      role: '',
      department: '',
    },
  });

   const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...submitData } = data;
      const result = await authService.register(submitData);
      
      toast.success('Registration successful!');
      onRegisterSuccess?.(); // Call the callback
      // Navigation will be handled by App.js
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography
            component="h1"
            variant="h4"
            align="center"
            gutterBottom
            sx={{ color: 'primary.main', fontWeight: 'bold' }}
          >
            AMC Smart City
          </Typography>
          <Typography
            component="h2"
            variant="h5"
            align="center"
            gutterBottom
            sx={{ color: 'text.secondary', mb: 3 }}
          >
            Register New Official Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('name')}
                  fullWidth
                  label="Full Name"
                  placeholder="Enter full name"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('email')}
                  fullWidth
                  label="Official Email"
                  type="email"
                  placeholder="Enter official email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('mobileNumber')}
                  fullWidth
                  label="Mobile Number"
                  placeholder="Enter 10-digit mobile number"
                  error={!!errors.mobileNumber}
                  helperText={errors.mobileNumber?.message}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('citizenId')}
                  fullWidth
                  label="Employee ID"
                  placeholder="Enter employee ID"
                  error={!!errors.citizenId}
                  helperText={errors.citizenId?.message}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('password')}
                  fullWidth
                  label="Password"
                  type="password"
                  placeholder="Create a strong password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('confirmPassword')}
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  disabled={loading}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.ward}>
                  <InputLabel>Ward Assignment</InputLabel>
                  <Controller
                    name="ward"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Ward Assignment" disabled={loading}>
                        {WARDS.map((ward) => (
                          <MenuItem key={ward} value={ward}>
                            {ward}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.ward && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {errors.ward.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.role}>
                  <InputLabel>Role</InputLabel>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Role" disabled={loading}>
                        <MenuItem value="officer">Officer</MenuItem>
                        <MenuItem value="admin">Administrator</MenuItem>
                      </Select>
                    )}
                  />
                  {errors.role && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {errors.role.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth error={!!errors.department}>
                  <InputLabel>Department</InputLabel>
                  <Controller
                    name="department"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Department" disabled={loading}>
                        {DEPARTMENTS.map((dept) => (
                          <MenuItem key={dept} value={dept}>
                            {dept}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  {errors.department && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {errors.department.message}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Create Account'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    textDecoration: 'none',
                    color: '#1976d2',
                    fontWeight: '500',
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterForm;
