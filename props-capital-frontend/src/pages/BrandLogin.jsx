import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Building2, Loader2 } from 'lucide-react';
import { brandApi } from '@/api/brand';
import { useTheme } from '@/contexts/ThemeContext';

export default function BrandLogin() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Defensive cleanup: an earlier version of this app wrote the brand token
  // into the trader's `localStorage.token` slot, which makes the trader app
  // fire /auth/me with a brand JWT (causes 400). Clear any such stale value
  // when the user lands here.
  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      if (t && (t === localStorage.getItem('brand_token') || t === localStorage.getItem('reseller_token'))) {
        localStorage.removeItem('token');
      }
    } catch (_e) {
      /* intentionally ignored: localStorage may be unavailable (private mode / blocked storage); cleanup is best-effort */
    }
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await brandApi.auth.login({ username, password });
      navigate('/brand-dashboard');
    } catch (err) {
      setError(err?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Theme-aware classes — explicit so the inputs are readable in both modes
  // (the shadcn Input default uses `text-foreground` which is white in dark
  // mode, making typed text invisible on the white card).
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
          <Building2 className="w-7 h-7 text-white" />
        </div>

        <h1 className={`text-2xl font-bold text-center mb-1 ${headingColor}`}>
          Brand Partner Login
        </h1>
        <p className={`text-center mb-6 text-sm ${subtleColor}`}>
          Sign in to access your brand dashboard
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
              placeholder="yourbrandusername"
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
          Not a brand partner yet? Contact admin to request access.
        </p>
      </div>
    </div>
  );
}
