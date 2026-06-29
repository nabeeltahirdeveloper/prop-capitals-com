import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Clock, Target, TrendingDown, Calendar } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';

const TradingRulesPage = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const ruleContent = t('tradingRules.rules', { returnObjects: true });
  const ruleConfig = [
    { icon: TrendingDown, critical: true },
    { icon: Shield, critical: true },
    { icon: Target, critical: false },
    { icon: Calendar, critical: false },
    { icon: Clock, critical: false }
  ];
  const rules = ruleConfig.map((config, i) => ({
    ...config,
    title: ruleContent[i]?.title,
    description: ruleContent[i]?.description,
    oneStep: ruleContent[i]?.oneStep,
    twoStep: ruleContent[i]?.twoStep
  }));

  const allowedActions = t('tradingRules.allowedActions', { returnObjects: true });

  const prohibitedActions = t('tradingRules.prohibitedActions', { returnObjects: true });

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('tradingRules.eyebrow')}</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('tradingRules.headingLead')} <span className="text-amber-500">{t('tradingRules.headingHighlight')}</span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              {t('tradingRules.subheading')}
            </p>
          </div>

          {/* Rules Table */}
          <div className={`rounded-2xl border overflow-hidden mb-12 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <th className={`text-left font-semibold p-4 sm:p-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('tradingRules.tableHeaders.rule')}</th>
                    <th className="text-center text-amber-500 font-semibold p-4 sm:p-6">{t('tradingRules.tableHeaders.oneStep')}</th>
                    <th className="text-center text-emerald-400 font-semibold p-4 sm:p-6">{t('tradingRules.tableHeaders.twoStep')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, i) => (
                    <tr key={i} className={`border-b last:border-0 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                      <td className="p-4 sm:p-6">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${rule.critical ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                            <rule.icon className={`w-5 h-5 ${rule.critical ? 'text-red-400' : 'text-amber-500'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{rule.title}</h3>
                              {rule.critical && (
                                <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">{t('tradingRules.criticalBadge')}</span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{rule.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-4 sm:p-6">
                        <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{rule.oneStep}</span>
                      </td>
                      <td className="text-center p-4 sm:p-6">
                        <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{rule.twoStep}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Allowed & Prohibited */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className={`rounded-2xl p-6 lg:p-8 border border-emerald-500/20 ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('tradingRules.allowedTitle')}</h2>
              </div>
              <ul className="space-y-3">
                {allowedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={`rounded-2xl p-6 lg:p-8 border border-red-500/20 ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('tradingRules.prohibitedTitle')}</h2>
              </div>
              <ul className="space-y-3">
                {prohibitedActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="text-amber-500 font-bold mb-1">{t('tradingRules.noticeTitle')}</h3>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                {t('tradingRules.noticeBody')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TradingRulesPage;
