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

const KycPolicyPage = () => {
  const { isDark } = useTheme();

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
              Know Your Customer (KYC) Policy
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
              How we verify client identities and comply with AML requirements
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
                1. Purpose
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                This Know Your Customer (&quot;KYC&quot;) Policy outlines the procedures implemented by
                the Company to verify the identity of its Clients, prevent fraud, and comply with
                applicable Anti-Money Laundering (AML) and regulatory requirements. Completion of
                KYC verification is mandatory for access to certain services, including funded
                trading and withdrawals.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <User className="w-5 h-5 text-amber-500" />
                2. Required Client Information
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                To satisfy KYC requirements, each Client may be required to provide accurate,
                current, and complete information, including but not limited to:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Full legal name</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Date of birth</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Nationality</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Residential address</li>
              </ul>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-500" />
                3. Identity Verification
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Clients must submit a valid, government-issued photo identification document, which
                may include:
              </p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Passport</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>National identity card</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Driver’s license</li>
              </ul>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The submitted identification must be clear, legible, unexpired, and issued by a
                recognized governmental authority.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-500" />
                4. Proof of Address
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Clients may be required to submit proof of residential address, dated within the
                last three (3) months, such as:
              </p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Utility bill</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Bank statement</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Official government correspondence
                </li>
              </ul>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The document must clearly display the Client’s full name and residential address.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Search className="w-5 h-5 text-amber-500" />
                5. Proof of Funds
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Clients may be required to provide proof of funds to demonstrate the lawful origin
                of capital used in connection with the Company’s services. Acceptable documentation
                may include, but is not limited to:
              </p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Recent bank statements</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Salary slips or income statements</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Investment or trading account statements
                </li>
              </ul>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The Company reserves the right to request additional documentation where necessary.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                6. Verification and Review
              </h2>
              <p className={`leading-relaxed mb-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                6.1. All submitted KYC information and documentation are subject to verification and
                review.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                6.2. The Company reserves the right to reject, suspend, or restrict access to
                services if the Client fails to provide satisfactory documentation or if submitted
                information is incomplete, inaccurate, or misleading.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Search className="w-5 h-5 text-amber-500" />
                7. Ongoing Monitoring
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The Company may conduct periodic reviews and re-verification of Client information
                to ensure continued compliance with regulatory requirements.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Lock className="w-5 h-5 text-amber-500" />
                8. Data Protection
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                All personal data collected under this Policy shall be processed in accordance with
                the Company’s Privacy Policy and applicable data protection laws. Information will
                be used solely for verification, compliance, and security purposes.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                9. Refusal or Termination
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Failure to comply with KYC requirements may result in:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Denial of account access</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Suspension of trading privileges
                </li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Delay or denial of withdrawals
                </li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Termination of the Client relationship
                </li>
              </ul>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-500" />
                10. Amendments
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The Company reserves the right to amend this KYC Policy at any time. Any changes
                shall become effective upon publication on the Company’s website unless otherwise
                stated.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Shield className="w-5 h-5 text-amber-500" />
                11. Governing Law
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                This Policy shall be governed by and construed in accordance with the laws
                applicable to the Company’s jurisdiction of operation.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default KycPolicyPage;

