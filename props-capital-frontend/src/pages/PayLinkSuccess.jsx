import { useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, AlertTriangle, Mail } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { getPaymentStatus } from '@/api/payments';

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 5 * 60 * 1000;

const PayLinkSuccess = () => {
  const { isDark } = useTheme();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const pollStart = useRef(Date.now());

  const { data: payment, isLoading, isError, error } = useQuery({
    queryKey: ['guest-payment-status', reference],
    queryFn: () => getPaymentStatus(reference),
    enabled: !!reference,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'succeeded' || status === 'failed') return false;
      if (Date.now() - pollStart.current > POLL_TIMEOUT) return false;
      return POLL_INTERVAL;
    },
  });

  const cardClass = isDark
    ? 'bg-[#12161d] border border-white/5'
    : 'bg-white border border-slate-200';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  const timedOut = Date.now() - pollStart.current > POLL_TIMEOUT && payment?.status === 'pending';

  const Wrapper = ({ children }) => (
    <div className={`min-h-screen pt-20 pb-12 flex items-center justify-center px-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <div className={`${cardClass} rounded-2xl p-12 text-center max-w-xl w-full`}>{children}</div>
    </div>
  );

  if (!reference) {
    return (
      <Wrapper>
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Missing Payment Reference</h2>
        <p className={mutedClass}>No payment reference found. If you just paid, please check your email for confirmation.</p>
      </Wrapper>
    );
  }

  if (isLoading) {
    return (
      <Wrapper>
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Checking Payment Status...</h2>
        <p className={mutedClass}>Please wait while we verify your payment.</p>
      </Wrapper>
    );
  }

  if (isError) {
    return (
      <Wrapper>
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Unable to Check Payment</h2>
        <p className={mutedClass}>{error?.message || 'Something went wrong. Please check your email for confirmation.'}</p>
      </Wrapper>
    );
  }

  if (payment?.status === 'succeeded') {
    return (
      <Wrapper>
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>Payment Successful!</h2>
        <p className={`mb-6 ${mutedClass}`}>Your challenge has been activated.</p>

        <div className={`rounded-xl p-6 mb-6 text-left max-w-sm mx-auto ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
          <div className={`flex justify-between items-center mb-3 pb-3 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <span className={mutedClass}>Reference</span>
            <span className={`font-mono font-bold text-sm ${textClass}`}>{reference}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={mutedClass}>Status</span>
            <span className="flex items-center gap-2 text-emerald-500 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Active
            </span>
          </div>
        </div>

        <div className={`rounded-xl p-5 mb-6 text-left flex items-start gap-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <Mail className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className={`font-semibold ${textClass}`}>Check your email</p>
            <p className={mutedClass}>
              We've sent a "set your password" link, your trading platform credentials, and your receipt.
              Click the link in the email to activate your account and access your dashboard.
            </p>
          </div>
        </div>

        <Link
          to="/SignIn"
          className="inline-block px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl"
        >
          Go to Sign In
        </Link>
      </Wrapper>
    );
  }

  if (payment?.status === 'failed') {
    return (
      <Wrapper>
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>Payment Failed</h2>
        <p className={`mb-6 ${mutedClass}`}>Your payment could not be completed. No charges were made.</p>
        <p className={`text-sm mb-6 ${mutedClass}`}>Reference: <span className="font-mono">{reference}</span></p>
        <p className={mutedClass}>
          Please contact the merchant who shared this link with you, or get in touch at{' '}
          <a href="mailto:support@prop-capitals.com" className="text-amber-500 hover:underline">support@prop-capitals.com</a>.
        </p>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      {timedOut ? (
        <>
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Payment Still Processing</h2>
          <p className={mutedClass}>
            Your payment is taking longer than expected. If it was successful, you'll receive an email shortly with your account access.
          </p>
          <p className={`text-sm mt-2 ${mutedClass}`}>Reference: <span className="font-mono">{reference}</span></p>
        </>
      ) : (
        <>
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Confirming Your Payment...</h2>
          <p className={mutedClass}>We're waiting for payment confirmation. This usually takes a few seconds.</p>
          <p className={`text-sm mt-4 ${mutedClass}`}>Reference: <span className="font-mono">{reference}</span></p>
        </>
      )}
    </Wrapper>
  );
};

export default PayLinkSuccess;
