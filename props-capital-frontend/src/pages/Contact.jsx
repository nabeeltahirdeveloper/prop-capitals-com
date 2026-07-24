import React from 'react';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { COMPANY_ADDRESS_LINES, COMPANY_NAME } from '@/constants/company';

const ContactPage = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Hero */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 left-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('contactPage.eyebrow')}</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('contactPage.titleLead')} <span className="text-amber-500">{t('contactPage.titleHighlight')}</span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              {t('contactPage.subtitle')}
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('contactPage.email.title')}</h3>
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('contactPage.email.desc')}</p>
                    <a href="mailto:support@prop-capitals.com" className="text-amber-500 hover:text-amber-400 font-medium">
                      support@prop-capitals.com
                    </a>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('contactPage.liveChat.title')}</h3>
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('contactPage.liveChat.desc')}</p>
                    <span className="text-emerald-400 font-medium">{t('contactPage.liveChat.value')}</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('contactPage.hours.title')}</h3>
                    <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('contactPage.hours.desc')}</p>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('contactPage.hours.value')}</span>
                  </div>
                </div>
              </div>

              <div className={`rounded-2xl p-6 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('contactPage.headquarters.title')}</h3>
                    <p className={`text-sm uppercase ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      {COMPANY_NAME}.<br />
                      {COMPANY_ADDRESS_LINES.map((line, i) => (
                        <React.Fragment key={line}>
                          {i > 0 && <br />}
                          {line}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className={`rounded-2xl p-6 lg:p-8 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
              <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('contactPage.form.heading')}</h2>
              <form className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('contactPage.form.firstName')}</label>
                    <input
                      type="text"
                      className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${
                        isDark
                          ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                      placeholder={t('contactPage.form.firstNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('contactPage.form.lastName')}</label>
                    <input
                      type="text"
                      className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${
                        isDark
                          ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                      }`}
                      placeholder={t('contactPage.form.lastNamePlaceholder')}
                    />
                  </div>
                </div>
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('contactPage.form.emailLabel')}</label>
                  <input 
                    type="email" 
                    className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${
                      isDark 
                        ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500' 
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('contactPage.form.subjectLabel')}</label>
                  <select className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${
                    isDark
                      ? 'bg-[#0a0d12] border border-white/10 text-white'
                      : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`}>
                    <option value="">{t('contactPage.form.subjectPlaceholder')}</option>
                    <option value="general">{t('contactPage.form.subjectGeneral')}</option>
                    <option value="support">{t('contactPage.form.subjectSupport')}</option>
                    <option value="billing">{t('contactPage.form.subjectBilling')}</option>
                    <option value="partnership">{t('contactPage.form.subjectPartnership')}</option>
                  </select>
                </div>
                <div>
                  <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{t('contactPage.form.messageLabel')}</label>
                  <textarea
                    rows={4}
                    className={`w-full rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-amber-500/50 ${
                      isDark
                        ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500'
                        : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                    placeholder={t('contactPage.form.messagePlaceholder')}
                  ></textarea>
                </div>
                <Button className="w-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl py-6 h-auto font-bold">
                  <Send className="w-5 h-5 mr-2" />
                  {t('contactPage.form.submit')}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
