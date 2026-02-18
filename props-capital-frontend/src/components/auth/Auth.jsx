import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, User, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { useTranslation } from '@/contexts/LanguageContext';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';


const Auth = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP State
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [otp, setOtp] = useState('');
  const [resendAvailableAt, setResendAvailableAt] = useState(null);

  const [rememberMe, setRememberMe] = useState(true);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  const formatApiError = (err, fallbackKey) => {
    const msg = err?.data?.message ?? err?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg.trim()) return msg;
    return t(fallbackKey) || fallbackKey; // Fallback to key if t returns blank or just key
  };

  const requestOtpMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/auth/register/request-otp', payload);
    },
    onSuccess: (response) => {
      const raw = response.data?.resendAvailableAt;
      setResendAvailableAt(raw ? new Date(raw) : null);
      setOtp('');
      setStep('otp');
      setError('');
    },
    onError: (err) => {
      setError(formatApiError(err, 'signUp.errors.registrationFailed'));
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (payload) => {
      return api.post('/auth/register/verify-otp', payload);
    },
    onSuccess: async (response) => {
      const accessToken = response.data?.accessToken;
      const user = response.data?.user;

      if (accessToken) {
        login(accessToken, user);
      }

      navigate(createPageUrl('TraderDashboard'));
    },
    onError: (err) => {
      setError(formatApiError(err, 'signUp.errors.registrationFailed'));
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      // Use the login function from AuthContext to handle token and user data
      login(data.accessToken, data.user, rememberMe);

      // Redirect to trader dashboard
      navigate(createPageUrl('TraderDashboard'));
    },
    onError: (error) => {
      // Extract error message from response
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        t('signIn.errors.invalidCredentials');
      setError(errorMessage);
    },
  });

  const cooldownSeconds = useMemo(() => {
    if (!resendAvailableAt) return 0;
    const diffMs = resendAvailableAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / 1000));
  }, [resendAvailableAt]);

  useEffect(() => {
    if (step !== 'otp') return;
    if (cooldownSeconds <= 0) return;
    const id = window.setInterval(() => {
      setResendAvailableAt((prev) => (prev ? new Date(prev) : prev));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, cooldownSeconds]);


  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSignupChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setSignupData({ ...signupData, [e.target.name]: value });
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({
      email: loginData.email,
      password: loginData.password
    });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (signupData.password !== signupData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!signupData.agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Call request OTP mutation
    requestOtpMutation.mutate({
      email: signupData.email.trim().toLowerCase(),
      password: signupData.password,
      firstName: signupData.firstName || undefined,
      lastName: signupData.lastName || undefined,
    });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    verifyOtpMutation.mutate({
      email: signupData.email.trim().toLowerCase(),
      otp,
      password: signupData.password,
      firstName: signupData.firstName || undefined,
      lastName: signupData.lastName || undefined,
    });
  };

  const handleResend = () => {
    setError('');
    requestOtpMutation.mutate({
      email: signupData.email.trim().toLowerCase(),
      password: signupData.password,
      firstName: signupData.firstName || undefined,
      lastName: signupData.lastName || undefined,
    });
  };

  const passwordRequirements = [
    { label: '8+ characters', met: signupData.password.length >= 8 },
    { label: 'One uppercase', met: /[A-Z]/.test(signupData.password) },
    { label: 'One number', met: /[0-9]/.test(signupData.password) },
    { label: 'One special char', met: /[!@#$%^&*]/.test(signupData.password) }
  ];

  useEffect(() => {
    // Determine active tab based on URL path or optional ?tab= query
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup' || tabParam === 'login') {
      setActiveTab(tabParam);
    } else if (location.pathname.toLowerCase().includes('signup')) {
      setActiveTab('signup');
    } else {
      setActiveTab('login');
    }
  }, [location.pathname, searchParams]);

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 py-12 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-500/5' : 'bg-blue-500/5'}`}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
              <span className="text-[#0a0d12] font-black text-xl">PC</span>
            </div>
            <div className="flex flex-col items-start">
              <span className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>PROP<span className="text-amber-400">CAPITALS</span></span>
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>prop-capitals.com</span>
            </div>
          </Link>
        </div>

        {/* Auth Card */}
        <div className={`rounded-2xl p-6 sm:p-8 border shadow-2xl ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
          {/* Tabs */}
          <div className={`flex mb-6 p-1 rounded-xl ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-100'}`}>
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${activeTab === 'login'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12]'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(''); }}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all ${activeTab === 'signup'
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12]'
                : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 mb-5">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Email Address</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                    className={`w-full rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-amber-500/50 transition-colors ${isDark
                      ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    placeholder="trader@example.com"
                    data-testid="auth-login-email"
                  />
                </div>
              </div>

              <div>
                <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Password</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    className={`w-full rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-amber-500/50 transition-colors ${isDark
                      ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                    placeholder="Enter your password"
                    data-testid="auth-login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={`w-4 h-4 rounded text-amber-500 focus:ring-amber-500/50 ${isDark ? 'border-white/20 bg-[#0a0d12]' : 'border-slate-300 bg-white'}`}
                  />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-amber-500 text-sm hover:text-amber-400 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl py-6 h-auto font-bold text-lg disabled:opacity-50"
                data-testid="auth-login-submit"
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#0a0d12]/30 border-t-[#0a0d12] rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  <>Sign In<ArrowRight className="ml-2 w-5 h-5" /></>
                )}
              </Button>
            </form>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <>
              {step === 'details' ? (
                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>First Name</label>
                      <div className="relative">
                        <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                        <input
                          type="text"
                          name="firstName"
                          value={signupData.firstName}
                          onChange={handleSignupChange}
                          required
                          className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors ${isDark
                            ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                            : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                            }`}
                          placeholder="John"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={signupData.lastName}
                        onChange={handleSignupChange}
                        required
                        className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors ${isDark
                          ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Email Address</label>
                    <div className="relative">
                      <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type="email"
                        name="email"
                        value={signupData.email}
                        onChange={handleSignupChange}
                        required
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500/50 transition-colors ${isDark
                          ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                        placeholder="trader@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Password</label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={signupData.password}
                        onChange={handleSignupChange}
                        required
                        className={`w-full rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-amber-500/50 transition-colors ${isDark
                          ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                          }`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {signupData.password && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {passwordRequirements.map((req, i) => (
                          <div key={i} className={`flex items-center gap-1 text-xs ${req.met ? 'text-emerald-400' : isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {req.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Confirm Password</label>
                    <div className="relative">
                      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={signupData.confirmPassword}
                        onChange={handleSignupChange}
                        required
                        className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none transition-colors ${
                          isDark
                            ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500 focus:border-amber-500/50'
                            : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500/50'
                        } ${signupData.confirmPassword && signupData.password !== signupData.confirmPassword ? '!border-red-500' : ''}`}
                        placeholder="Confirm your password"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={signupData.agreeTerms}
                      onChange={handleSignupChange}
                      className={`w-4 h-4 mt-1 rounded text-amber-500 focus:ring-amber-500/50 ${isDark ? 'border-white/20 bg-[#0a0d12]' : 'border-slate-300 bg-white'}`}
                    />
                    <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      I agree to the{' '}
                      <Link to="/terms" className="text-amber-500 hover:text-amber-400">Terms of Service</Link>
                      {' '}and{' '}
                      <Link to="/privacy" className="text-amber-500 hover:text-amber-400">Privacy Policy</Link>
                    </label>
                  </div>

                  <Button
                    type="submit"
                    disabled={requestOtpMutation.isPending}
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl py-6 h-auto font-bold text-lg disabled:opacity-50"
                  >
                    {requestOtpMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating account...
                      </div>
                    ) : (
                      <>Create Account<ArrowRight className="ml-2 w-5 h-5" /></>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                    OTP sent to <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{signupData.email}</span>
                  </div>

                  <div className="space-y-2">
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Enter OTP</label>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        containerClassName="justify-center"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={verifyOtpMutation.isPending || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl py-6 h-auto font-bold text-lg disabled:opacity-50"
                  >
                    {verifyOtpMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </div>
                    ) : (
                      <>Verify OTP<ArrowRight className="ml-2 w-5 h-5" /></>
                    )}
                  </Button>

                  <div className="flex flex-col sm:flex-row items-center justify-between text-sm gap-3 sm:gap-0">
                    <button
                      type="button"
                      onClick={() => {
                        setError('');
                        setStep('details');
                      }}
                      className={`${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-200'} transition-colors`}
                    >
                      Change Email
                    </button>

                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={requestOtpMutation.isPending || cooldownSeconds > 0}
                      className={`
                        ${cooldownSeconds > 0
                          ? isDark ? 'text-gray-500' : 'text-slate-400'
                          : 'text-amber-500 hover:text-amber-400'} 
                        disabled:opacity-50 transition-colors
                      `}
                    >
                      {cooldownSeconds > 0
                        ? `Resend in ${cooldownSeconds}s`
                        : 'Resend Code'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Divider */}
          {/* <div className="flex items-center gap-4 my-6">
            <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>or continue with</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}></div>
          </div> */}

          {/* Social Login */}
          {/* <div className="grid grid-cols-2 gap-3">
            <button className={`flex items-center justify-center gap-2 rounded-xl py-3 transition-colors ${
              isDark 
                ? 'bg-[#0a0d12] border border-white/10 text-white hover:bg-white/5' 
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button className={`flex items-center justify-center gap-2 rounded-xl py-3 transition-colors ${
              isDark 
                ? 'bg-[#0a0d12] border border-white/10 text-white hover:bg-white/5' 
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div> */}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className={`text-sm transition-colors ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-600'}`}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
