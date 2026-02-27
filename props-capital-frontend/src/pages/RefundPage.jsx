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
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Clear conditions for refund eligibility and processing</p>
          </div>

          <div className={`rounded-2xl p-6 lg:p-8 border space-y-8 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <CreditCard className="w-5 h-5 text-amber-500" />
                1. Eligibility for Refunds
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                1.1. Clients may request a refund within fourteen (14) calendar days from the date of purchase, provided that no trading activity has been initiated on the purchased evaluation or account.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                1.2. The refund eligibility period shall automatically expire upon the execution of any trade, regardless of trade size, duration, or outcome.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <XCircle className="w-5 h-5 text-red-400" />
                2. Non-Refundable Conditions
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                2.1. Once trading activity has commenced, the evaluation shall be deemed active, and the Client expressly acknowledges that no refunds shall be granted thereafter.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>
                    2.2. This applies equally to: Evaluation accounts, Challenge programs, and any funded or simulated trading environment.
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Clock className="w-5 h-5 text-amber-500" />
                3. Scope of Refunds
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                3.1. Refunds, where approved, apply only to the initial purchase fee paid for the evaluation or program.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                3.2. Any additional fees, third-party charges, or service costs are non-refundable, unless otherwise required by applicable law.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <HelpCircle className="w-5 h-5 text-amber-500" />
                4. Refund Processing
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                4.1. Approved refunds will be processed using the original payment method whenever possible.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                4.2. Processing times may vary depending on the payment provider and are subject to external banking or payment system delays.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>5. Abuse Prevention</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                5.1. The Company reserves the right to deny refund requests in cases of suspected abuse, fraud, or attempts to circumvent platform rules.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                5.2. Repeated refund requests or account activity indicating misuse may result in account suspension or termination.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>6. Policy Amendments</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                6.1. The Company reserves the right to amend this Refund Policy at any time.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                6.2. Any amendments shall become effective upon publication on the Company’s website unless otherwise stated.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>7. Governing Law</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                This Refund Policy shall be governed by and construed in accordance with the laws applicable to the Company’s jurisdiction of operation.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default RefundPage;
