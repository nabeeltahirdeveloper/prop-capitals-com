import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Clock, Target, TrendingDown, Calendar } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const TradingRulesPage = () => {
  const { isDark } = useTheme();

  const rules = [
    {
      title: "Daily Drawdown Limit",
      description: "Your account equity must not fall below the daily drawdown limit at any point during the trading day.",
      oneStep: "4%",
      twoStep: "5%",
      icon: TrendingDown,
      critical: true
    },
    {
      title: "Maximum Drawdown",
      description: "The total account drawdown from the initial balance must not exceed this limit at any time.",
      oneStep: "8%",
      twoStep: "10%",
      icon: Shield,
      critical: true
    },
    {
      title: "Profit Target",
      description: "Achieve this profit target to pass the challenge phase and move to the next stage.",
      oneStep: "10%",
      twoStep: "8% / 5%",
      icon: Target,
      critical: false
    },
    {
      title: "Minimum Trading Days",
      description: "Trade for at least this many days before you can request a payout or pass the challenge.",
      oneStep: "5 days",
      twoStep: "5 days",
      icon: Calendar,
      critical: false
    },
    {
      title: "Time Limit",
      description: "Complete the challenge within this timeframe. Take your time - there's no rush!",
      oneStep: "Unlimited",
      twoStep: "Unlimited",
      icon: Clock,
      critical: false
    }
  ];

  const allowedActions = [
    "Expert Advisors (EAs) and automated trading bots",
    "News trading during high-impact events",
    "Weekend holding of positions",
    "Scalping with no minimum hold time",
    "Copy trading and signal services",
    "Hedging within the same account",
    "Trading all available instruments"
  ];

  const prohibitedActions = [
    "Account sharing or third-party trading",
    "Exploiting platform errors or arbitrage",
    "Using stolen or fraudulent payment methods",
    "Coordinated trading with other accounts",
    "High-frequency trading (HFT) exploitation"
  ];

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Trading Rules</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Challenge <span className="text-amber-500">Rules</span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Clear, fair, and transparent rules designed to help you succeed. No hidden conditions or surprises.
            </p>
          </div>

          {/* Rules Table */}
          <div className={`rounded-2xl border overflow-hidden mb-12 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <th className={`text-left font-semibold p-4 sm:p-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Rule</th>
                    <th className="text-center text-amber-500 font-semibold p-4 sm:p-6">1-Step Challenge</th>
                    <th className="text-center text-emerald-400 font-semibold p-4 sm:p-6">2-Step Challenge</th>
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
                                <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">CRITICAL</span>
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
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>What's Allowed</h2>
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
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>What's Prohibited</h2>
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
              <h3 className="text-amber-500 font-bold mb-1">Important Notice</h3>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>
                Violation of critical rules (Daily Drawdown or Maximum Drawdown) will result in immediate account termination. 
                Please trade responsibly and always manage your risk. If you have questions about any rules, contact our support team.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TradingRulesPage;
