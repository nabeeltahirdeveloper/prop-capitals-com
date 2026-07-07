import React from 'react';
import {
  Shield,
  FileText,
  Search,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Users,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';

const AmlPolicyPage = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const riskFactors = t('amlPolicy.riskAssessment.factors', { returnObjects: true });
  const cddMeasures = t('amlPolicy.cdd.measures', { returnObjects: true });
  const sarActions = t('amlPolicy.suspiciousActivity.actions', { returnObjects: true });

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
              {t('amlPolicy.pageTitle')}
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
              {t('amlPolicy.pageSubtitle')}
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
                {t('amlPolicy.purpose.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.purpose.body')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Users className="w-5 h-5 text-amber-500" />
                {t('amlPolicy.scope.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.scope.body')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Search className="w-5 h-5 text-amber-500" />
                {t('amlPolicy.riskAssessment.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.riskAssessment.intro')}
              </p>
              <ul className="space-y-2 list-disc list-inside">
                {riskFactors.map((item, index) => (
                  <li key={index} className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                {t('amlPolicy.cdd.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.cdd.intro')}
              </p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                {cddMeasures.map((item, index) => (
                  <li key={index} className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                    {item}
                  </li>
                ))}
              </ul>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.cdd.edd')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Eye className="w-5 h-5 text-amber-500" />
                {t('amlPolicy.transactionMonitoring.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.transactionMonitoring.body')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                {t('amlPolicy.suspiciousActivity.heading')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.suspiciousActivity.intro')}
              </p>
              <ul className="space-y-2 list-disc list-inside">
                {sarActions.map((item, index) => (
                  <li key={index} className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Lock className="w-5 h-5 text-amber-500" />
                {t('amlPolicy.recordKeeping.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.recordKeeping.body')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Users className="w-5 h-5 text-amber-500" />
                {t('amlPolicy.staffTraining.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.staffTraining.body')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-500" />
                {t('amlPolicy.amendments.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.amendments.body')}
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Shield className="w-5 h-5 text-amber-500" />
                {t('amlPolicy.governingLaw.heading')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('amlPolicy.governingLaw.body')}
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AmlPolicyPage;
