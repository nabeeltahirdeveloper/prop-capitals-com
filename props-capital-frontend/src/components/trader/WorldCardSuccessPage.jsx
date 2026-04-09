import { useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, AlertTriangle, ArrowRight, Mail, Download, ExternalLink } from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { getPaymentStatus } from '@/api/payments';

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const WorldCardSuccessPage = () => {
  const { isDark } = useTraderTheme();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');
  const pollStart = useRef(Date.now());

  const { data: payment, isLoading, isError, error } = useQuery({
    queryKey: ['payment-status', reference],
    queryFn: () => getPaymentStatus(reference),
    enabled: !!reference,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'succeeded' || status === 'failed') return false;
      if (Date.now() - pollStart.current > POLL_TIMEOUT) return false;
      return POLL_INTERVAL;
    },
  });

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  const timedOut = Date.now() - pollStart.current > POLL_TIMEOUT && payment?.status === 'pending';

  // No reference in URL
  if (!reference) {
    return (
      <div className={`${cardClass} p-12 text-center`}>
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Missing Payment Reference</h2>
        <p className={mutedClass}>No payment reference found. Please check your email or contact support.</p>
        <Link to="/traderdashboard" className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Loading initial fetch
  if (isLoading) {
    return (
      <div className={`${cardClass} p-12 text-center`}>
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Checking Payment Status...</h2>
        <p className={mutedClass}>Please wait while we verify your payment.</p>
      </div>
    );
  }

  // Network error
  if (isError) {
    return (
      <div className={`${cardClass} p-12 text-center`}>
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Unable to Check Payment</h2>
        <p className={mutedClass}>{error?.message || 'Something went wrong. Please try again.'}</p>
        <Link to="/traderdashboard" className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  // Payment succeeded and account provisioned
  if (payment?.status === 'succeeded' && payment?.tradingAccountId) {
    return (
      <div className={`${cardClass} p-12 text-center`}>
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>Purchase Successful!</h2>
        <p className={`mb-6 ${mutedClass}`}>Your challenge account has been activated. Check your email for platform credentials.</p>

        <div className={`rounded-xl p-6 mb-8 text-left max-w-md mx-auto ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
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

        {/* What's next */}
        <div className="text-left max-w-md mx-auto mb-8">
          <h3 className={`font-bold mb-4 ${textClass}`}>What happens next?</h3>
          <div className="space-y-4">
            {[
              { icon: Mail, title: 'Check Your Email', desc: "You'll receive login credentials shortly" },
              { icon: Download, title: 'Download Platform', desc: 'Install your selected trading platform' },
              { icon: ExternalLink, title: 'Start Trading', desc: 'Login and begin your evaluation' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                  <item.icon className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h4 className={`font-semibold ${textClass}`}>{item.title}</h4>
                  <p className={`text-sm ${mutedClass}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Link to="/traderdashboard" className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl flex items-center gap-2">
            Go to Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/traderdashboard/trading" className={`px-6 py-3 rounded-xl font-medium ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}>
            Start Trading
          </Link>
        </div>
      </div>
    );
  }

  // Payment succeeded but account not yet provisioned (rare — webhook delay)
  if (payment?.status === 'succeeded' && !payment?.tradingAccountId) {
    return (
      <div className={`${cardClass} p-12 text-center`}>
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Payment Confirmed!</h2>
        <p className={mutedClass}>Your payment was successful. Your trading account is being set up — this usually takes a few seconds.</p>
        <p className={`text-sm mt-4 ${mutedClass}`}>Reference: <span className="font-mono">{reference}</span></p>
      </div>
    );
  }

  // Payment failed
  if (payment?.status === 'failed') {
    return (
      <div className={`${cardClass} p-12 text-center`}>
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>Payment Failed</h2>
        <p className={`mb-6 ${mutedClass}`}>Your payment could not be completed. No charges were made.</p>
        <p className={`text-sm mb-6 ${mutedClass}`}>Reference: <span className="font-mono">{reference}</span></p>
        <div className="flex justify-center gap-4">
          <Link to="/traderdashboard/checkout" className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl">
            Try Again
          </Link>
          <Link to="/traderdashboard" className={`px-6 py-3 rounded-xl font-medium ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Pending (still polling) or timed out
  return (
    <div className={`${cardClass} p-12 text-center`}>
      {timedOut ? (
        <>
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Payment Still Processing</h2>
          <p className={mutedClass}>
            Your payment is taking longer than expected. Don't worry — if the payment was successful, your account will be activated automatically.
          </p>
          <p className={`text-sm mt-2 ${mutedClass}`}>Reference: <span className="font-mono">{reference}</span></p>
          <p className={`text-sm mt-4 ${mutedClass}`}>
            Check back on your dashboard or contact{' '}
            <a href="mailto:support@prop-capitals.com" className="text-amber-500 hover:underline">support@prop-capitals.com</a>
          </p>
          <Link to="/traderdashboard" className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl">
            Go to Dashboard
          </Link>
        </>
      ) : (
        <>
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${textClass}`}>Confirming Your Payment...</h2>
          <p className={mutedClass}>We're waiting for payment confirmation. This usually takes a few seconds.</p>
          <p className={`text-sm mt-4 ${mutedClass}`}>Reference: <span className="font-mono">{reference}</span></p>
        </>
      )}
    </div>
  );
};

export default WorldCardSuccessPage;
