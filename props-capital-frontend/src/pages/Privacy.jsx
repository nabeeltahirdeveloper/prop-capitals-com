import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('privacy.title')}</h1>
          <p className="text-slate-400 mb-8">{t('privacy.lastUpdated')}</p>

          <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6 md:p-8">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.informationWeCollect.title')}</h2>
              <p className="text-slate-400 mb-4">{t('privacy.informationWeCollect.intro')}</p>
              <ul className="text-slate-400 mb-6 list-disc pl-6 space-y-2">
                {(t('privacy.informationWeCollect.items', { returnObjects: true }) || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.howWeUse.title')}</h2>
              <ul className="text-slate-400 mb-6 list-disc pl-6 space-y-2">
                {(t('privacy.howWeUse.items', { returnObjects: true }) || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.dataSecurity.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('privacy.dataSecurity.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.dataSharing.title')}</h2>
              <p className="text-slate-400 mb-4">{t('privacy.dataSharing.intro')}</p>
              <ul className="text-slate-400 mb-6 list-disc pl-6 space-y-2">
                {(t('privacy.dataSharing.items', { returnObjects: true }) || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.yourRights.title')}</h2>
              <p className="text-slate-400 mb-4">{t('privacy.yourRights.intro')}</p>
              <ul className="text-slate-400 mb-6 list-disc pl-6 space-y-2">
                {(t('privacy.yourRights.items', { returnObjects: true }) || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.cookies.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('privacy.cookies.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.dataRetention.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('privacy.dataRetention.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.internationalTransfers.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('privacy.internationalTransfers.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.childrensPrivacy.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('privacy.childrensPrivacy.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.contactUs.title')}</h2>
              <p className="text-slate-400">
                {t('privacy.contactUs.content')}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}