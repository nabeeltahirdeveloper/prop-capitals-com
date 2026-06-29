import React from 'react';
import { Link } from 'react-router-dom';
import { SiX, SiInstagram, SiYoutube, SiDiscord } from 'react-icons/si';
import { Mail } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import CompanyInfo from '@/components/CompanyInfo';
import { PaymentLogos } from '@/components/PaymentLogos';

const socialLinks = [
  { Icon: <SiX className="w-4 h-4" />, url: 'https://x.com/propcapitals0' },
  { Icon: <SiInstagram className="w-[17px] h-[18px]" />, url: 'https://www.instagram.com/propcapitals0/' },
  { Icon: <SiYoutube className="w-6 h-5" />, url: 'https://www.youtube.com/@propcapitals0' },
  { Icon: <SiDiscord className="w-6 h-5" />, url: 'https://discord.gg/UDMRbQbB' },
  { Icon: <Mail className="w-5 h-5" />, url: 'mailto:support@prop-capitals.com' }
]

const Footer = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <footer className={`border-t transition-colors duration-300 ${
      isDark
        ? 'bg-[#0a0d12] border-white/5'
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Logo & Social */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                <img src="/assets/images/logo-light.png" alt="Logo" className="block dark:hidden w-full h-full object-contain" />
                <img src="/assets/images/logo-dark.png" alt="Logo Dark" className="hidden dark:block w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  PROP<span className="text-amber-500">CAPITALS</span>
                </span>
                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>prop-capitals.com</span>
              </div>
            </Link>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              {t('home.footer.tagline')}
            </p>
            <div className="mb-4">
              <CompanyInfo isDark={isDark} />
            </div>
            <div className="flex items-center gap-[6px]">
              {socialLinks.map(({Icon, url}, i) => (
                <a
                  key={url}
                  href={url}
                  target='_blank'
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isDark
                      ? 'bg-[#12161d] text-gray-400 hover:text-amber-400 hover:bg-[#1a1f2a]'
                      : 'bg-white border border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200'
                  }`}
                >
                  {Icon}
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('home.footer.company')}</h4>
            <ul className="space-y-3">
              {[
                { name: t('home.footer.aboutUs'), path: '/about' },
                { name: t('home.footer.careers'), path: '/careers' },
                { name: t('home.footer.contact'), path: '/contact' },
                { name: t('home.footer.blog'), path: '/blog' }
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trading */}
          <div>
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('home.footer.trading')}</h4>
            <ul className="space-y-3">
              {[
                { name: t('home.footer.oneStepChallenge'), path: '/challenges' },
                { name: t('home.footer.twoStepChallenge'), path: '/challenges' },
                { name: t('home.footer.pricing'), path: '/challenges' },
                { name: t('home.footer.platforms'), path: '/watch-demo' }
              ].map((item, i) => (
                <li key={i}>
                  <Link
                    to={item.path}
                    className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('home.footer.resources')}</h4>
            <ul className="space-y-3">
              {[
                { name: t('home.footer.faqs'), path: '/faq' },
                { name: t('home.footer.tradingRules'), path: '/trading-rules' },
                { name: t('home.footer.howItWorks'), path: '/HowItWorks' },
                { name: t('home.footer.affiliateProgram'), path: '/affiliate' }
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('home.footer.legal')}</h4>
            <ul className="space-y-3">
              {[
                { name: t('home.footer.terms'), path: '/terms' },
                { name: t('home.footer.privacy'), path: '/privacy' },
                { name: t('home.footer.riskDisclosure'), path: '/risk-disclosure' },
                { name: t('home.footer.refundPolicy'), path: '/refund-policy' },
                { name: t('home.footer.withdrawalPolicy'), path: '/withdrawal-policy' },
                { name: t('home.footer.kycPolicy'), path: '/kyc-policy' },
                { name: t('home.footer.amlPolicy'), path: '/aml-policy' }
              ].map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`text-sm transition-colors ${
                      isDark ? 'text-gray-400 hover:text-amber-400' : 'text-slate-500 hover:text-amber-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className={`border-t pt-8 ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
          <div className={`rounded-xl p-4 mb-8 ${isDark ? 'bg-[#12161d]' : 'bg-white border border-slate-200'}`}>
            <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              <strong className={isDark ? 'text-gray-400' : 'text-slate-600'}>{t('home.footer.riskDisclaimerLabel')}</strong> {t('home.footer.riskDisclaimerText')}
            </p>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                {t('home.footer.copyrightLine')}
              </p>
              <PaymentLogos />
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {[
                { name: t('home.footer.terms'), path: '/terms' },
                { name: t('home.footer.privacy'), path: '/privacy' },
                { name: t('home.footer.riskShort'), path: '/risk-disclosure' },
                { name: t('home.footer.refundsShort'), path: '/refund-policy' },
                { name: t('home.footer.withdrawalsShort'), path: '/withdrawal-policy' },
                { name: t('home.footer.kycShort'), path: '/kyc-policy' },
                { name: t('home.footer.amlShort'), path: '/aml-policy' }
              ].map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm transition-colors ${
                    isDark ? 'text-gray-500 hover:text-amber-400' : 'text-slate-500 hover:text-amber-600'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



