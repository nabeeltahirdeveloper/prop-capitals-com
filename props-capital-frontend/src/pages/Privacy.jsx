import React from 'react';
import { Shield, Eye, Lock, Database, UserCheck, Globe } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const PrivacyPage = () => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className={`text-3xl sm:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Privacy Policy</h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Last updated: January 1, 2025</p>
          </div>

          <div className={`rounded-2xl p-6 lg:p-8 border space-y-8 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Eye className="w-5 h-5 text-amber-500" />
                Information We Collect
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                We collect information you provide directly to us, including:
              </p>
              <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                <li>Name, email address, and contact information</li>
                <li>Payment and billing information</li>
                <li>Trading account data and performance metrics</li>
                <li>Communication preferences</li>
                <li>Any other information you choose to provide</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Database className="w-5 h-5 text-amber-500" />
                How We Use Your Information
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                We use the information we collect to:
              </p>
              <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Lock className="w-5 h-5 text-amber-500" />
                Data Security
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of data in transit and at rest, regular security assessments, and strict access controls.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Globe className="w-5 h-5 text-amber-500" />
                International Data Transfers
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Your information may be transferred to and processed in countries other than your own. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <UserCheck className="w-5 h-5 text-amber-500" />
                Your Rights
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                You have the right to:
              </p>
              <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate personal data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Cookies</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                We use cookies and similar tracking technologies to collect and track information about your browsing activities. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Contact Us</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                If you have any questions about this Privacy Policy, please contact us at:<br />
                Email: privacy@prop-capitals.com<br />
                Address: International Business Center, Dubai, UAE
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
