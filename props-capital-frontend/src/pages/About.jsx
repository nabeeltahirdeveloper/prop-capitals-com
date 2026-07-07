import React from 'react';
import { ArrowRight, Users, DollarSign, Globe, Award, Shield, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LanguageContext';
import PartialStarRating from '@/components/PartialStarRating';

const statsMeta = [
  { icon: Users, value: '18,500+', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: DollarSign, value: '$15.2M+', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { icon: Globe, value: '120+', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: Clock, value: '<90 min', color: 'text-amber-400', bg: 'bg-amber-500/10' }
];

const valuesMeta = [Shield, TrendingUp, Award, Clock];

const timelineYears = ['2022', '2023', '2024', '2025'];

const team = [
  { nameKey: 'team.0.name', roleKey: 'team.0.role', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop' },
  { nameKey: 'team.1.name', roleKey: 'team.1.role', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop' },
  { nameKey: 'team.2.name', roleKey: 'team.2.role', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
  { nameKey: 'team.3.name', roleKey: 'team.3.role', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' }
];

const About = () => {
  const { isDark } = useTheme();
  const { cur } = useCurrency();
  const { t } = useTranslation();

  const statLabels = t('aboutPage.stats.labels', { returnObjects: true });
  const values = t('aboutPage.values.items', { returnObjects: true });
  const timeline = t('aboutPage.timeline.items', { returnObjects: true });
  const missionChecklist = t('aboutPage.mission.checklist', { returnObjects: true });

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Hero Section */}
      <section className="py-12 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 left-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('aboutPage.hero.badge')}</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-6xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('aboutPage.hero.titleLead')} <br className="hidden lg:block" />
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">{t('aboutPage.hero.titleHighlight')}</span>
            </h1>
            <p className={`text-base lg:text-xl max-w-3xl mx-auto leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              {t('aboutPage.hero.subtitle')}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {statsMeta.map((stat, index) => (
              <div
                key={index}
                className={`rounded-2xl p-5 lg:p-6 border text-center hover:border-amber-500/30 transition-all ${
                  isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
                }`}
              >
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div className={`text-2xl lg:text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{cur(stat.value)}</div>
                <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{statLabels[index]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('aboutPage.mission.badge')}</span>
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('aboutPage.mission.titleLead')} <span className="text-amber-500">{t('aboutPage.mission.titleHighlight')}</span>
              </h2>
              <p className={`text-base lg:text-lg mb-6 leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('aboutPage.mission.paragraph1')}
              </p>
              <p className={`text-base lg:text-lg mb-8 leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {t('aboutPage.mission.paragraph2')}
              </p>
              <div className="space-y-3">
                {missionChecklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className={isDark ? 'text-gray-300' : 'text-slate-700'}>{cur(item)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className={`rounded-3xl p-8 border ${isDark ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 flex items-center justify-center ${isDark ? 'border-[#12161d]' : 'border-slate-50'}`}>
                        <span className="text-[#0a0d12] font-bold text-xs">{String.fromCharCode(65 + i)}</span>
                      </div>
                    ))}
                  </div>
                  <span className={`text-sm ml-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('aboutPage.mission.tradersBadge')}</span>
                </div>
                <blockquote className={`text-lg lg:text-xl font-medium mb-4 leading-relaxed ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {t('aboutPage.mission.quote')}
                </blockquote>
                <p className="text-amber-500 font-semibold">{t('aboutPage.mission.quoteAuthor')}</p>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{t('aboutPage.mission.quoteRole')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('aboutPage.values.badge')}</span>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('aboutPage.values.titleLead')} <span className="text-amber-500">{t('aboutPage.values.titleHighlight')}</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const ValueIcon = valuesMeta[index];
              return (
                <div
                  key={index}
                  className={`rounded-2xl p-6 border hover:border-amber-500/30 transition-all group ${
                    isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                    {ValueIcon && <ValueIcon className="w-7 h-7 text-amber-500" />}
                  </div>
                  <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{value.title}</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-gradient-to-b from-[#0d1117] to-[#0a0d12]' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('aboutPage.timeline.badge')}</span>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('aboutPage.timeline.titleLead')} <span className="text-amber-500">{t('aboutPage.timeline.titleHighlight')}</span>
            </h2>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 lg:left-1/2 top-0 bottom-0 w-0.5 bg-amber-500/20 lg:-translate-x-0.5"></div>

            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className={`relative flex items-start gap-6 lg:gap-0 ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                  {/* Dot */}
                  <div className="absolute left-4 lg:left-1/2 w-4 h-4 bg-amber-400 rounded-full -translate-x-1/2 mt-1.5 z-10 shadow-lg shadow-amber-500/30"></div>
                  
                  {/* Content */}
                  <div className={`ml-12 lg:ml-0 lg:w-1/2 ${index % 2 === 0 ? 'lg:pr-12 lg:text-right' : 'lg:pl-12'}`}>
                    <div className={`rounded-2xl p-5 border inline-block ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                      <span className="text-amber-500 font-bold text-xl">{timelineYears[index]}</span>
                      <h3 className={`font-bold text-lg mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                      <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{cur(item.description)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('aboutPage.team.badge')}</span>
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('aboutPage.team.titleLead')} <span className="text-amber-500">{t('aboutPage.team.titleHighlight')}</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => {
              const memberName = t(`aboutPage.${member.nameKey}`);
              return (
                <div
                  key={index}
                  className={`rounded-2xl p-6 border hover:border-amber-500/30 transition-all text-center group ${
                    isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="relative inline-block mb-4">
                    <img
                      src={member.image}
                      alt={memberName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-amber-400/50 group-hover:border-amber-400 transition-colors"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 ${isDark ? 'border-[#12161d]' : 'border-white'}`}></div>
                  </div>
                  <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>{memberName}</h3>
                  <p className="text-amber-500 text-sm">{t(`aboutPage.${member.roleKey}`)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trustpilot Section */}
      <section className={`py-16 lg:py-20 ${isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-3xl p-8 lg:p-12 border text-center ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-center gap-2 mb-4">
              {/* Official Trustpilot wordmark — no background plate, sits directly on the card */}
              <svg viewBox="0 0 34 34" className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path
                  fill="#00B67A"
                  d="M33.523 11.969H20.722L16.768 0 12.8 11.97 0 11.957l10.367 7.404-3.966 11.956 10.367-7.392 10.355 7.392-3.954-11.956 10.354-7.392z"
                />
                <path d="m24.058 22.069-.89-2.707-6.4 4.564 7.29-1.857z" fill="#126849" />
              </svg>
              <span className={`font-semibold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Trustpilot</span>
            </div>
            <div className="flex items-center justify-center mb-4">
              <PartialStarRating rating={4.8} size={32} />
            </div>
            <p className={`text-3xl lg:text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('aboutPage.trustpilot.score')}</p>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>{t('aboutPage.trustpilot.reviews')}</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 lg:py-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('aboutPage.cta.titleLead')} <span className="text-amber-500">{t('aboutPage.cta.titleHighlight')}</span>{t('aboutPage.cta.titleTrail')}
          </h2>
          <p className={`text-base lg:text-lg mb-8 max-w-xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            {t('aboutPage.cta.subtitle')}
          </p>
          <Link to="/challenges">
            <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-10 py-6 h-auto text-lg font-bold shadow-xl shadow-amber-500/25 group">
              {t('aboutPage.cta.button')}
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
