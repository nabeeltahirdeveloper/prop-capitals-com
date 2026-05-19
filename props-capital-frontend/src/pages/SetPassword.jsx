import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Lock, Loader2, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { verifySetPasswordToken, submitSetPassword } from '@/api/auth';

const SetPassword = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    data: verification,
    isLoading: verifying,
    isError: tokenInvalid,
    error: verifyError,
  } = useQuery({
    queryKey: ['verify-set-password-token', token],
    queryFn: () => verifySetPasswordToken(token),
    enabled: !!token,
    retry: 0,
  });

  const submitMutation = useMutation({
    mutationFn: submitSetPassword,
    onSuccess: (data) => {
      if (data?.accessToken) {
        localStorage.setItem('token', data.accessToken);
      }
      toast.success('Password set successfully — welcome!');
      navigate('/traderdashboard');
    },
    onError: (err) => {
      toast.error(err?.message || 'Could not set password. Please try again.');
    },
  });

  const cardClass = isDark
    ? 'bg-[#12161d] border border-white/5'
    : 'bg-white border border-slate-200';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';
  const inputClass = isDark
    ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500 focus:border-amber-500/50'
    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500/50';

  const Wrapper = ({ children }) => (
    <div className={`min-h-screen pt-20 pb-12 flex items-center justify-center px-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <div className={`${cardClass} rounded-2xl p-8 max-w-md w-full`}>{children}</div>
    </div>
  );

  if (!token) {
    return (
      <Wrapper>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Missing Token</h2>
          <p className={mutedClass}>
            This page requires a valid set-password link. Please use the link from your welcome email.
          </p>
        </div>
      </Wrapper>
    );
  }

  if (verifying) {
    return (
      <Wrapper>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className={mutedClass}>Verifying your link...</p>
        </div>
      </Wrapper>
    );
  }

  if (tokenInvalid || !verification?.valid) {
    return (
      <Wrapper>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Link Invalid or Expired</h2>
          <p className={mutedClass}>
            {verifyError?.message || 'This set-password link is invalid or has expired.'}
          </p>
          <p className={`text-sm mt-4 ${mutedClass}`}>
            Please contact <a href="mailto:support@prop-capitals.com" className="text-amber-500 hover:underline">support@prop-capitals.com</a> for help.
          </p>
        </div>
      </Wrapper>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    submitMutation.mutate({ token, password });
  };

  const submitting = submitMutation.isPending;

  return (
    <Wrapper>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>Set Your Password</h2>
        <p className={mutedClass}>
          Create a password for <span className={`font-medium ${textClass}`}>{verification.email}</span> to access your dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`text-sm mb-2 block ${mutedClass}`}>New Password</label>
          <div className="relative">
            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full rounded-xl pl-12 pr-12 py-3 focus:outline-none ${inputClass}`}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className={`text-sm mb-2 block ${mutedClass}`}>Confirm Password</label>
          <div className="relative">
            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none ${inputClass}`}
              placeholder="Repeat your password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-6 py-6 h-auto font-bold disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Setting password...
            </>
          ) : (
            'Set Password & Sign In'
          )}
        </Button>
      </form>
    </Wrapper>
  );
};

export default SetPassword;
