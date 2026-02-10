import React from 'react';
import { RefreshCcw, CheckCircle2, XCircle, Clock, CreditCard, HelpCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const RefundPage = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <RefreshCcw className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className={`text-3xl sm:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Refund Policy</h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Last updated: January 1, 2025</p>
          </div>

          {/* Highlight Box */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-emerald-400 font-bold text-lg mb-2">100% Challenge Fee Refund</h2>
                <p className={isDark ? 'text-gray-300' : 'text-slate-700'}>
                  When you pass your challenge and receive your first profit payout as a funded trader, we will refund 100% of your challenge fee. This makes your evaluation essentially free!
                </p>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 lg:p-8 border space-y-8 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <CreditCard className="w-5 h-5 text-amber-500" />
                Challenge Fee Refund
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Your challenge fee is fully refundable under the following conditions:
              </p>
              <ul className="space-y-3">
                {[
                  "You successfully pass all challenge phases",
                  "You receive a funded trading account",
                  "You make a profit and request your first payout",
                  "The refund is added to your first profit withdrawal"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <XCircle className="w-5 h-5 text-red-400" />
                Non-Refundable Situations
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Refunds will not be provided in the following cases:
              </p>
              <ul className="space-y-3">
                {[
                  "Failure to pass the challenge due to rule violations",
                  "Account termination due to prohibited trading activities",
                  "Request for refund after trading has commenced",
                  "Fraudulent or unauthorized payment methods"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Clock className="w-5 h-5 text-amber-500" />
                Refund Processing Time
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Challenge fee refunds are processed together with your first profit payout. The combined amount will be sent to your preferred payment method within our standard payout timeframe of under 90 minutes after request approval.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <HelpCircle className="w-5 h-5 text-amber-500" />
                Cooling-Off Period
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                If you have purchased a challenge but have not yet started trading (no trades executed), you may request a full refund within 14 days of purchase. To request a cooling-off refund, please contact our support team with your order details.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Retry Discounts</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                If you fail a challenge, we offer discounted retry options of up to 20% off the original price. This allows you to start fresh with a new evaluation at a reduced cost. Contact support to receive your personalized retry discount code.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Contact Us</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                If you have any questions about our refund policy, please contact us at:<br />
                Email: billing@prop-capitals.com<br />
                Live Chat: Available 24/7 on our website
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RefundPage;
