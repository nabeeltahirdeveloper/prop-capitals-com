import React from 'react';
import {
  Shield,
  User,
  FileText,
  Search,
  Lock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';

const KycPolicyPage = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const requiredInfoItems = t('kycPolicy.requiredInfo.items', { returnObjects: true });
  const identityItems = t('kycPolicy.identity.items', { returnObjects: true });
  const addressItems = t('kycPolicy.address.items', { returnObjects: true });
  const fundsItems = t('kycPolicy.funds.items', { returnObjects: true });
  const refusalItems = t('kycPolicy.refusal.items', { returnObjects: true });

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-amber-500" />
            </div>
            <h1
              className={`text-3xl sm:text-4xl font-black mb-4 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {t('kycPolicy.title')}
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
              {t('kycPolicy.subtitle')}
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
                <FileText className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.purpose.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.purpose.body')}
              </p>

            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <User className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.requiredInfo.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.requiredInfo.intro')}
              </p>
              <ul className="space-y-2 list-disc list-inside">
                {requiredInfoItems.map((item, index) => (
                  <li key={index} className={isDark ? 'text-gray-400' : 'text-slate-600'}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.identity.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.identity.intro')}
              </p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                {identityItems.map((item, index) => (
                  <li key={index} className={isDark ? 'text-gray-400' : 'text-slate-600'}>{item}</li>
                ))}
              </ul>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.identity.note')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.address.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.address.intro')}
              </p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                {addressItems.map((item, index) => (
                  <li key={index} className={isDark ? 'text-gray-400' : 'text-slate-600'}>{item}</li>
                ))}
              </ul>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.address.note')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Search className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.funds.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.funds.intro')}
              </p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                {fundsItems.map((item, index) => (
                  <li key={index} className={isDark ? 'text-gray-400' : 'text-slate-600'}>{item}</li>
                ))}
              </ul>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.funds.note')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.verification.heading')}
              </h2>
              <p className={`leading-relaxed mb-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.verification.clause1')}
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.verification.clause2')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Search className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.monitoring.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.monitoring.body')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Lock className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.dataProtection.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.dataProtection.body')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.refusal.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.refusal.intro')}
              </p>
              <ul className="space-y-2 list-disc list-inside">
                {refusalItems.map((item, index) => (
                  <li key={index} className={isDark ? 'text-gray-400' : 'text-slate-600'}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.amendments.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.amendments.body')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Shield className="w-5 h-5 text-amber-500" />
                {t('kycPolicy.governingLaw.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('kycPolicy.governingLaw.body')}
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KycPolicyPage;
