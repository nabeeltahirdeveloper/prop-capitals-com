import React from 'react';
import { Shield, Eye, Lock, Database, UserCheck, Globe } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';

const PrivacyPage = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const collectItems = t('privacy.informationWeCollect.items', { returnObjects: true });
  const useItems = t('privacy.howWeUse.items', { returnObjects: true });
  const rightsItems = t('privacy.yourRights.items', { returnObjects: true });

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className={`text-3xl sm:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('privacy.title')}</h1>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t('privacy.lastUpdated')}</p>
          </div>

          <div className={`rounded-2xl p-6 lg:p-8 border space-y-8 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Eye className="w-5 h-5 text-amber-500" />
                {t('privacy.informationWeCollect.title')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('privacy.informationWeCollect.intro')}
              </p>
              <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {collectItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Database className="w-5 h-5 text-amber-500" />
                {t('privacy.howWeUse.title')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('privacy.howWeUse.intro')}
              </p>
              <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {useItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Lock className="w-5 h-5 text-amber-500" />
                {t('privacy.dataSecurity.title')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('privacy.dataSecurity.content')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <Globe className="w-5 h-5 text-amber-500" />
                {t('privacy.internationalTransfers.title')}
              </h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('privacy.internationalTransfers.content')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <UserCheck className="w-5 h-5 text-amber-500" />
                {t('privacy.yourRights.title')}
              </h2>
              <p className={`leading-relaxed mb-4 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('privacy.yourRights.intro')}
              </p>
              <ul className={`list-disc list-inside space-y-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {rightsItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('privacy.cookies.title')}</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('privacy.cookies.content')}
              </p>
            </section>

            <section>
              <h2 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('privacy.contactUs.title')}</h2>
              <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('privacy.contactUs.intro')}<br />
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>BLUEHAVEN MANAGEMENT LTD</strong><br />
                {t('privacy.contactUs.emailLabel')}: privacy@prop-capitals.com<br />
                {t('privacy.contactUs.addressLabel')}: 60 TOTTENHAM COURT ROAD, OFFICE 469, LONDON, ENGLAND
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPage;
