// src/pages/CreateUserPage.jsx
import React, { useState } from "react";
import { Card } from "../components/ui/card";
import {
  Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, Building, AlertCircle, 
  Crown, Badge
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import adminService from "../services/adminService";

const CreateUserPage = () => {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    employeeId: "",
    department: ""
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Department options
  const departments = [
    'Public Works',
    'Water Department', 
    'Sanitation',
    'Electrical',
    'Revenue',
    'Health',
    'Fire & Emergency',
    'Administration',
    'IT Department'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required.";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address.";
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Invalid 10-digit mobile number.";
    }

    if (!formData.employeeId.trim()) {
      newErrors.employeeId = "Employee ID is required.";
    }

    if (!formData.department) {
      newErrors.department = "Department is required.";
    }

    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Auto-generate employee ID
  const generateEmployeeId = () => {
    const id = `ADM${Date.now().toString().slice(-5)}`;
    setFormData(prev => ({ ...prev, employeeId: id }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.toLowerCase().trim(),
        mobileNumber: formData.phone.trim(),
        password: formData.password,
        role: 'admin', // FIXED: Only admin role
        employeeId: formData.employeeId,
        department: formData.department,
        ward: 'Administrative'
      };

      console.log('🔄 Creating admin user:', userData);

      const result = await adminService.createUser(userData);

      toast.success(`Admin account created successfully!`, {
        icon: "👑",
        duration: 4000,
      });

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        employeeId: "",
        department: ""
      });

      // Show success message with user details
      toast.success(`Created Admin: ${result.data.user.name}`, {
        duration: 5000,
        icon: "✅"
      });

    } catch (error) {
      console.error("Admin creation error:", error);
      
      const errorMessage = error.message || "Failed to create admin. Please try again.";
      
      if (errorMessage.includes('email')) {
        setErrors({ email: 'An account with this email already exists.' });
      } else if (errorMessage.includes('mobile')) {
        setErrors({ phone: 'An account with this mobile number already exists.' });
      } else if (errorMessage.includes('employeeId')) {
        setErrors({ employeeId: 'An account with this Employee ID already exists.' });
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to render input fields with error messages
  const renderInput = (name, label, type = "text", icon, placeholder, disabled = false) => {
    const Icon = icon;
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
        <div className="relative">
          <Icon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-lg text-gray-900 focus:ring-2 transition ${
              errors[name] 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-200 focus:ring-purple-500'
            } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            placeholder={placeholder}
            disabled={isLoading || disabled}
          />
          {name === 'employeeId' && !disabled && (
            <button
              type="button"
              onClick={generateEmployeeId}
              className="absolute right-3 top-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
              disabled={isLoading}
            >
              Generate
            </button>
          )}
        </div>
        {errors[name] && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1"/>
            {errors[name]}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="bg-purple-500/20 rounded-full p-4 inline-block mb-4">
            <Crown className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Admin Account</h1>
          <p className="text-gray-600">Administrator Registration</p>
          
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-xl p-8 rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {renderInput("firstName", "First Name", "text", User, "John")}
                {renderInput("lastName", "Last Name", "text", User, "Doe")}
              </div>
              <div className="grid grid-cols-1 gap-4 mt-4">
                {renderInput("email", "Email Address", "email", Mail, "admin@amc.gov.in")}
                {renderInput("phone", "Mobile Number", "tel", Phone, "9876543210")}
              </div>
            </div>

            {/* Admin Information */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                <Crown className="h-5 w-5 mr-2" />
                Administrator Details
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                    <span className="text-purple-600 text-xs ml-2">Click Generate</span>
                  </label>
                  <div className="relative">
                    <Badge className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-20 py-3 bg-gray-50 border rounded-lg text-gray-900 focus:ring-2 transition ${
                        errors.employeeId 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 focus:ring-purple-500'
                      }`}
                      placeholder="ADM12345"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={generateEmployeeId}
                      className="absolute right-3 top-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
                      disabled={isLoading}
                    >
                      Generate
                    </button>
                  </div>
                  {errors.employeeId && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1"/>
                      {errors.employeeId}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-50 border rounded-lg text-gray-900 focus:ring-2 transition ${
                        errors.department 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 focus:ring-purple-500'
                      }`}
                      disabled={isLoading}
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  {errors.department && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1"/>
                      {errors.department}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Password Fields */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Security Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type={showPwd ? "text" : "password"}
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
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1"/>
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-12 py-3 bg-gray-50 border rounded-lg text-gray-900 focus:ring-2 transition ${
                        errors.confirmPassword 
                          ? 'border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 focus:ring-purple-500'
                      }`}
                      placeholder="••••••••"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      disabled={isLoading}
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1"/>
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium py-4 px-6 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Admin Account...
                </>
              ) : (
                <>
                  <Crown className="h-5 w-5 mr-2" />
                  Create Admin Account
                </>
              )}
            </button>

            {/* Navigation Links */}
            <div className="text-center pt-4 border-t border-gray-200">
              <div className="flex justify-center space-x-4 text-sm">
                <Link
                  to="/login"
                  className="text-purple-600 hover:text-purple-500 font-semibold transition"
                >
                  Back to Login
                </Link>
               
                
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateUserPage;
