import React from 'react';
import { Monitor, Globe, Zap } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';


const PlatformsSection = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  return (
    <section className={`py-20 lg:py-32 transition-colors duration-300 ${isDark ? 'bg-[#0d1117]' : 'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('home.platforms.eyebrow')}</span>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('home.platforms.titlePrefix')} <span className="text-amber-500">{t('home.platforms.titleHighlight')}</span>
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            {t('home.platforms.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PlatformCard
            isDark={isDark}
            name="MetaTrader 5"
            logo="MT5"
            color="#6366f1"
            badgeLabel={t('home.platforms.newBadge')}
            description={t('home.platforms.mt5.description')}
            features={t('home.platforms.mt5.features', { returnObjects: true })}
          />
          <PlatformCard
            isDark={isDark}
            name="TradeLocker"
            logo="TL"
            color="#f59e0b"
            badgeLabel={t('home.platforms.newBadge')}
            description={t('home.platforms.tradeLocker.description')}
            features={t('home.platforms.tradeLocker.features', { returnObjects: true })}
          />
          <PlatformCard
            isDark={isDark}
            name="Bybit"
            logo="BB"
            color="#f7a600"
            badgeLabel={t('home.platforms.newBadge')}
            description={t('home.platforms.bybit.description')}
            features={t('home.platforms.bybit.features', { returnObjects: true })}
          />
          <PlatformCard
            isDark={isDark}
            name="PT5 WebTrader"
            logo="PT5"
            color="#d97706"
            badgeLabel={t('home.platforms.newBadge')}
            description={t('home.platforms.pt5.description')}
            features={t('home.platforms.pt5.features', { returnObjects: true })}
            isProprietary={true}
          />
        </div>

        <div className={`mt-12 rounded-2xl p-6 lg:p-8 border ${
          isDark ? 'bg-[#12161d] border-white/10' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <FeatureItem isDark={isDark} icon={Monitor} label={t('home.platforms.highlights.webPlatform.label')} value={t('home.platforms.highlights.webPlatform.value')} />
            <FeatureItem isDark={isDark} icon={Globe} label={t('home.platforms.highlights.instruments.label')} value={t('home.platforms.highlights.instruments.value')} />
            <FeatureItem isDark={isDark} icon={Zap} label={t('home.platforms.highlights.spreads.label')} value={t('home.platforms.highlights.spreads.value')} />
          </div>
        </div>
      </div>
    </section>
  );
};

const PlatformCard = ({ isDark, name, logo, color, description, features, isProprietary, badgeLabel }) => (
  <div className={`rounded-2xl p-6 border transition-all duration-300 group hover:-translate-y-2 relative overflow-hidden ${
    isProprietary 
      ? isDark 
        ? 'border-amber-500/50 hover:border-amber-400 bg-[#12161d]' 
        : 'border-amber-300 hover:border-amber-400 bg-amber-50/50'
      : isDark 
        ? 'border-white/10 hover:border-amber-500/30 bg-[#12161d]' 
        : 'border-slate-200 hover:border-amber-300 bg-white shadow-sm'
  }`}>
    {isProprietary && (
      <div className="absolute top-2 -right-9 bg-gradient-to-r from-amber-400 to-amber-600 text-[#0a0d12] text-xs font-bold px-10 py-1.5 rotate-45 whitespace-nowrap">
        {badgeLabel}
      </div>
    )}
    <div 
      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
      style={{ backgroundColor: `${color}20` }}
    >
      <span className="font-black text-lg" style={{ color: color }}>{logo}</span>
    </div>
    <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{name}</h3>
    <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{description}</p>
    <div className="space-y-2">
      {features.map((feature, i) => (
        <div key={i} className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-amber-500" />
          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{feature}</span>
        </div>
      ))}
    </div>
  </div>
);

const FeatureItem = ({ isDark, icon: Icon, label, value }) => (
  <div className="flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
      isDark ? 'bg-amber-500/10' : 'bg-amber-100'
    }`}>
      <Icon className="w-6 h-6 text-amber-500" />
    </div>
    <div>
      <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{label}</p>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{value}</p>
    </div>
  </div>
);

export default PlatformsSection;

