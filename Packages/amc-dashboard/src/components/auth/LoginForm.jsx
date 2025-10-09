// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert, FormControlLabel, Checkbox, CircularProgress, Divider } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-hot-toast';
import authService from '../../services/auth';

const loginSchema = yup.object().shape({
  identifier: yup.string().required('Email or mobile number is required'),
  password: yup.string().required('Password is required'),
});

const LoginForm = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (formData) => {
    setLoading(true);
    setError('');
    try {
      const { user } = await authService.login(formData);
      if (user.role === 'admin' || user.role === 'officer') {
        toast.success('Login successful!');
        onLoginSuccess();
        navigate('/dashboard');
      } else {
        setError('Access denied. This portal is for officials only.');
        authService.logout();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>AMC Smart City</Typography>
          <Typography component="h2" variant="h5" align="center" gutterBottom>Admin Portal Login</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField {...register('identifier')} margin="normal" fullWidth label="Email or Mobile" error={!!errors.identifier} helperText={errors.identifier?.message} disabled={loading} />
            <TextField {...register('password')} margin="normal" fullWidth label="Password" type="password" error={!!errors.password} helperText={errors.password?.message} disabled={loading} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ mt: 2, mb: 3 }}>
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>Forgot Password?</Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginForm;
