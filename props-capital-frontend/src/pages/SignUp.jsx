import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '../utils';
import { useTranslation } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import api from '@/lib/api';
import {
  TrendingUp,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Loader2,
  User
} from 'lucide-react';

export default function SignUp() {
  const { t } = useTranslation();
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [resendAvailableAt, setResendAvailableAt] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const formatApiError = (err, fallbackKey) => {
    const msg = err?.data?.message ?? err?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg.trim()) return msg;
    return t(fallbackKey);
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
        localStorage.setItem('token', accessToken);
      }
      if (user) {
        queryClient.setQueryData(['user', 'me'], user);
      }
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      navigate(createPageUrl('TraderDashboard'));
    },
    onError: (err) => {
      setError(formatApiError(err, 'signUp.errors.registrationFailed'));
    },
  });

  const cooldownSeconds = useMemo(() => {
    if (!resendAvailableAt) return 0;
    const diffMs = resendAvailableAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / 1000));
  }, [resendAvailableAt]);

  // Re-render once per second while cooldown is active
  useEffect(() => {
    if (step !== 'otp') return;
    if (cooldownSeconds <= 0) return;
    const id = window.setInterval(() => {
      setResendAvailableAt((prev) => (prev ? new Date(prev) : prev));
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, cooldownSeconds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    // Validation
    if (password !== confirmPassword) {
      setError(t('signUp.errors.passwordsNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('signUp.errors.passwordTooShort'));
      return;
    }

    requestOtpMutation.mutate({
      email: normalizedEmail,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    verifyOtpMutation.mutate({
      email: normalizedEmail,
      otp,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
  };

  const handleResend = () => {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    requestOtpMutation.mutate({
      email: normalizedEmail,
      password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Props Capital</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {step === 'otp' ? t('signUp.otpTitle') : t('signUp.title')}
          </h1>
          <p className="text-slate-400 mb-8">
            {step === 'otp' ? t('signUp.otpSubtitle') : t('signUp.subtitle')}
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {step === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-300">{t('signUp.firstName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="firstName"
                      type="text"
                      placeholder={t('signUp.firstNamePlaceholder')}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-300">{t('signUp.lastName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <Input
                      id="lastName"
                      type="text"
                      placeholder={t('signUp.lastNamePlaceholder')}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">{t('signUp.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('signUp.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">{t('signUp.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('signUp.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">{t('signUp.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('signUp.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={requestOtpMutation.isPending}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-5 sm:py-6 text-base sm:text-lg h-auto"
              >
                {requestOtpMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {t('signUp.createAccountButton')}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-slate-300 text-sm">
                {t('signUp.otpSentTo')} <span className="font-medium text-white">{email.trim().toLowerCase()}</span>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t('signUp.otpLabel')}</Label>
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
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-5 sm:py-6 text-base sm:text-lg h-auto"
              >
                {verifyOtpMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {t('signUp.verifyOtpButton')}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm gap-3 sm:gap-0">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setStep('details');
                  }}
                  className="text-slate-400 hover:text-slate-200"
                >
                  {t('signUp.changeEmail')}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={requestOtpMutation.isPending || cooldownSeconds > 0}
                  className="text-emerald-400 hover:text-emerald-300 disabled:text-slate-500 disabled:hover:text-slate-500"
                >
                  {cooldownSeconds > 0
                    ? t('signUp.resendIn', { seconds: cooldownSeconds })
                    : t('signUp.resendCode')}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            <p className="text-slate-400">
              {t('signUp.hasAccount')}{' '}
              <Link to={createPageUrl('SignIn')} className="text-emerald-400 hover:text-emerald-300 font-medium">
                {t('signUp.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 relative">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=1600&fit=crop"
            alt="Trading"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12">
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-800 p-6 md:p-8 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold">{t('signUp.joinTraders')}</p>
                <p className="text-sm text-slate-400">{t('signUp.startJourney')}</p>
              </div>
            </div>
            <p className="text-slate-300">
              {t('signUp.description')}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

