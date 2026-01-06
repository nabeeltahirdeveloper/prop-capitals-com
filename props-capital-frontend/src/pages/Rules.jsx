import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Shield,
  Target,
  Clock,
  AlertTriangle,
  Check,
  X,
  TrendingUp,
  Calendar,
  Percent,
  Scale,
  Ban,
  Award,
  ArrowRight,
  Info,
  Wallet,
  BarChart3,
  Layers
} from 'lucide-react';

export default function Rules() {
  const { t } = useTranslation();

  const mainRules = [
    {
      icon: Target,
      title: t('rules.mainRules.profitTarget.title'),
      description: t('rules.mainRules.profitTarget.description'),
      phase1: '8%',
      phase2: '5%',
      funded: t('rules.mainRules.profitTarget.funded'),
      color: 'emerald',
      image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop'
    },
    {
      icon: Shield,
      title: t('rules.mainRules.dailyDrawdown.title'),
      description: t('rules.mainRules.dailyDrawdown.description'),
      phase1: '5%',
      phase2: '5%',
      funded: '5%',
      color: 'amber',
      important: true,
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop'
    },
    {
      icon: Shield,
      title: t('rules.mainRules.maximumDrawdown.title'),
      description: t('rules.mainRules.maximumDrawdown.description'),
      phase1: '10%',
      phase2: '10%',
      funded: '10%',
      color: 'red',
      important: true,
      image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop'
    },
    {
      icon: Calendar,
      title: t('rules.mainRules.minTradingDays.title'),
      description: t('rules.mainRules.minTradingDays.description'),
      phase1: t('rules.mainRules.minTradingDays.phase1'),
      phase2: t('rules.mainRules.minTradingDays.phase2'),
      funded: t('rules.mainRules.minTradingDays.funded'),
      color: 'blue',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop'
    },
    {
      icon: Clock,
      title: t('rules.mainRules.maxTradingPeriod.title'),
      description: t('rules.mainRules.maxTradingPeriod.description'),
      phase1: t('rules.mainRules.maxTradingPeriod.phase1'),
      phase2: t('rules.mainRules.maxTradingPeriod.phase2'),
      funded: t('rules.mainRules.maxTradingPeriod.funded'),
      color: 'purple',
      image: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&h=300&fit=crop'
    },
    {
      icon: Percent,
      title: t('rules.mainRules.profitSplit.title'),
      description: t('rules.mainRules.profitSplit.description'),
      phase1: '-',
      phase2: '-',
      funded: t('rules.mainRules.profitSplit.funded'),
      color: 'cyan',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop'
    }
  ];

  const allowedActions = [
    { title: t('rules.allowedActions.allTradingStyles.title'), desc: t('rules.allowedActions.allTradingStyles.desc') },
    { title: t('rules.allowedActions.newsTrading.title'), desc: t('rules.allowedActions.newsTrading.desc') },
    { title: t('rules.allowedActions.weekendHolding.title'), desc: t('rules.allowedActions.weekendHolding.desc') },
    { title: t('rules.allowedActions.expertAdvisors.title'), desc: t('rules.allowedActions.expertAdvisors.desc') },
    { title: t('rules.allowedActions.hedging.title'), desc: t('rules.allowedActions.hedging.desc') },
    { title: t('rules.allowedActions.allInstruments.title'), desc: t('rules.allowedActions.allInstruments.desc') },
    { title: t('rules.allowedActions.anyLotSize.title'), desc: t('rules.allowedActions.anyLotSize.desc') },
    { title: t('rules.allowedActions.copyTrading.title'), desc: t('rules.allowedActions.copyTrading.desc') }
  ];

  const forbiddenActions = [
    { title: t('rules.prohibitedActions.latencyArbitrage.title'), desc: t('rules.prohibitedActions.latencyArbitrage.desc') },
    { title: t('rules.prohibitedActions.tickScalping.title'), desc: t('rules.prohibitedActions.tickScalping.desc') },
    { title: t('rules.prohibitedActions.accountManagement.title'), desc: t('rules.prohibitedActions.accountManagement.desc') },
    { title: t('rules.prohibitedActions.propFirmCopying.title'), desc: t('rules.prohibitedActions.propFirmCopying.desc') },
    { title: t('rules.prohibitedActions.toxicFlowStrategies.title'), desc: t('rules.prohibitedActions.toxicFlowStrategies.desc') },
    { title: t('rules.prohibitedActions.highFrequencyTrading.title'), desc: t('rules.prohibitedActions.highFrequencyTrading.desc') }
  ];

  const scalingPlan = [
    { level: 1, size: '$50K', split: '80%', requirement: t('rules.scalingPlan.requirements.passEvaluation') },
    { level: 2, size: '$62.5K', split: '82%', requirement: t('rules.scalingPlan.requirements.profitAndPayouts') },
    { level: 3, size: '$78K', split: '84%', requirement: t('rules.scalingPlan.requirements.profitAndPayouts') },
    { level: 4, size: '$97.5K', split: '86%', requirement: t('rules.scalingPlan.requirements.profitAndPayouts') },
    { level: 5, size: '$122K', split: '88%', requirement: t('rules.scalingPlan.requirements.profitAndPayouts') },
    { level: 6, size: '$150K+', split: '90%', requirement: t('rules.scalingPlan.requirements.profitAndPayouts') }
  ];

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-16 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=600&fit=crop"
            alt="Trading Rules"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">{t('rules.badge')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6"
            >
              {t('rules.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              {t('rules.subtitle')}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Rules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          {mainRules.map((rule, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`bg-slate-900 border-slate-800 overflow-hidden h-full ${rule.important ? 'ring-1 ring-amber-500/30' : ''}`}>
                <div className="h-40 overflow-hidden relative">
                  <img
                    src={rule.image}
                    alt={rule.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                  {rule.important && (
                    <div className="absolute top-4 right-4 px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {t('rules.important')}
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 bg-${rule.color}-500/20 rounded-xl flex items-center justify-center`}>
                      <rule.icon className={`w-6 h-6 text-${rule.color}-400`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{rule.title}</h3>
                      <p className="text-sm text-slate-400">{rule.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-400 mb-1">{t('rules.phase1')}</p>
                      <p className="text-lg font-bold text-white">{rule.phase1}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-slate-400 mb-1">{t('rules.phase2')}</p>
                      <p className="text-lg font-bold text-white">{rule.phase2}</p>
                    </div>
                    <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                      <p className="text-xs text-emerald-400 mb-1">{t('rules.funded')}</p>
                      <p className="text-lg font-bold text-emerald-400">{rule.funded}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Drawdown Explanation */}
        <Card className="bg-slate-900 border-slate-800 p-4 md:p-8 mb-12 md:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('rules.drawdownExplanation.title')}</h2>
                  <p className="text-slate-400">{t('rules.drawdownExplanation.subtitle')}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <h3 className="text-lg font-semibold text-amber-400 mb-2">{t('rules.drawdownExplanation.dailyDrawdown.title')}</h3>
                  <p className="text-slate-300">
                    {t('rules.drawdownExplanation.dailyDrawdown.description')}
                  </p>
                  <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-sm text-slate-400">
                      <strong className="text-white">{t('rules.drawdownExplanation.dailyDrawdown.example')}</strong> {t('rules.drawdownExplanation.dailyDrawdown.exampleText')}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">{t('rules.drawdownExplanation.maximumDrawdown.title')}</h3>
                  <p className="text-slate-300">
                    {t('rules.drawdownExplanation.maximumDrawdown.description')}
                  </p>
                  <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-sm text-slate-400">
                      <strong className="text-white">{t('rules.drawdownExplanation.maximumDrawdown.example')}</strong> {t('rules.drawdownExplanation.maximumDrawdown.exampleText')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop"
                alt="Drawdown Chart"
                className="rounded-xl border border-slate-800"
              />
            </div>
          </div>
        </Card>

        {/* Allowed vs Forbidden */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          {/* Allowed */}
          <Card className="bg-slate-900 border-slate-800 p-4 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('rules.allowedActions.title')}</h2>
                <p className="text-sm text-slate-400">{t('rules.allowedActions.subtitle')}</p>
              </div>
            </div>
            <div className="grid gap-3">
              {allowedActions.map((action, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">{action.title}</p>
                    <p className="text-sm text-slate-400">{action.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Forbidden */}
          <Card className="bg-slate-900 border-slate-800 p-4 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <Ban className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{t('rules.prohibitedActions.title')}</h2>
                <p className="text-sm text-slate-400">{t('rules.prohibitedActions.subtitle')}</p>
              </div>
            </div>
            <div className="grid gap-3">
              {forbiddenActions.map((action, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">{action.title}</p>
                    <p className="text-sm text-slate-400">{action.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Scaling Plan */}
        <Card className="bg-slate-900 border-slate-800 p-4 md:p-8 mb-12 md:mb-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Layers className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{t('rules.scalingPlan.title')}</h2>
              <p className="text-slate-400">{t('rules.scalingPlan.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {scalingPlan.map((level, i) => (
              <div key={i} className={`p-6 rounded-xl border ${i === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? 'bg-emerald-500' : 'bg-slate-700'} text-white font-bold`}>
                    {level.level}
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{level.size}</p>
                    <p className="text-sm text-slate-400">{t('rules.scalingPlan.accountSize')}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">{t('rules.scalingPlan.profitSplit')}</span>
                  <span className="text-emerald-400 font-bold">{level.split}</span>
                </div>
                <p className="text-sm text-slate-500">{level.requirement}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-slate-800/50 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">{t('rules.scalingPlan.howItWorks.title')}</p>
                <p className="text-sm text-slate-400">
                  {t('rules.scalingPlan.howItWorks.description')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payout Policy */}
        <Card className="bg-slate-900 border-slate-800 p-4 md:p-8 mb-12 md:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{t('rules.payoutPolicy.title')}</h2>
                  <p className="text-slate-400">{t('rules.payoutPolicy.subtitle')}</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: t('rules.payoutPolicy.frequency.label'), value: t('rules.payoutPolicy.frequency.value') },
                  { label: t('rules.payoutPolicy.minimum.label'), value: t('rules.payoutPolicy.minimum.value') },
                  { label: t('rules.payoutPolicy.maximum.label'), value: t('rules.payoutPolicy.maximum.value') },
                  { label: t('rules.payoutPolicy.processingTime.label'), value: t('rules.payoutPolicy.processingTime.value') },
                  { label: t('rules.payoutPolicy.fee.label'), value: t('rules.payoutPolicy.fee.value') },
                  { label: t('rules.payoutPolicy.firstPayout.label'), value: t('rules.payoutPolicy.firstPayout.value') }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg">
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop"
                alt="Payouts"
                className="rounded-xl border border-slate-800"
              />
            </div>
          </div>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 p-6 md:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t('rules.cta.title')}</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            {t('rules.cta.subtitle')}
          </p>
          <Link to={createPageUrl('Challenges')}>
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8">
              {t('rules.cta.viewChallenges')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}