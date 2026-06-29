import React from 'react';
import { Monitor, Target, BookOpen, TrendingUp, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';

const cardIcons = ['monitor', 'target', 'book', 'trending'];

const getIcon = (iconName) => {
  switch(iconName) {
    case 'monitor': return Monitor;
    case 'target': return Target;
    case 'book': return BookOpen;
    case 'trending': return TrendingUp;
    default: return BookOpen;
  }
};

const EducationSection = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const educationData = t('home.education.cards', { returnObjects: true });
  const featureList = t('home.education.featureList', { returnObjects: true });

  return (
    <section className={`py-20 lg:py-32 transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-gradient-to-b from-white to-slate-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('home.education.badge')}</span>
            <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('home.education.title')} <span className="text-amber-500">{t('home.education.titleHighlight')}</span>
            </h2>
            <p className={`text-lg mb-8 leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              {t('home.education.subtitle')}
            </p>

            <div className="space-y-4 mb-8">
              {featureList.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'
                  }`}>
                    <ChevronRight className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>{item}</span>
                </div>
              ))}
            </div>

            <Link to="/watch-demo">
              <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-6 py-5 h-auto font-bold shadow-lg shadow-amber-500/25">
                <Play className="mr-2 w-5 h-5" />
                {t('home.education.watchPreview')}
              </Button>
            </Link>
          </div>

          {/* Education Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {educationData.map((item, index) => {
              const IconComponent = getIcon(cardIcons[index]);
              return (
                <div 
                  key={index}
                  className={`rounded-2xl p-5 border transition-all duration-300 hover:-translate-y-1 ${
                    isDark 
                      ? 'bg-[#12161d] border-white/10 hover:border-amber-500/30' 
                      : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    isDark ? 'bg-amber-500/10' : 'bg-amber-100'
                  }`}>
                    <IconComponent className="w-5 h-5 text-amber-500" />
                  </div>
                  <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h4>
                  <ul className="space-y-1.5">
                    <li className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      <ChevronRight className="w-3 h-3 text-amber-500" />
                      {item.item1}
                    </li>
                    <li className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      <ChevronRight className="w-3 h-3 text-amber-500" />
                      {item.item2}
                    </li>
                    <li className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      <ChevronRight className="w-3 h-3 text-amber-500" />
                      {item.item3}
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EducationSection;
