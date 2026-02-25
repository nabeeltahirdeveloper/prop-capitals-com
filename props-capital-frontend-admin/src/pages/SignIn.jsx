import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { createPageUrl } from '../utils';
import { useTranslation } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Shield,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function SignIn() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Clean up any redirect state when component mounts
  useEffect(() => {
    if (location.state?.from) {
      navigate(createPageUrl('SignIn'), { replace: true, state: null });
    }
  }, [location.state?.from, navigate]);

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      // Only allow admin users
      const userRole = data.user?.role?.toUpperCase();
      if (userRole !== 'ADMIN') {
        if (userRole === 'TRADER') {
          setError(t('signIn.errors.adminPortalOnly'));
        } else {
          setError(t('signIn.errors.adminCredentialsRequired'));
        }
        localStorage.removeItem('token');
        return;
      }

      login(data.accessToken, data.user);
      navigate(createPageUrl('AdminDashboard'));
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        t('signIn.errors.invalidCredentials');
      setError(errorMessage);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ email, password });
  };

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
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center">
              <img src="/assets/images/logo-light.png" alt="Logo" className="block dark:hidden w-full h-full object-contain" />
              <img src="/assets/images/logo-dark.png" alt="Logo Dark" className="hidden dark:block w-full h-full object-contain" />
            </div>
            <div className="flex flex-col items-start">
              <span className={`font-bold text-xl tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>PROP<span className="text-amber-400">CAPITALS</span></span>
              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>prop-capitals.com</span>
            </div>
          </Link>
        </div>

        {/* Auth Card */}
        <div className={`rounded-2xl p-6 sm:p-8 border shadow-2xl ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
          {/* Admin Panel Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
              <Shield className="w-5 h-5 text-amber-500" />
              <span className="text-amber-500 font-semibold text-sm">{t('nav.adminPanel')}</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('signIn.title')}</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('signIn.adminSubtitle')}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 mb-5">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('signIn.email')}</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  required
                  className={`w-full rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-amber-500/50 transition-colors ${isDark
                    ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  placeholder={t('signIn.emailPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('signIn.password')}</label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  required
                  className={`w-full rounded-xl pl-12 pr-12 py-3.5 focus:outline-none focus:border-amber-500/50 transition-colors ${isDark
                    ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  placeholder={t('signIn.passwordPlaceholder')}
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

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl py-6 h-auto font-bold text-lg disabled:opacity-50"
            >
              {loginMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.loading')}
                </div>
              ) : (
                <>{t('signIn.signInButton')}<ArrowRight className="ml-2 w-5 h-5" /></>
              )}
            </Button>
          </form>

          {/* Admin Notice */}
          <div className={`mt-6 pt-6 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <p className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
              {t('signIn.adminAccessOnly')}
            </p>
          </div>
        </div>

        
      </div>
    </div>
  );
}



