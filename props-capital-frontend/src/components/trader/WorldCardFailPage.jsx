import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { XCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { useTranslation } from '@/contexts/LanguageContext';
import { getPaymentStatus } from '@/api/payments';

const WorldCardFailPage = () => {
  const { isDark } = useTraderTheme();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');

  // If we have a reference, check the real status — backend is the source of truth
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment-status', reference],
    queryFn: () => getPaymentStatus(reference),
    enabled: !!reference,
    retry: 1,
  });

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  // Still checking backend
  if (reference && isLoading) {
    return (
      <div className={`${cardClass} p-12 text-center`}>
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
        <h2 className={`text-xl font-bold mb-2 ${textClass}`}>{t('worldCardFail.checkingTitle')}</h2>
        <p className={mutedClass}>{t('worldCardFail.checkingDescription')}</p>
      </div>
    );
  }

  // Backend says payment actually succeeded — show truth, not the redirect status
  if (payment?.status === 'succeeded') {
    return (
      <div className={`${cardClass} p-12 text-center`}>
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>{t('worldCardFail.successTitle')}</h2>
        <p className={`mb-6 ${mutedClass}`}>
          {t('worldCardFail.successDescription')}
        </p>
        {reference && <p className={`text-sm mb-6 ${mutedClass}`}>{t('worldCardFail.reference')} <span className="font-mono">{reference}</span></p>}
        <div className="flex justify-center gap-4">
          <Link to="/traderdashboard" className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl flex items-center gap-2">
            {t('worldCardFail.goToDashboard')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Default: show failure state
  return (
    <div className={`${cardClass} p-12 text-center`}>
      <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-500" />
      </div>
      <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>{t('worldCardFail.failedTitle')}</h2>
      <p className={`mb-6 ${mutedClass}`}>
        {t('worldCardFail.failedDescription')}
      </p>
      {reference && <p className={`text-sm mb-6 ${mutedClass}`}>{t('worldCardFail.reference')} <span className="font-mono">{reference}</span></p>}

      <div className="flex justify-center gap-4">
        <Link to="/traderdashboard/checkout" className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl">
          {t('worldCardFail.tryAgain')}
        </Link>
        <Link to="/traderdashboard" className={`px-6 py-3 rounded-xl font-medium ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}>
          {t('worldCardFail.goToDashboard')}
        </Link>
      </div>

      <p className={`text-sm mt-8 ${mutedClass}`}>
        {t('worldCardFail.needHelp')}{' '}
        <a href="mailto:support@prop-capitals.com" className="text-amber-500 hover:underline">support@prop-capitals.com</a>
      </p>
    </div>
  );
};

export default WorldCardFailPage;
