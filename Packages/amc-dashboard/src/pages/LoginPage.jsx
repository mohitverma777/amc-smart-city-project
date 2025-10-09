// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Eye, EyeOff, Shield, Mail, Lock, AlertCircle, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'Email or Employee ID is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 Admin login attempt...');
      
      const user = await login({
        identifier: formData.identifier,
        password: formData.password
      });

      console.log('✅ Admin login successful:', user);

      // ✅ FIXED: Only allow admins (backend already filters)
      if (user.role !== 'admin') {
        toast.error('This dashboard is for admins only');
        return;
      }

      toast.success(`Welcome, ${user.name}!`);
      navigate('/dashboard'); // Go to admin dashboard

    } catch (error) {
      console.error('❌ Admin login failed:', error);
      
      const errorData = error.response?.data;
      let errorMessage = 'Admin login failed';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      if (errorMessage.includes('Invalid admin credentials')) {
        setErrors({
          identifier: 'Invalid email/employee ID or password',
          password: 'Invalid email/employee ID or password'
        });
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="bg-purple-500/20 rounded-full p-4 inline-block mb-4">
            <Crown className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">AMC Smart City Administration</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl p-8 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email or Employee ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-lg text-gray-900 focus:ring-2 transition ${
                    errors.identifier 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:ring-purple-500'
                  }`}
                  placeholder="admin@amc.gov.in or ADM001"
                  disabled={isLoading}
                />
              </div>
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1"/>
                  {errors.identifier}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-lg text-gray-900 focus:ring-2 transition ${
                    errors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:ring-purple-500'
                  }`}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1"/>
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium py-4 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  Admin Sign In
                </>
              )}
            </button>
          </form>

          {/* Admin Test Credentials */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
              <p><strong>Admin Test Credentials:</strong></p>
              <p>Email: admin@amc.gov.in</p>
              <p>Password: admin123</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
