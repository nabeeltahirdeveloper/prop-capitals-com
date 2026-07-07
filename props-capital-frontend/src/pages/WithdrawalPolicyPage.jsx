import React from 'react';
import {
  RefreshCcw,
  CheckCircle2,
  Clock,
  DollarSign,
  Shield,
  AlertTriangle,
  HelpCircle,
  CreditCard,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';

const WithdrawalPolicyPage = () => {
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
            <h1
              className={`text-3xl sm:text-4xl font-black mb-4 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {t('withdrawalPolicy.pageTitle')}
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
              {t('withdrawalPolicy.pageSubtitle')}
            </p>
          </div>

          <div
            className={`rounded-2xl p-6 lg:p-8 border space-y-8 ${
              isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
            }`}
          >
            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Shield className="w-5 h-5 text-amber-500" />
                {t('withdrawalPolicy.section1.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section1.p1')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                {t('withdrawalPolicy.section2.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section2.p1')}
              </p>

              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section2.p2')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Clock className="w-5 h-5 text-amber-500" />
                {t('withdrawalPolicy.section3.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section3.p1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section3.p2')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <DollarSign className="w-5 h-5 text-amber-500" />
                {t('withdrawalPolicy.section4.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section4.p1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section4.p2')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Clock className="w-5 h-5 text-amber-500" />
                {t('withdrawalPolicy.section5.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section5.p1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section5.p2')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-500" />
                {t('withdrawalPolicy.section6.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section6.p1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section6.p2')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Shield className="w-5 h-5 text-amber-500" />
                {t('withdrawalPolicy.section7.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section7.p1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section7.p2')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {t('withdrawalPolicy.section8.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section8.p1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section8.p2')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <HelpCircle className="w-5 h-5 text-amber-500" />
                {t('withdrawalPolicy.section9.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section9.p1')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Shield className="w-5 h-5 text-amber-500" />
                {t('withdrawalPolicy.section10.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('withdrawalPolicy.section10.p1')}
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WithdrawalPolicyPage;

