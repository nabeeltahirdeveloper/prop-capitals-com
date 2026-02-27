import React from 'react';
import { AlertTriangle, TrendingDown, DollarSign, BarChart3, Shield } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const RiskDisclosurePage = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className={`text-3xl sm:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Risk Disclosure</h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Important information about trading risks</p>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-red-400 font-bold text-lg mb-2">High Risk Warning</h2>
                <p className={isDark ? 'text-gray-300' : 'text-slate-700'}>
                  Trading involves significant risk of loss and may not be suitable for all investors. Please ensure you fully understand these risks before participating and only trade with money you can afford to lose.
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 lg:p-8 border space-y-8 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <TrendingDown className="w-5 h-5 text-amber-500" />
                General Information & Risk Disclosure
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Risk Disclosure: All material published and disseminated by Prop Capitals should be considered as general information only. The information provided by Prop Capitals or included here is not intended to serve as (a) investment advice, (b) an offer or solicitation to buy or sell any securities, or (c) a recommendation, endorsement, or sponsorship of any security, company, or fund. Testimonials featured on Prop Capitals's website(s) may not reflect the experiences of other clients or customers and do not guarantee future performance or success. Using the information on Prop Capitals's website(s) is at your own risk. Prop Capitals, along with its partners, representatives, agents, employees, and contractors, does not accept any responsibility or liability for the use or misuse of such information.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <DollarSign className="w-5 h-5 text-amber-500" />
                Trading Risk & Suitability
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Trading leveraged instruments carries significant risk and is not suitable for all investors. Investors may lose all or more than their initial investment. Only risk capital—money that can be lost without affecting one's financial security or lifestyle—should be used for trading, and only those with sufficient risk capital should engage in trading. This document is not a solicitation or an offer to buy or sell futures, options, or forex. Past performance does not necessarily predict future results.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Hypothetical & Simulated Performance
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Hypothetical or simulated performance results have inherent limitations. Unlike an actual performance record, simulated results do not reflect real trading. Additionally, because these trades have not been executed, the results may have under- or overcompensated for the impact of certain market factors, such as lack of liquidity. Simulated trading programs are also typically designed with the benefit of hindsight. There is no guarantee that any account will achieve profits or losses similar to those shown.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Shield className="w-5 h-5 text-amber-500" />
                CFD Availability
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Prop Capitals does not offer Contracts for Difference to residents of certain jurisdictions including the USA, Canada and Russia.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Company Information</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                This website is owned and operated by BLUEHAVEN MANAGEMENT LTD with registration number 16797169 and registered address at 60 TOTTENHAM COURT ROAD, W1T 2EW, LONDON, ENGLAND.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Ownership & Copyright</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                © 2026 BLUEHAVEN MANAGEMENT LTD. All Rights Reserved.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RiskDisclosurePage;
