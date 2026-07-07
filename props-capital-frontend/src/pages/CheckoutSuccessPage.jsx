import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Mail, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';

const CheckoutSuccessPage = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') || 'DEMO12345';

  return (
    <div className={`min-h-screen pt-20 pb-12 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`rounded-3xl p-8 lg:p-12 border text-center ${
          isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
        }`}>
          {/* Success Icon */}
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>

          <h1 className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('checkout.success.title')}
          </h1>

          <p className={`text-lg mb-6 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            {t('checkout.success.subtitle')}
          </p>

          {/* Order Details */}
          <div className={`rounded-xl p-6 mb-8 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t('checkout.success.orderId')}</span>
              <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>#{orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t('worldCardSuccess.status')}</span>
              <span className="flex items-center gap-2 text-emerald-500 font-medium">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                {t('checkout.success.processing')}
              </span>
            </div>
          </div>


          {/* What's Next */}
          <div className="text-left mb-8">
            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('checkout.success.whatNext')}</h3>
            <div className="space-y-4">
              {[
                { icon: Mail, title: t('checkout.success.steps.email.title'), desc: t('checkout.success.steps.email.desc') },
                { icon: Download, title: t('checkout.success.steps.download.title'), desc: t('checkout.success.steps.download.desc') },
                { icon: ExternalLink, title: t('worldCardSuccess.startTrading'), desc: t('checkout.success.steps.trade.desc') }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDark ? 'bg-amber-500/10' : 'bg-amber-50'
                  }`}>
                    <item.icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 py-5 h-auto font-bold">
                {t('checkout.success.backHome')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/trading-rules">
              <Button variant="outline" className={`w-full sm:w-auto rounded-full px-8 py-5 h-auto ${
                isDark 
                  ? 'border-white/20 text-white hover:bg-white/5' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}>
                {t('checkout.success.viewRules')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Support */}
        <p className={`text-center mt-6 text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
          {t('checkout.success.needHelpPrefix')}{' '}
          <a href="mailto:support@prop-capitals.com" className="text-amber-500 hover:text-amber-400">
            support@prop-capitals.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
