import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    const users = JSON.parse(localStorage.getItem('registered_users') || '[]');

    if (users.some(u => u.username === formData.username)) {
      setError('Username already exists');
      return;
    }
    if (users.some(u => u.email === formData.email)) {
      setError('Email already registered');
      return;
    }

    users.push({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      createdAt: new Date().toISOString()
    });

    localStorage.setItem('registered_users', JSON.stringify(users));
    setSuccess(true);

    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  if (success) {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#e8e8e8' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
            <p className="text-gray-600">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#e8e8e8' }}>
      <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative" style={{ maxWidth: '750px', height: '500px' }}>

        {/* Title - top left */}
        <div className="absolute top-5 left-8 z-10">
          <h1 className="text-xl font-extrabold text-gray-900">E-Inventory</h1>
          <p className="text-xs text-gray-500 mt-0.5">Create your account</p>
        </div>

        {/* Illustration - right side, full height */}
        <div className="absolute right-0 top-0 bottom-0 hidden md:flex items-end justify-center overflow-hidden" style={{ width: '46%' }}>
          {/* Light blue background blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: '240px', height: '240px', backgroundColor: '#d0ebf5' }}></div>
          
          {/* Person */}
          <div className="relative z-10 flex flex-col items-center" style={{ marginBottom: '0px' }}>
            {/* Head */}
            <div className="relative">
              <div className="w-16 h-8 rounded-t-full" style={{ backgroundColor: '#2C3E50' }}></div>
              <div className="w-12 h-12 rounded-full mx-auto" style={{ backgroundColor: '#FDB99B', marginTop: '-6px' }}></div>
            </div>
            
            {/* Body */}
            <div className="relative" style={{ marginTop: '-4px' }}>
              <div className="w-24 h-18 rounded-t-3xl relative" style={{ backgroundColor: '#2563EB' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-3 bg-white rounded-b-lg"></div>
                <div className="absolute -left-6 top-3 w-10 h-6 rounded-full" style={{ backgroundColor: '#2563EB' }}></div>
                <div className="absolute -right-5 top-4 w-8 h-6 rounded-full" style={{ backgroundColor: '#1D4ED8' }}></div>
              </div>
            </div>
            
            {/* Desk */}
            <div className="relative w-56 h-11 rounded-t-2xl flex items-start justify-center" style={{ backgroundColor: '#E8A87C', marginTop: '-6px' }}>
              <div className="absolute -top-12 left-10 flex flex-col items-center">
                <div className="w-10 h-8 bg-white rounded-md border-2 border-gray-800 shadow-md"></div>
                <div className="w-6 h-2.5 bg-gray-800 rounded-b-sm"></div>
                <div className="w-11 h-2.5 bg-gray-700 rounded-sm mt-0.5"></div>
              </div>
              <div className="absolute right-12 -top-3 w-8 h-5 bg-gray-200 rounded-sm border border-gray-400"></div>
            </div>
            
            <div className="w-56 h-5 flex">
              <div className="flex-1 bg-gray-700 rounded-bl-lg"></div>
              <div className="w-3"></div>
              <div className="flex-1 bg-gray-700 rounded-br-lg"></div>
            </div>
          </div>
        </div>

        {/* Form area - left side */}
        <div className="absolute left-8 top-16 z-10" style={{ width: '280px' }}>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Register</h2>

          {error && (
            <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-2">
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 transition"
                    placeholder="Choose a username"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 transition"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 transition"
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">At least 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 transition"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className="w-full text-white py-2.5 rounded-lg font-semibold hover:opacity-90 transition-all shadow text-sm"
                style={{ backgroundColor: '#2C5F6F' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#234A57'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#2C5F6F'}
              >
                Create Account
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
