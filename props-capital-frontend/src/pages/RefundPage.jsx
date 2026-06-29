import React from 'react';
import { RefreshCcw, CheckCircle2, XCircle, Clock, CreditCard, HelpCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';

const RefundPage = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();


  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <RefreshCcw className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className={`text-3xl sm:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('refundPolicy.pageTitle')}</h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t('refundPolicy.pageSubtitle')}</p>
          </div>

          <div className={`rounded-2xl p-6 lg:p-8 border space-y-8 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <CreditCard className="w-5 h-5 text-amber-500" />
                {t('refundPolicy.section1Heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section1Para1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section1Para2')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <XCircle className="w-5 h-5 text-red-400" />
                {t('refundPolicy.section2Heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section2Para1')}
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>
                    {t('refundPolicy.section2Para2')}
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Clock className="w-5 h-5 text-amber-500" />
                {t('refundPolicy.section3Heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section3Para1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section3Para2')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <HelpCircle className="w-5 h-5 text-amber-500" />
                {t('refundPolicy.section4Heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section4Para1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section4Para2')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('refundPolicy.section5Heading')}</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section5Para1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section5Para2')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('refundPolicy.section6Heading')}</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section6Para1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section6Para2')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('refundPolicy.section7Heading')}</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('refundPolicy.section7Para1')}
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RefundPage;
