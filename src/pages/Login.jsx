import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Voice login state
  const [showVoiceLogin, setShowVoiceLogin] = useState(false);
  const [voiceEmail, setVoiceEmail] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const { login, loginWithVoice, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username: email, password });
      navigate('/');
    } catch (err) {
      const serverMessage = err?.response?.data?.detail;
      const timeoutMessage = err?.code === 'ECONNABORTED' || String(err?.message || '').toLowerCase().includes('timeout');
      setError(serverMessage || (timeoutMessage ? 'Server is not responding. Please try again.' : 'Unable to login right now. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    navigate('/');
  };

  // Voice recording
  const startRecording = async () => {
    if (!voiceEmail.trim()) {
      setVoiceError('Please enter your email first');
      return;
    }
    setVoiceError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach((track) => track.stop());

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          setVoiceLoading(true);
          try {
            const result = await loginWithVoice({
              email: voiceEmail,
              audio_base64: base64Audio,
            });
            if (result.success) {
              navigate('/');
            } else {
              setVoiceError(result.message || 'Voice not recognized');
            }
          } catch (err) {
            setVoiceError(err.response?.data?.detail || 'Voice login failed');
          } finally {
            setVoiceLoading(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
        }
      }, 5000);
    } catch (err) {
      setVoiceError('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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

          {!showVoiceLogin ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('login')}</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-3">
                {/* Email */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
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

                {/* Keep me logged in */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                    className={`relative w-10 h-[22px] rounded-full transition-colors ${keepLoggedIn ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${keepLoggedIn ? 'translate-x-[18px]' : ''}`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">{t('keepMeLoggedIn')}</span>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full text-sm transition disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                      {t('loggingIn')}
                    </span>
                  ) : (
                    t('logIn')
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="w-full py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold rounded-full text-sm transition"
                >
                  Continue as Guest (Demo)
                </button>
              </form>

              {/* Voice Login */}
              <div className="mt-4 flex flex-col items-center">
                <button
                  onClick={() => setShowVoiceLogin(true)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-xl border-2 border-blue-200 flex items-center justify-center group-hover:border-blue-400 transition">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                  </div>
                  <span className="text-xs text-gray-500 group-hover:text-blue-500 transition">{t('loginWithVoice')}</span>
                </button>
              </div>

              {/* Register link */}
              <p className="text-center text-sm text-gray-500 mt-4">
                {t('dontHaveAccount')}{' '}
                <Link to="/register" className="text-blue-500 hover:underline font-medium">
                  {t('registerHere')}
                </Link>
              </p>
            </>
          ) : (
            /* ─── Voice Login Panel ─── */
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('voiceLoginTitle')}</h2>

              {voiceError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                  {voiceError}
                </div>
              )}

              <div className="space-y-3">
                {/* Email for voice login */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="email"
                    placeholder={t('emailAddress')}
                    value={voiceEmail}
                    onChange={(e) => setVoiceEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                  />
                </div>

                {/* Mic button */}
                <div className="flex flex-col items-center py-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={voiceLoading}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition shadow-lg ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } disabled:opacity-50`}
                  >
                    {voiceLoading ? (
                      <svg className="animate-spin h-7 w-7 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                        <path d="M19 10v2a7 7 0 01-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </svg>
                    )}
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    {voiceLoading ? t('verifying') : isRecording ? t('recordingClickToStop') : t('tapToSpeak')}
                  </p>
                </div>
              </div>

              {/* Back to email login */}
              <button
                onClick={() => { setShowVoiceLogin(false); setVoiceError(''); }}
                className="w-full py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-full text-sm transition mt-2"
              >
                {t('backToEmailLogin')}
              </button>
            </>
          )}
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
    </div>
  );
};

export default Login;
