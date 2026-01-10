import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  ArrowRight,
  Check,
  Star,
  Zap,
  DollarSign,
  Calendar,
  Award,
  Target,
  ChevronRight,
  Shield,
  Rocket,
  BadgeCheck
} from 'lucide-react';

export default function ScalingPlan() {
  const { t } = useTranslation();

  const scalingLevels = [
    { level: 1, accountSize: 50000, profitSplit: 80, requirement: t('scalingPlan.requirements.passEvaluation') },
    { level: 2, accountSize: 62500, profitSplit: 82, requirement: t('scalingPlan.requirements.profitAndPayouts') },
    { level: 3, accountSize: 78125, profitSplit: 84, requirement: t('scalingPlan.requirements.profitAndPayouts') },
    { level: 4, accountSize: 97656, profitSplit: 85, requirement: t('scalingPlan.requirements.profitAndPayouts') },
    { level: 5, accountSize: 122070, profitSplit: 86, requirement: t('scalingPlan.requirements.profitAndPayouts') },
    { level: 6, accountSize: 152588, profitSplit: 87, requirement: t('scalingPlan.requirements.profitAndPayouts') },
    { level: 7, accountSize: 190735, profitSplit: 88, requirement: t('scalingPlan.requirements.profitAndPayouts') },
    { level: 8, accountSize: 238418, profitSplit: 89, requirement: t('scalingPlan.requirements.profitAndPayouts') },
    { level: 9, accountSize: 298023, profitSplit: 90, requirement: t('scalingPlan.requirements.profitAndPayouts') },
    { level: 10, accountSize: 400000, profitSplit: 90, requirement: t('scalingPlan.requirements.profitAndPayouts') },
  ];

  const benefits = [
    { icon: TrendingUp, title: t('scalingPlan.benefits.accountGrowth.title'), desc: t('scalingPlan.benefits.accountGrowth.desc') },
    { icon: DollarSign, title: t('scalingPlan.benefits.profitSplit.title'), desc: t('scalingPlan.benefits.profitSplit.desc') },
    { icon: Zap, title: t('scalingPlan.benefits.noFees.title'), desc: t('scalingPlan.benefits.noFees.desc') },
    { icon: Shield, title: t('scalingPlan.benefits.sameRules.title'), desc: t('scalingPlan.benefits.sameRules.desc') },
    { icon: Target, title: t('scalingPlan.benefits.scaleTo2M.title'), desc: t('scalingPlan.benefits.scaleTo2M.desc') },
    { icon: Award, title: t('scalingPlan.benefits.automaticUpgrades.title'), desc: t('scalingPlan.benefits.automaticUpgrades.desc') },
  ];

  const howToScale = [
    { step: '01', icon: Target, title: t('scalingPlan.howToScale.achieveProfit.title'), description: t('scalingPlan.howToScale.achieveProfit.description'), color: 'emerald' },
    { step: '02', icon: DollarSign, title: t('scalingPlan.howToScale.completePayouts.title'), description: t('scalingPlan.howToScale.completePayouts.description'), color: 'cyan' },
    { step: '03', icon: Rocket, title: t('scalingPlan.howToScale.automaticUpgrade.title'), description: t('scalingPlan.howToScale.automaticUpgrade.description'), color: 'purple' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-24 md:pt-32 pb-16 md:pb-24 overflow-x-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1920&h=1080&fit=crop"
            alt="Scaling background"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
        </div>

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-8"
            >
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400">{t('scalingPlan.badge')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight"
            >
              {t('scalingPlan.title')}
              <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                $2,000,000
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto"
            >
              {t('scalingPlan.subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to={createPageUrl('Challenges')}>
                <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-6 text-lg h-auto">
                  {t('scalingPlan.startJourney')}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mt-12 md:mt-20"
          >
            {[
              { value: '$2M', label: t('scalingPlan.stats.maxAccountSize') },
              { value: '90%', label: t('scalingPlan.stats.maxProfitSplit') },
              { value: '10', label: t('scalingPlan.stats.scalingLevels') },
              { value: '25%', label: t('scalingPlan.stats.growthPerLevel') },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-slate-400 mt-2">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">{t('scalingPlan.benefits.badge')}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-4 mb-4">
              {t('scalingPlan.benefits.title')}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              {t('scalingPlan.benefits.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-900 border-slate-800 p-4 md:p-6 h-full hover:border-purple-500/50 transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <benefit.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-slate-400">{benefit.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Scale Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">{t('scalingPlan.howToScale.badge')}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-4 mb-4">
              {t('scalingPlan.howToScale.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {howToScale.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-900 border-slate-800 p-4 md:p-6 relative overflow-hidden group hover:border-purple-500/50 transition-all">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-slate-800/50 group-hover:text-purple-500/20 transition-colors">
                    {item.step}
                  </div>
                  <div className={`w-14 h-14 bg-${item.color}-500/20 rounded-xl flex items-center justify-center mb-4`}>
                    <item.icon className={`w-7 h-7 text-${item.color}-400`} />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-slate-400">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Scaling Roadmap */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">{t('scalingPlan.roadmap.badge')}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-4 mb-4">
              {t('scalingPlan.roadmap.title')}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              {t('scalingPlan.roadmap.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {scalingLevels.map((level, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className={`bg-slate-900 border-slate-800 p-4 text-center hover:border-purple-500/50 transition-all relative ${level.level === 1 ? 'ring-2 ring-emerald-500' : ''} ${level.level === 10 ? 'ring-2 ring-purple-500' : ''}`}>
                  {level.level === 1 && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs">{t('scalingPlan.roadmap.start')}</Badge>
                    </div>
                  )}
                  {level.level === 10 && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">{t('scalingPlan.roadmap.max')}</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-400 text-sm">{t('scalingPlan.roadmap.level')} {level.level}</span>
                  </div>
                  <p className="text-lg md:text-xl font-bold text-white mb-1">
                    ${level.accountSize.toLocaleString()}
                  </p>
                  <p className="text-emerald-400 font-semibold text-sm">
                    {level.profitSplit}% {t('scalingPlan.roadmap.split')}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Ultimate Goal Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 p-4 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">{t('scalingPlan.roadmap.ultimateGoal')}</p>
                    <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      $2,000,000
                    </p>
                    <p className="text-slate-400 text-sm">{t('scalingPlan.roadmap.withProfitSplit')}</p>
                  </div>
                </div>
                <Link to={createPageUrl('Challenges')}>
                  <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                    {t('scalingPlan.roadmap.startScalingNow')}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">{t('scalingPlan.requirements.badge')}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-4 mb-4">
              {t('scalingPlan.requirements.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Target, title: t('scalingPlan.requirements.profit10.title'), desc: t('scalingPlan.requirements.profit10.desc'), color: 'emerald' },
              { icon: DollarSign, title: t('scalingPlan.requirements.payouts2.title'), desc: t('scalingPlan.requirements.payouts2.desc'), color: 'purple' },
              { icon: Calendar, title: t('scalingPlan.requirements.consistency.title'), desc: t('scalingPlan.requirements.consistency.desc'), color: 'cyan' },
              { icon: Shield, title: t('scalingPlan.requirements.noViolations.title'), desc: t('scalingPlan.requirements.noViolations.desc'), color: 'amber' },
            ].map((req, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-900 border-slate-800 p-4 md:p-6 h-full hover:border-purple-500/50 transition-all">
                  <div className={`w-12 h-12 bg-${req.color}-500/20 rounded-xl flex items-center justify-center mb-4`}>
                    <req.icon className={`w-6 h-6 text-${req.color}-400`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{req.title}</h3>
                  <p className="text-slate-400 text-sm">{req.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">
              {t('scalingPlan.ctaSection.title')}{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t('scalingPlan.ctaSection.tradingCareer')}
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              {t('scalingPlan.ctaSection.subtitle')}
            </p>
            <Link to={createPageUrl('Challenges')}>
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-12 py-6 text-lg h-auto">
                {t('scalingPlan.ctaSection.getStartedNow')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-slate-500 mt-6">
              {t('scalingPlan.ctaSection.footer')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Prop Capitals</span>
              </div>
              <p className="text-slate-400 mb-6">
                {t('home.footer.description')}
              </p>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-400">{t('home.footer.verified')}</span>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('home.footer.company')}</h4>
              <ul className="space-y-2">
                <li><Link to={createPageUrl('HowItWorks')} className="text-slate-400 hover:text-white transition-colors">{t('home.footer.howItWorks')}</Link></li>
                <li><Link to={createPageUrl('Challenges')} className="text-slate-400 hover:text-white transition-colors">{t('home.footer.challenges')}</Link></li>
                <li><Link to={createPageUrl('ScalingPlan')} className="text-slate-400 hover:text-white transition-colors">{t('home.footer.scalingPlan')}</Link></li>
                <li><Link to={createPageUrl('Payouts')} className="text-slate-400 hover:text-white transition-colors">{t('home.footer.payouts')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('home.footer.support')}</h4>
              <ul className="space-y-2">
                <li><Link to={createPageUrl('FAQ')} className="text-slate-400 hover:text-white transition-colors">{t('home.footer.faq')}</Link></li>
                <li><Link to={createPageUrl('Contact')} className="text-slate-400 hover:text-white transition-colors">{t('home.footer.contact')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('home.footer.legal')}</h4>
              <ul className="space-y-2">
                <li><Link to={createPageUrl('Terms')} className="text-slate-400 hover:text-white transition-colors">{t('home.footer.terms')}</Link></li>
                <li><Link to={createPageUrl('Privacy')} className="text-slate-400 hover:text-white transition-colors">{t('home.footer.privacy')}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              <p className="text-slate-500">{t('home.footer.copyright')}</p>
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 text-slate-600" />
                <span className="text-sm text-slate-500">{t('home.footer.secure')}</span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs text-slate-600">
                BLUEHAVEN MANAGEMENT LTD | 60 TOTTENHAM COURT ROAD, OFFICE 469, LONDON, ENGLAND W1T 2EW
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Email: support@the-bluehaven.com
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}