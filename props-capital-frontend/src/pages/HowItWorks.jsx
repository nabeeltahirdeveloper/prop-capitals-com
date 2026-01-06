import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import PropTradingExplainer from '../components/marketing/PropTradingExplainer';
import {
  Target,
  TrendingUp,
  Wallet,
  ArrowRight,
  Check,
  Shield,
  Clock,
  Award,
  Rocket,
  LineChart,
  Trophy,
  DollarSign,
  Zap,
  Play,
  ChevronRight,
  Star,
  BarChart3
} from 'lucide-react';

export default function HowItWorks() {
  const { t } = useTranslation();

  const phases = [
    {
      step: 1,
      title: t('howItWorks.phases.purchaseChallenge.title'),
      description: t('howItWorks.phases.purchaseChallenge.description'),
      icon: Rocket,
      color: 'from-blue-500 to-cyan-500',
      image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&h=400&fit=crop',
      details: [
        t('howItWorks.phases.purchaseChallenge.details.selectAccountSize'),
        t('howItWorks.phases.purchaseChallenge.details.chooseType'),
        t('howItWorks.phases.purchaseChallenge.details.receiveCredentials'),
        t('howItWorks.phases.purchaseChallenge.details.startTrading')
      ]
    },
    {
      step: 2,
      title: t('howItWorks.phases.passEvaluation.title'),
      description: t('howItWorks.phases.passEvaluation.description'),
      icon: LineChart,
      color: 'from-emerald-500 to-teal-500',
      image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop',
      details: [
        t('howItWorks.phases.passEvaluation.details.reachProfitTarget'),
        t('howItWorks.phases.passEvaluation.details.maintainDailyDrawdown'),
        t('howItWorks.phases.passEvaluation.details.maintainOverallDrawdown'),
        t('howItWorks.phases.passEvaluation.details.tradeMinimumDays')
      ]
    },
    {
      step: 3,
      title: t('howItWorks.phases.getFunded.title'),
      description: t('howItWorks.phases.getFunded.description'),
      icon: Trophy,
      color: 'from-purple-500 to-pink-500',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop',
      details: [
        t('howItWorks.phases.getFunded.details.tradeWithCapital'),
        t('howItWorks.phases.getFunded.details.keepProfits'),
        t('howItWorks.phases.getFunded.details.biWeeklyPayout'),
        t('howItWorks.phases.getFunded.details.scaleUp')
      ]
    }
  ];

  const rules = [
    {
      icon: Target,
      title: t('howItWorks.rules.profitTarget.title'),
      phase1: '8%',
      phase2: '5%',
      funded: t('howItWorks.rules.profitTarget.funded'),
      description: t('howItWorks.rules.profitTarget.description')
    },
    {
      icon: Shield,
      title: t('howItWorks.rules.dailyDrawdown.title'),
      phase1: '5%',
      phase2: '5%',
      funded: '5%',
      description: t('howItWorks.rules.dailyDrawdown.description')
    },
    {
      icon: Shield,
      title: t('howItWorks.rules.overallDrawdown.title'),
      phase1: '10%',
      phase2: '10%',
      funded: '10%',
      description: t('howItWorks.rules.overallDrawdown.description')
    },
    {
      icon: Clock,
      title: t('howItWorks.rules.minTradingDays.title'),
      phase1: t('howItWorks.rules.minTradingDays.phase1'),
      phase2: t('howItWorks.rules.minTradingDays.phase2'),
      funded: t('howItWorks.rules.minTradingDays.funded'),
      description: t('howItWorks.rules.minTradingDays.description')
    },
    {
      icon: Clock,
      title: t('howItWorks.rules.timeLimit.title'),
      phase1: t('howItWorks.rules.timeLimit.phase1'),
      phase2: t('howItWorks.rules.timeLimit.phase2'),
      funded: t('howItWorks.rules.timeLimit.funded'),
      description: t('howItWorks.rules.timeLimit.description')
    },
    {
      icon: Award,
      title: t('howItWorks.rules.profitSplit.title'),
      phase1: '-',
      phase2: '-',
      funded: t('howItWorks.rules.profitSplit.funded'),
      description: t('howItWorks.rules.profitSplit.description')
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-16 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=800&fit=crop"
            alt="Trading"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">{t('howItWorks.journeyBadge')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6"
            >
              {t('howItWorks.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              {t('howItWorks.subtitle')}
            </motion.p>
          </div>

          {/* Animated Explainer Video */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-3xl blur-xl" />
            <PropTradingExplainer />
          </motion.div>
        </div>
      </div>

      {/* Steps Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="space-y-16 md:space-y-24">
          {phases.map((phase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${phase.color} flex items-center justify-center`}>
                    <phase.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <span className="text-sm text-slate-400">{t('howItWorks.step')} {phase.step}</span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{phase.title}</h2>
                  </div>
                </div>
                <p className="text-lg text-slate-400 mb-8">{phase.description}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {phase.details.map((detail, j) => (
                    <div key={j} className="flex items-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                      <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-slate-300">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <div className={`absolute -inset-4 bg-gradient-to-r ${phase.color} opacity-20 rounded-2xl blur-xl`} />
                  <img
                    src={phase.image}
                    alt={phase.title}
                    className="relative rounded-2xl border border-slate-800 shadow-2xl"
                  />
                  {/* Step Number Badge */}
                  <div className={`absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br ${phase.color} rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                    {phase.step}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Rules Comparison */}
      <div className="bg-slate-900/50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">{t('howItWorks.rules.badge')}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-4 mb-4">{t('howItWorks.rules.title')}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {t('howItWorks.rules.subtitle')}
            </p>
          </div>

          <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left p-6 text-slate-400 font-medium">{t('howItWorks.rules.rule')}</th>
                    <th className="text-center p-6 text-white font-semibold">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <Zap className="w-5 h-5 text-blue-400" />
                        </div>
                        {t('howItWorks.rules.phase1')}
                      </div>
                    </th>
                    <th className="text-center p-6 text-white font-semibold">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-purple-400" />
                        </div>
                        {t('howItWorks.rules.phase2')}
                      </div>
                    </th>
                    <th className="text-center p-6 text-white font-semibold">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <Trophy className="w-5 h-5 text-emerald-400" />
                        </div>
                        {t('howItWorks.rules.funded')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule, i) => (
                    <tr key={i} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                            <rule.icon className="w-5 h-5 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">{rule.title}</p>
                            <p className="text-sm text-slate-500">{rule.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-6 text-slate-300 text-lg">{rule.phase1}</td>
                      <td className="text-center p-6 text-slate-300 text-lg">{rule.phase2}</td>
                      <td className="text-center p-6 text-emerald-400 font-semibold text-lg">{rule.funded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Allowed Trading */}
      <div className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">{t('howItWorks.allowedTrading.badge')}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-4 mb-4">{t('howItWorks.allowedTrading.title')}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {t('howItWorks.allowedTrading.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { title: t('howItWorks.allowedTrading.allTradingStyles.title'), desc: t('howItWorks.allowedTrading.allTradingStyles.desc'), image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop' },
              { title: t('howItWorks.allowedTrading.newsTrading.title'), desc: t('howItWorks.allowedTrading.newsTrading.desc'), image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop' },
              { title: t('howItWorks.allowedTrading.weekendHolding.title'), desc: t('howItWorks.allowedTrading.weekendHolding.desc'), image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop' },
              { title: t('howItWorks.allowedTrading.expertAdvisors.title'), desc: t('howItWorks.allowedTrading.expertAdvisors.desc'), image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=300&fit=crop' },
              { title: t('howItWorks.allowedTrading.allMajorPairs.title'), desc: t('howItWorks.allowedTrading.allMajorPairs.desc'), image: 'https://images.unsplash.com/photo-1642543348745-03b1219733d9?w=400&h=300&fit=crop' },
              { title: t('howItWorks.allowedTrading.anyStrategy.title'), desc: t('howItWorks.allowedTrading.anyStrategy.desc'), image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop' },
              { title: t('howItWorks.allowedTrading.copyTrading.title'), desc: t('howItWorks.allowedTrading.copyTrading.desc'), image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop' },
              { title: t('howItWorks.allowedTrading.multipleAccounts.title'), desc: t('howItWorks.allowedTrading.multipleAccounts.desc'), image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-900 border-slate-800 overflow-hidden group hover:border-emerald-500/50 transition-all">
                  <div className="h-32 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium">{item.title}</p>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 p-6 md:p-12 text-center relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&h=400&fit=crop"
              alt="Success"
              className="w-full h-full object-cover opacity-10"
            />
          </div>
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t('howItWorks.cta.title')}</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              {t('howItWorks.cta.subtitle')}
            </p>
            <Link to={createPageUrl('Challenges')}>
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8">
                {t('howItWorks.cta.viewChallenges')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}