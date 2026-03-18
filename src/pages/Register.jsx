import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import AlertDialog from '../components/AlertDialog';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    setLoading(true);
    try {
      await register({ username, email, password });
      setShowSuccessDialog(true);
      setTimeout(() => {
        setShowSuccessDialog(false);
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center px-4 py-3 md:py-4" style={{ backgroundColor: '#f0f2f5' }}>
      {/* Main Card */}
      <div
        className="flex w-full max-w-[900px] h-[calc(100vh-24px)] md:h-[calc(100vh-32px)] max-h-[720px] bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}
      >
        {/* LEFT SIDE — Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 py-7 md:px-9 md:py-8 overflow-y-auto">
          {/* Brand */}
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{t('brandName')}</h1>
          <p className="text-sm text-gray-400 mb-6">{t('brandTagline')}</p>

          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('createAccount')}</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3">
            {/* Username */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4l-10 8L2 4" />
                </svg>
              </span>
              <input
                type="email"
                placeholder={t('emailAddress')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </span>
              <input
                type="password"
                placeholder={t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <input
                type="password"
                placeholder={t('confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full text-sm transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                  {t('creatingAccount')}
                </span>
              ) : (
                t('createAccount')
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-4">
            {t('alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-blue-500 hover:underline font-medium">
              {t('logIn')}
            </Link>
          </p>
        </div>

        {/* RIGHT SIDE — Illustration */}
        <div className="hidden md:flex w-1/2 items-end justify-end relative overflow-hidden">
          <img
            src="/Gemini_Generated_Image_tge0h6tge0h6tge0.png"
            alt="Inventory Management"
            className="w-full h-full object-cover object-right-bottom"
          />
        </div>
      </div>

      <AlertDialog
        open={showSuccessDialog}
        type="success"
        title="Registration Successful"
        message="Your account has been created successfully. You will be redirected to the login page in a few seconds."
        confirmText="OK"
        onConfirm={() => {
          setShowSuccessDialog(false);
          navigate('/login');
        }}
        showCancel={false}
      />
    </div>
  );
};

export default Register;
