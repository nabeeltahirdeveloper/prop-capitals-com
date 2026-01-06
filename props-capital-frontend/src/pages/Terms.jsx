import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('terms.title')}</h1>
          <p className="text-slate-400 mb-8">{t('terms.lastUpdated')}</p>

          <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6 md:p-8">
            <div className="prose prose-invert max-w-none">
              <h2 className="text-xl font-bold text-white mb-4">{t('terms.acceptance.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('terms.acceptance.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.description.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('terms.description.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.eligibility.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('terms.eligibility.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.accountRegistration.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('terms.accountRegistration.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.tradingRules.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('terms.tradingRules.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.prohibitedActivities.title')}</h2>
              <ul className="text-slate-400 mb-6 list-disc pl-6 space-y-2">
                {(t('terms.prohibitedActivities.items', { returnObjects: true }) || []).map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.refundPolicy.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('terms.refundPolicy.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.payouts.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('terms.payouts.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.intellectualProperty.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('terms.intellectualProperty.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.limitationOfLiability.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('terms.limitationOfLiability.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.modifications.title')}</h2>
              <p className="text-slate-400 mb-6">
                {t('terms.modifications.content')}
              </p>

              <h2 className="text-xl font-bold text-white mb-4">{t('terms.contact.title')}</h2>
              <p className="text-slate-400">
                {t('terms.contact.content')}
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}