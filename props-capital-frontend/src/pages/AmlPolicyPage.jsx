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

const AmlPolicyPage = () => {
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
              Anti-Money Laundering (AML) Policy
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
              Our commitment to preventing money laundering and terrorist financing
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
                This Anti-Money Laundering (&quot;AML&quot;) Policy sets out the measures and
                procedures adopted by BLUEHAVEN MANAGEMENT LTD (&quot;the Company&quot;) to detect,
                prevent, and report money laundering, terrorist financing, and other financial crimes
                in accordance with applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Users className="w-5 h-5 text-amber-500" />
                2. Scope
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                This Policy applies to all directors, officers, employees, contractors, and agents of
                the Company. It also applies to all business relationships and transactions conducted
                through the Company&apos;s platforms and services.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Search className="w-5 h-5 text-amber-500" />
                3. Risk Assessment
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The Company conducts regular risk assessments to identify and evaluate money
                laundering and terrorist financing risks. Risk factors considered include but are not
                limited to:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Client risk profile and geographic location</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Nature and complexity of products and services</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Transaction patterns and volumes</li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>Delivery channels and payment methods used</li>
              </ul>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-amber-500" />
                4. Customer Due Diligence (CDD)
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The Company applies Customer Due Diligence measures before establishing a business
                relationship or processing transactions. CDD procedures include:
              </p>
              <ul className="space-y-2 list-disc list-inside mb-4">
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Verifying the identity of clients using reliable, independent documents
                </li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Identifying and verifying beneficial owners where applicable
                </li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Understanding the purpose and intended nature of the business relationship
                </li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Conducting ongoing monitoring of transactions and activities
                </li>
              </ul>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Enhanced Due Diligence (EDD) is applied where higher risks are identified, including
                for politically exposed persons (PEPs) and clients from higher-risk jurisdictions.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Eye className="w-5 h-5 text-amber-500" />
                5. Transaction Monitoring
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The Company monitors client transactions on an ongoing basis to detect unusual or
                suspicious activity. Monitoring includes automated systems and manual review
                processes designed to identify transactions that are inconsistent with a
                client&apos;s known profile, business activities, or risk assessment.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                6. Suspicious Activity Reporting
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Where there are reasonable grounds to suspect that a transaction or activity may be
                related to money laundering or terrorist financing, the Company will:
              </p>
              <ul className="space-y-2 list-disc list-inside">
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  File a Suspicious Activity Report (SAR) with the relevant authorities
                </li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Refrain from disclosing the existence of the report to the client (tipping off)
                </li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Cooperate fully with law enforcement and regulatory bodies
                </li>
                <li className={isDark ? 'text-gray-400' : 'text-slate-600'}>
                  Suspend or terminate the business relationship where appropriate
                </li>
              </ul>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Lock className="w-5 h-5 text-amber-500" />
                7. Record Keeping
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The Company maintains records of all client identification documents, transaction
                records, and due diligence information for a minimum period of five (5) years from
                the date of the transaction or the end of the business relationship, whichever is
                later, in compliance with applicable legal requirements.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Users className="w-5 h-5 text-amber-500" />
                8. Staff Training
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                All relevant personnel receive regular training on AML policies, procedures, and
                obligations. Training covers the identification of suspicious activities, reporting
                procedures, and updates to applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2
                className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <FileText className="w-5 h-5 text-amber-500" />
                9. Amendments
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The Company reserves the right to amend this AML Policy at any time. Any changes
                shall become effective upon publication on the Company&apos;s website unless otherwise
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
                10. Governing Law
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                This Policy shall be governed by and construed in accordance with the laws of England
                and Wales applicable to the Company&apos;s jurisdiction of operation.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AmlPolicyPage;
