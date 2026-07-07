import { useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';

const PayLinkFail = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference');

  const cardClass = isDark
    ? 'bg-[#12161d] border border-white/5'
    : 'bg-white border border-slate-200';
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className={`min-h-screen pt-20 pb-12 flex items-center justify-center px-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <div className={`${cardClass} rounded-2xl p-12 text-center max-w-xl w-full`}>
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>{t('payLink.fail.title')}</h2>
        <p className={`mb-6 ${mutedClass}`}>
          {t('payLink.fail.description')}
        </p>
        {reference && (
          <p className={`text-sm mb-6 ${mutedClass}`}>
            {t('worldCardFail.reference')} <span className="font-mono">{reference}</span>
          </p>
        )}
        <p className={mutedClass}>
          {t('payLink.fail.retryHint')}
        </p>
        <p className={`text-sm mt-4 ${mutedClass}`}>
          {t('payLink.fail.needHelp')} <a href="mailto:support@prop-capitals.com" className="text-amber-500 hover:underline">support@prop-capitals.com</a>.
        </p>
      </div>
    </div>
  );
};

export default PayLinkFail;
