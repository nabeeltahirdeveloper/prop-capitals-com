import React from 'react';
import { AlertTriangle, TrendingDown, DollarSign, BarChart3, Shield } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { COMPANY_ADDRESS, COMPANY_NAME, COMPANY_REGISTRATION_NUMBER } from '@/constants/company';

const RiskDisclosurePage = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className={`text-3xl sm:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('riskDisclosure.pageTitle')}</h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t('riskDisclosure.pageSubtitle')}</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-red-400 font-bold text-lg mb-2">{t('riskDisclosure.highRiskWarning.heading')}</h2>
                <p className={isDark ? 'text-gray-300' : 'text-slate-700'}>
                  {t('riskDisclosure.highRiskWarning.body')}
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 lg:p-8 border space-y-8 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <TrendingDown className="w-5 h-5 text-amber-500" />
                {t('riskDisclosure.generalInfo.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('riskDisclosure.generalInfo.body')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <DollarSign className="w-5 h-5 text-amber-500" />
                {t('riskDisclosure.tradingRisk.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('riskDisclosure.tradingRisk.body')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BarChart3 className="w-5 h-5 text-amber-500" />
                {t('riskDisclosure.hypotheticalPerformance.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('riskDisclosure.hypotheticalPerformance.body')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Shield className="w-5 h-5 text-amber-500" />
                {t('riskDisclosure.cfdAvailability.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('riskDisclosure.cfdAvailability.body')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('riskDisclosure.companyInfo.heading')}</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('riskDisclosure.companyInfo.body', { entity: COMPANY_NAME, registrationNumber: COMPANY_REGISTRATION_NUMBER, address: COMPANY_ADDRESS })}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('riskDisclosure.ownershipCopyright.heading')}</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('riskDisclosure.ownershipCopyright.body', { year: '2026', entity: 'BLUEHAVEN MANAGEMENT LTD' })}
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RiskDisclosurePage;
