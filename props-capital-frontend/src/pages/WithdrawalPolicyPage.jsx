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

const WithdrawalPolicyPage = () => {
  const { isDark } = useTheme();

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
              Withdrawal (Payout) Policy
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
              How and when profit withdrawals are processed for funded accounts
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
                1. General Provisions
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                This Withdrawal Policy (&quot;Policy&quot;) governs the conditions under which eligible
                Clients may request and receive profit withdrawals from their funded trading accounts.
                By participating in funded trading programs, the Client agrees to be bound by this
                Policy, the Terms and Conditions, and all related platform rules.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                2. Payout Eligibility
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                2.1. The Client shall become eligible to request a withdrawal after completing
                fourteen (14) consecutive calendar days of funded trading activity, provided all
                trading rules and risk management requirements have been fully complied with.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                2.2. Eligibility for subsequent withdrawals shall be subject to ongoing compliance
                with all platform policies, including but not limited to trading conduct, risk
                limits, and account integrity.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Clock className="w-5 h-5 text-amber-500" />
                3. Payout Frequency
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                3.1. Withdrawal requests may be submitted on a bi-weekly basis, defined as once
                every fourteen (14) calendar days.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                3.2. The Company reserves the right to modify payout schedules at its discretion,
                subject to prior notice where required by applicable law.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <DollarSign className="w-5 h-5 text-amber-500" />
                4. Withdrawal Amounts
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                4.1. The minimum withdrawal amount per request is USD 50 (fifty United States
                dollars).
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                4.2. There is no maximum withdrawal limit, provided the requested amount represents
                legitimately earned profits in accordance with platform rules.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Clock className="w-5 h-5 text-amber-500" />
                5. Processing Time
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                5.1. Approved withdrawal requests shall be processed within twenty-four (24) to
                forty-eight (48) hours from the time of submission.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                5.2. Processing times may be extended due to compliance reviews, technical issues,
                payment provider delays, or force majeure events.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <CreditCard className="w-5 h-5 text-amber-500" />
                6. Fees
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                6.1. The Company does not charge any withdrawal fees.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                6.2. Any third-party fees imposed by banks, payment processors, or intermediaries
                are the sole responsibility of the Client.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Shield className="w-5 h-5 text-amber-500" />
                7. Compliance and Verification
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                7.1. All withdrawal requests are subject to standard Know Your Customer (KYC),
                Anti-Money Laundering (AML), and fraud prevention checks.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                7.2. The Company reserves the right to request additional documentation or
                clarification prior to approving any withdrawal.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                8. Violations and Withholding
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                8.1. The Company reserves the right to delay, suspend, reduce, or deny withdrawals
                in cases of suspected rule violations, abusive trading practices, manipulation, or
                breach of contractual obligations.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                8.2. Any profits derived from prohibited or non-compliant trading activity shall be
                deemed invalid and non-withdrawable.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <HelpCircle className="w-5 h-5 text-amber-500" />
                9. Amendments
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                9.1. The Company may amend this Policy at any time. Updated versions shall become
                effective upon publication on the Company’s website unless otherwise stated.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Shield className="w-5 h-5 text-amber-500" />
                10. Governing Law
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                This Policy shall be governed by and construed in accordance with the laws
                applicable to the Company’s jurisdiction of operation, without regard to conflict of
                law principles.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WithdrawalPolicyPage;

