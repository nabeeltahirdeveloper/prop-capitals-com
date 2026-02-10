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
                  Trading in foreign exchange (Forex), contracts for difference (CFDs), cryptocurrencies, and other financial instruments involves substantial risk of loss and is not suitable for all investors. You should carefully consider whether trading is appropriate for you in light of your circumstances, knowledge, and financial resources.
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 lg:p-8 border space-y-8 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <TrendingDown className="w-5 h-5 text-amber-500" />
                Market Risk
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Financial markets are subject to rapid and unexpected price movements. Prices can be influenced by economic events, political developments, natural disasters, and other factors beyond anyone's control. Past performance is not indicative of future results, and you may lose more than your initial investment.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <DollarSign className="w-5 h-5 text-amber-500" />
                Leverage Risk
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Trading with leverage can amplify both profits and losses. While leverage allows you to control larger positions with a smaller amount of capital, it also increases the risk of significant losses. You should never trade with money you cannot afford to lose.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Volatility Risk
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Financial instruments can be highly volatile. Price gaps, where the market opens at a significantly different price from the previous close, can occur, especially during periods of high volatility or after market-moving news events. This can result in losses greater than anticipated.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Shield className="w-5 h-5 text-amber-500" />
                Simulated Trading Disclaimer
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Prop Capitals provides simulated trading accounts for evaluation purposes. Results achieved in simulated trading may not reflect results that would have been achieved in real trading. Simulated results do not account for slippage, liquidity issues, and other factors that affect real trading.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>No Investment Advice</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Prop Capitals does not provide investment advice. All information provided is for educational purposes only. You should seek advice from a qualified financial advisor before making any investment decisions. We do not make any representations about the suitability of any financial product for your personal situation.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Regulatory Notice</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Prop Capitals is not a broker, investment advisor, or financial institution. We provide trading evaluation services through simulated accounts. We do not hold client funds for trading purposes. All funded trading is conducted through our partner brokers who are appropriately regulated in their respective jurisdictions.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Acknowledgment</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                By using Prop Capitals services, you acknowledge that you have read, understood, and accepted the risks associated with trading. You confirm that you are willing to assume these risks and that you will not hold Prop Capitals liable for any losses incurred.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RiskDisclosurePage;
