import React from 'react';
import { FileText, Scale, Shield, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const TermsPage = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className={`text-3xl sm:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Terms of Service</h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Last updated: January 1, 2025</p>
          </div>

          <div className={`rounded-2xl p-6 lg:p-8 border space-y-8 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>1. Agreement to Terms</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                By accessing or using the Prop Capitals website and services at prop-capitals.com ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>2. Description of Service</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Prop Capitals provides simulated trading evaluation programs ("Challenges") that allow participants to demonstrate their trading abilities. Successful participants may receive access to funded trading accounts. All trading activities during the evaluation phase are conducted in a simulated environment.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>3. Eligibility</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                You must be at least 18 years old and legally capable of entering into binding contracts in your jurisdiction to use our Service. By using the Service, you represent and warrant that you meet these requirements.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>4. Account Registration</h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                To access certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>5. Challenge Rules and Trading Conditions</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                All trading challenges are subject to specific rules including profit targets, drawdown limits, and trading restrictions. These rules are displayed on our website and must be followed. Violation of challenge rules may result in account termination without refund.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>6. Payments and Refunds</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Challenge fees are due at the time of purchase. We offer a 100% fee refund with your first profit payout as a funded trader. Refund requests outside of this policy are subject to our Refund Policy. All payments are processed securely through our payment providers.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>7. Intellectual Property</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                The Service and its original content, features, and functionality are owned by Prop Capitals and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>8. Limitation of Liability</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Prop Capitals shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. Our total liability shall not exceed the amount paid by you for the Service in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>9. Governing Law</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>10. Contact Us</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                If you have any questions about these Terms, please contact us at:<br />
                Email: legal@prop-capitals.com<br />
                Address: International Business Center, Dubai, UAE
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsPage;
