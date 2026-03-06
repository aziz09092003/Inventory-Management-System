import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Mic } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [showVoiceLogin, setShowVoiceLogin] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceData, setVoiceData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithVoice } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      await login({ username, password });
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceLogin = async () => {
    setError('');
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!voiceData) {
      setError('Please record your voice first');
      return;
    }
    setIsLoading(true);
    try {
      const result = await loginWithVoice({ email, audio_base64: voiceData.audio_base64 });
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Voice authentication failed');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Voice authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          setVoiceData({ audio_base64: base64 });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setTimeout(() => {
        mediaRecorder.stop();
        setIsRecording(false);
      }, 3000);
    } catch (err) {
      setError('Microphone access denied');
      setIsRecording(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#e8e8e8' }}>
      <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative" style={{ maxWidth: '750px', height: '460px' }}>
        
        {/* Title - top left */}
        <div className="absolute top-6 left-8 z-10">
          <h1 className="text-xl font-extrabold text-gray-900">E-Inventory</h1>
          <p className="text-xs text-gray-500 mt-0.5">Online inventory management system</p>
        </div>

        {/* Illustration - right side, full height */}
        <div className="absolute right-0 top-0 bottom-0 hidden md:flex items-end justify-center overflow-hidden" style={{ width: '50%' }}>
          {/* Light blue background blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ width: '250px', height: '250px', backgroundColor: '#d0ebf5' }}></div>
          
          {/* Person */}
          <div className="relative z-10 flex flex-col items-center" style={{ marginBottom: '0px' }}>
            {/* Head */}
            <div className="relative">
              {/* Hair */}
              <div className="w-16 h-8 rounded-t-full" style={{ backgroundColor: '#2C3E50' }}></div>
              {/* Face */}
              <div className="w-12 h-12 rounded-full mx-auto" style={{ backgroundColor: '#FDB99B', marginTop: '-6px' }}></div>
            </div>
            
            {/* Body with arms */}
            <div className="relative" style={{ marginTop: '-4px' }}>
              {/* Torso */}
              <div className="w-32 h-24 rounded-t-3xl relative" style={{ backgroundColor: '#2563EB' }}>
                {/* White collar/neckline */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-4 bg-white rounded-b-lg"></div>
                {/* Left arm - pointing at POS */}
                <div className="absolute -left-8 top-4 w-12 h-8 rounded-full" style={{ backgroundColor: '#2563EB' }}></div>
                {/* Right arm */}
                <div className="absolute -right-6 top-6 w-10 h-8 rounded-full" style={{ backgroundColor: '#1D4ED8' }}></div>
              </div>
            </div>
            
            {/* Desk/Counter */}
            <div className="relative w-56 h-11 rounded-t-2xl flex items-start justify-center" style={{ backgroundColor: '#E8A87C', marginTop: '-6px' }}>
              {/* POS Screen */}
              <div className="absolute -top-12 left-10 flex flex-col items-center">
                <div className="w-10 h-8 bg-white rounded-md border-2 border-gray-800 shadow-md"></div>
                <div className="w-6 h-2.5 bg-gray-800 rounded-b-sm"></div>
                <div className="w-11 h-2.5 bg-gray-700 rounded-sm mt-0.5"></div>
              </div>
              {/* Keyboard/device on desk */}
              <div className="absolute right-12 -top-3 w-8 h-5 bg-gray-200 rounded-sm border border-gray-400"></div>
            </div>
            
            {/* Desk base */}
            <div className="w-56 h-5 flex">
              <div className="flex-1 bg-gray-700 rounded-bl-lg"></div>
              <div className="w-3"></div>
              <div className="flex-1 bg-gray-700 rounded-br-lg"></div>
            </div>
          </div>
        </div>

        {/* Form area - left side */}
        <div className="absolute left-8 top-20 z-10" style={{ width: '260px' }}>
          
          {!showVoiceLogin ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Login</h2>

              {error && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailLogin}>
                <div className="space-y-3">
                  {/* Email/Username */}
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 transition"
                      placeholder="Email Address"
                    />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 transition"
                      placeholder="Password"
                    />
                  </div>

                  {/* Keep me logged in */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Keep me logged in</span>
                    <div
                      onClick={() => setKeepLoggedIn(!keepLoggedIn)}
                      className={`w-9 h-5 rounded-full cursor-pointer transition-colors relative ${keepLoggedIn ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${keepLoggedIn ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm shadow disabled:opacity-50"
                    style={{ backgroundColor: '#2563EB' }}
                  >
                    {isLoading ? 'Logging in...' : 'Log in'}
                  </button>
                </div>
              </form>

              {/* Voice Login */}
              <div className="mt-5 flex flex-col items-center">
                <button
                  onClick={() => setShowVoiceLogin(true)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-gray-300 group-hover:border-blue-400 transition-colors">
                    <Mic className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">Login With Voice</span>
                </button>
              </div>

              {/* Register link */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-blue-600 hover:underline">
                    Register here
                  </Link>
                </p>
              </div>
            </>
          ) : (
            /* Voice Login Mode */
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Voice Login</h2>

              {error && (
                <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs">
                  {error}
                </div>
              )}

              {/* Email for voice login */}
              <div className="relative mb-3">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-400 transition"
                  placeholder="Enter your email"
                />
              </div>

              <p className="text-xs text-gray-500 mb-5">Click the microphone and speak clearly for 3 seconds</p>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  <Mic className="w-10 h-10" />
                </button>
                <p className="text-xs font-medium text-gray-600">
                  {isRecording ? 'Recording...' : voiceData ? 'Voice recorded!' : 'Tap to record'}
                </p>
              </div>

              {voiceData && (
                <button
                  onClick={handleVoiceLogin}
                  disabled={isLoading}
                  className="w-full mt-4 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm shadow disabled:opacity-50"
                  style={{ backgroundColor: '#2563EB' }}
                >
                  {isLoading ? 'Authenticating...' : 'Login with Voice'}
                </button>
              )}

              <button
                onClick={() => { setShowVoiceLogin(false); setVoiceData(null); setError(''); }}
                className="w-full mt-3 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Back to Email Login
              </button>

              <div className="mt-3 p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-[10px] text-yellow-700">
                  <strong>Note:</strong> Register your voice from Settings page after login first.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
