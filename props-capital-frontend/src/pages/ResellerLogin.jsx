import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Users, Loader2 } from 'lucide-react';
import { resellerApi } from '@/api/reseller';
import { useTheme } from '@/contexts/ThemeContext';

export default function ResellerLogin() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Defensive cleanup of any stale trader token that points at a brand/reseller
  // JWT (legacy bug). Without this, /auth/me fires with a brand-kind token and
  // returns 400 from the trader JWT strategy.
  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      if (t && (t === localStorage.getItem('brand_token') || t === localStorage.getItem('reseller_token'))) {
        localStorage.removeItem('token');
      }
    } catch (_e) {}
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resellerApi.auth.login({ username, password });
      navigate('/reseller-dashboard');
    } catch (err) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200';
  const inputBg = isDark
    ? 'bg-[#0a0d12] border border-white/10 text-white placeholder:text-gray-500'
    : 'bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400';
  const labelColor = isDark ? 'text-gray-300' : 'text-slate-700';
  const subtleColor = isDark ? 'text-gray-400' : 'text-slate-500';
  const headingColor = isDark ? 'text-white' : 'text-slate-900';
  const pageBg = isDark ? 'bg-[#0a0d12]' : 'bg-slate-50';

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${pageBg}`}>
      <div className={`w-full max-w-md rounded-2xl shadow-xl p-8 border ${cardBg}`}>
        <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 mb-6 mx-auto">
          <Users className="w-7 h-7 text-white" />
        </div>

        <h1 className={`text-2xl font-bold text-center mb-1 ${headingColor}`}>
          Reseller Partner Login
        </h1>
        <p className={`text-center mb-6 text-sm ${subtleColor}`}>
          Sign in to manage your network of brands
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              required
              autoComplete="username"
              placeholder="yourresellerusername"
              className={`w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors ${inputBg}`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${labelColor}`}>
              Password
            </label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className={`w-full rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors ${inputBg}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${subtleColor} hover:text-amber-500 transition-colors`}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg px-3 py-2 text-sm bg-red-500/10 border border-red-500/30 text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] font-bold rounded-lg py-2.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className={`text-xs text-center mt-6 ${subtleColor}`}>
          Not a reseller yet? Contact admin to request access.
        </p>
      </div>
    </div>
  );
}
