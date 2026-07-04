import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, AlertTriangle, Mail } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { getPaymentStatus } from '@/api/payments';

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 5 * 60 * 1000;

const PayLinkSuccess = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
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
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>{t('worldCardSuccess.missingReferenceTitle')}</h2>
        <p className={mutedClass}>{t('payLink.success.missingReferenceDesc')}</p>
      </Wrapper>
    );
  }

  if (isLoading) {
    return (
      <Wrapper>
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>{t('worldCardSuccess.checkingStatusTitle')}</h2>
        <p className={mutedClass}>{t('worldCardSuccess.checkingStatusDesc')}</p>
      </Wrapper>
    );
  }

  if (isError) {
    return (
      <Wrapper>
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>{t('worldCardSuccess.unableToCheckTitle')}</h2>
        <p className={mutedClass}>{error?.message || t('payLink.success.checkError')}</p>
      </Wrapper>
    );
  }

  if (payment?.status === 'succeeded') {
    return (
      <Wrapper>
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>{t('payLink.success.successTitle')}</h2>
        <p className={`mb-6 ${mutedClass}`}>{t('payLink.success.successDesc')}</p>

        <div className={`rounded-xl p-6 mb-6 text-left max-w-sm mx-auto ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
          <div className={`flex justify-between items-center mb-3 pb-3 border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <span className={mutedClass}>{t('worldCardSuccess.reference')}</span>
            <span className={`font-mono font-bold text-sm ${textClass}`}>{reference}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className={mutedClass}>{t('worldCardSuccess.status')}</span>
            <span className="flex items-center gap-2 text-emerald-500 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              {t('worldCardSuccess.active')}
            </span>
          </div>
        </div>

        <div className={`rounded-xl p-5 text-left flex items-start gap-3 ${isDark ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
          <Mail className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className={`font-semibold ${textClass}`}>{t('payLink.success.checkEmailTitle')}</p>
            <p className={mutedClass}>
              {t('payLink.success.checkEmailBody')}
            </p>
          </div>
        </div>

      </Wrapper>
    );
  }

  if (payment?.status === 'failed') {
    return (
      <Wrapper>
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>{t('worldCardSuccess.paymentFailedTitle')}</h2>
        <p className={`mb-6 ${mutedClass}`}>{t('worldCardSuccess.paymentFailedDesc')}</p>
        <p className={`text-sm mb-6 ${mutedClass}`}>{t('worldCardSuccess.referenceLabel')} <span className="font-mono">{reference}</span></p>
        <p className={mutedClass}>
          {t('payLink.success.failedContactPrefix')}{' '}
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
          <h2 className={`text-xl font-bold mb-2 ${textClass}`}>{t('worldCardSuccess.stillProcessingTitle')}</h2>
          <p className={mutedClass}>
            {t('payLink.success.stillProcessingDesc')}
          </p>
          <p className={`text-sm mt-2 ${mutedClass}`}>{t('worldCardSuccess.referenceLabel')} <span className="font-mono">{reference}</span></p>
        </>
      ) : (
        <>
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <h2 className={`text-xl font-bold mb-2 ${textClass}`}>{t('worldCardSuccess.confirmingTitle')}</h2>
          <p className={mutedClass}>{t('worldCardSuccess.confirmingDesc')}</p>
          <p className={`text-sm mt-4 ${mutedClass}`}>{t('worldCardSuccess.referenceLabel')} <span className="font-mono">{reference}</span></p>
        </>
      )}
    </Wrapper>
  );
};

export default PayLinkSuccess;
