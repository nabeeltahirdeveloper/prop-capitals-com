import React from 'react';
import { Link } from 'react-router-dom';
import { SiX, SiInstagram, SiYoutube } from 'react-icons/si';
import { Mail } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext';

const socialLinks = [
  { Icon: <SiX className="w-4 h-4" />, url: 'https://x.com/propcapitals0' },
  { Icon: <SiInstagram className="w-5 h-5" />, url: 'https://www.instagram.com/propcapitals0/' },
  { Icon: <SiYoutube className="w-6 h-5" />, url: 'https://www.youtube.com/@propcapitals0' },
  { Icon: <Mail className="w-5 h-5" />, url: 'mailto:support@prop-capitals.com' }
]

const Footer = () => {
  const { isDark } = useTheme();

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
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                <span className="text-[#0a0d12] font-black text-lg">PC</span>
              </div>
              <div className="flex flex-col">
                <span className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  PROP<span className="text-amber-500">CAPITALS</span>
                </span>
                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>prop-capitals.com</span>
              </div>
            </Link>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Empowering traders worldwide with funded accounts and industry-leading conditions.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({Icon, url}, i) => (
                <a
                  key={url}
                  href={url}
                  target='_blank'
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
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
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Company</h4>
            <ul className="space-y-3">
              {[
                { name: 'About Us', path: '/about' },
                { name: 'Careers', path: '/careers' },
                { name: 'Contact', path: '/contact' },
                { name: 'Blog', path: '/blog' }
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
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Trading</h4>
            <ul className="space-y-3">
              {[
                { name: '1-Step Challenge', path: '/challenges' },
                { name: '2-Step Challenge', path: '/challenges' },
                { name: 'Pricing', path: '/challenges' },
                { name: 'Platforms', path: '/watch-demo' }
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
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Resources</h4>
            <ul className="space-y-3">
              {[
                { name: 'FAQs', path: '/faq' },
                { name: 'Trading Rules', path: '/trading-rules' },
                { name: 'How It Works', path: '/HowItWorks' },
                { name: 'Affiliate Program', path: '/affiliate' }
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
            <h4 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Legal</h4>
            <ul className="space-y-3">
              {[
                { name: 'Terms of Service', path: '/terms' },
                { name: 'Privacy Policy', path: '/privacy' },
                { name: 'Risk Disclosure', path: '/risk-disclosure' },
                { name: 'Refund Policy', path: '/refund-policy' }
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
              <strong className={isDark ? 'text-gray-400' : 'text-slate-600'}>Risk Disclaimer:</strong> Trading in foreign exchange and other financial instruments involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results. Prop Capitals provides simulated trading accounts; we are not a broker, investment advisor, or financial institution. All trading activities during the evaluation phase are performed in a simulated environment. Please trade responsibly and only with capital you can afford to lose.
            </p>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              © 2026 Prop-Capitals.com. All rights reserved.
            </p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              {[
                { name: 'Terms', path: '/terms' },
                { name: 'Privacy', path: '/privacy' },
                { name: 'Risk', path: '/risk-disclosure' },
                { name: 'Refunds', path: '/refund-policy' }
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
