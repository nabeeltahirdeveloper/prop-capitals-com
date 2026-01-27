import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useTranslation } from '../contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Check,
  ArrowRight,
  Shield,
  Target,
  Clock,
  Zap,
  Info,
  Star,
  Award,
  TrendingUp,
  Calendar,
  Percent,
  DollarSign,
  BarChart3,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Challenges() {
  const { t } = useTranslation();
  const [challengeType, setChallengeType] = useState('two_phase');

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const response = await api.get('/challenges');
      return response.data;
    },
  });

  const mockChallenges = [
    {
      id: '1',
      name: '$10,000 Challenge',
      account_size: 10000,
      price: 99,
      challenge_type: challengeType,
      phase1_profit_target: 8,
      phase2_profit_target: 5,
      max_daily_drawdown: 5,
      max_overall_drawdown: 10,
      min_trading_days: 4,
      profit_split: 80,
      features: ['Unlimited trading period', 'All trading styles allowed', 'Free retake on 8% profit', 'Weekend holding allowed']
    },
    {
      id: '2',
      name: '$25,000 Challenge',
      account_size: 25000,
      price: 199,
      challenge_type: challengeType,
      phase1_profit_target: 8,
      phase2_profit_target: 5,
      max_daily_drawdown: 5,
      max_overall_drawdown: 10,
      min_trading_days: 4,
      profit_split: 80,
      features: ['Unlimited trading period', 'All trading styles allowed', 'Free retake on 8% profit', 'Weekend holding allowed']
    },
    {
      id: '3',
      name: '$50,000 Challenge',
      account_size: 50000,
      price: 299,
      challenge_type: challengeType,
      phase1_profit_target: 8,
      phase2_profit_target: 5,
      max_daily_drawdown: 5,
      max_overall_drawdown: 10,
      min_trading_days: 4,
      profit_split: 85,
      popular: true,
      features: ['Unlimited trading period', 'All trading styles allowed', 'Free retake on 8% profit', 'Weekend holding allowed', 'Priority support']
    },
    {
      id: '4',
      name: '$100,000 Challenge',
      account_size: 100000,
      price: 499,
      challenge_type: challengeType,
      phase1_profit_target: 8,
      phase2_profit_target: 5,
      max_daily_drawdown: 5,
      max_overall_drawdown: 10,
      min_trading_days: 4,
      profit_split: 85,
      features: ['Unlimited trading period', 'All trading styles allowed', 'Free retake on 8% profit', 'Weekend holding allowed', 'Priority support']
    },
    {
      id: '5',
      name: '$200,000 Challenge',
      account_size: 200000,
      price: 999,
      challenge_type: challengeType,
      phase1_profit_target: 8,
      phase2_profit_target: 5,
      max_daily_drawdown: 5,
      max_overall_drawdown: 10,
      min_trading_days: 4,
      profit_split: 90,
      features: ['Unlimited trading period', 'All trading styles allowed', 'Free retake on 8% profit', 'Weekend holding allowed', 'Priority support', 'Dedicated account manager']
    },
  ];

  // Normalize API challenges to match expected field names
  const normalizedChallenges = challenges.map(challenge => {
    // Helper to safely get numeric value
    const getNumericValue = (value) => {
      if (value === null || value === undefined) return null;
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return isNaN(num) ? null : num;
    };

    return {
      ...challenge,
      account_size: challenge.accountSize || challenge.account_size,
      price: challenge.price || challenge.cost,
      challenge_type: challenge.challengeType || challenge.challenge_type || challenge.type,
      phase1_profit_target: getNumericValue(challenge.phase1TargetPercent || challenge.phase1Target || challenge.phase1_profit_target || challenge.phase1ProfitTarget),
      phase2_profit_target: getNumericValue(challenge.phase2TargetPercent || challenge.phase2Target || challenge.phase2_profit_target || challenge.phase2ProfitTarget),
      max_daily_drawdown: getNumericValue(challenge.dailyDrawdownPercent || challenge.maxDailyDrawdown || challenge.max_daily_drawdown || challenge.maxDailyDrawdownPercent),
      max_overall_drawdown: getNumericValue(challenge.overallDrawdownPercent || challenge.maxOverallDrawdown || challenge.max_overall_drawdown || challenge.maxOverallDrawdownPercent),
      min_trading_days: challenge.minTradingDays || challenge.min_trading_days,
      profit_split: getNumericValue(challenge.profitSplit || challenge.profit_split || challenge.profitSplitPercent || challenge.profitSplitPercentage || challenge.profit_split_percent || challenge.profit_split_percentage || challenge.profitSplitValue) ?? 80,
    };
  });

  // Only use real challenges from backend, no mock data fallback
  const displayChallenges = normalizedChallenges;

  const rules = [
    { icon: Target, label: t('challenges.rules.phase1Target'), value: '8%', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { icon: Target, label: t('challenges.rules.phase2Target'), value: '5%', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
    { icon: Shield, label: t('challenges.rules.dailyDrawdown'), value: '5%', color: 'text-amber-400', bg: 'bg-amber-500/20' },
    { icon: Shield, label: t('challenges.rules.maxDrawdown'), value: '10%', color: 'text-red-400', bg: 'bg-red-500/20' },
    { icon: Calendar, label: t('challenges.rules.minTradingDays'), value: t('challenges.rules.fourDays'), color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { icon: Clock, label: t('challenges.rules.timeLimit'), value: t('challenges.rules.unlimited'), color: 'text-purple-400', bg: 'bg-purple-500/20' },
  ];

  const challengeTypeInfo = {
    one_phase: {
      title: t('challenges.types.onePhase.title'),
      description: t('challenges.types.onePhase.description'),
      image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&h=400&fit=crop'
    },
    two_phase: {
      title: t('challenges.types.twoPhase.title'),
      description: t('challenges.types.twoPhase.description'),
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&h=400&fit=crop'
    },
    instant_funding: {
      title: t('challenges.types.instantFunding.title'),
      description: t('challenges.types.instantFunding.description'),
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=600&h=400&fit=crop'
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-16 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1920&h=600&fit=crop"
            alt="Trading"
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
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">{t('challenges.badge')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
            >
              {t('challenges.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              {t('challenges.subtitle')}
            </motion.p>
          </div>

          {/* Challenge Type Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-slate-900 rounded-2xl p-2 border border-slate-800">
              <div className="flex flex-col sm:flex-row gap-2">
                {[
                  { value: 'one_phase', label: t('challenges.typeLabels.onePhase'), icon: Zap },
                  { value: 'two_phase', label: t('challenges.typeLabels.twoPhase'), icon: Target },
                  { value: 'instant_funding', label: t('challenges.typeLabels.instant'), icon: Sparkles }
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setChallengeType(type.value)}
                    className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${challengeType === type.value
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                  >
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Challenge Type Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-slate-900/50 border-slate-800 overflow-hidden mb-8 md:mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                <div className="p-4 sm:p-6 md:p-8">
                  <h2 className="text-2xl font-bold text-white mb-3">{challengeTypeInfo[challengeType].title}</h2>
                  <p className="text-slate-400 mb-6">{challengeTypeInfo[challengeType].description}</p>
                  <div className="grid grid-cols-3 gap-3 md:gap-4">
                    {rules.slice(0, 3).map((rule, i) => (
                      <div key={i} className="text-center">
                        <div className={`w-12 h-12 ${rule.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                          <rule.icon className={`w-6 h-6 ${rule.color}`} />
                        </div>
                        <p className="text-xs text-slate-400">{rule.label}</p>
                        <p className="text-lg font-semibold text-white">{rule.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative h-64 md:h-auto">
                  <img
                    src={challengeTypeInfo[challengeType].image}
                    alt={challengeTypeInfo[challengeType].title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent" />
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Rules Summary */}
        <Card className="bg-slate-900/50 border-slate-800 p-4 md:p-6 mb-8 md:mb-12">
          <h3 className="text-lg font-semibold text-white mb-6 text-center">{t('challenges.rules.title')}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
            {rules.map((rule, i) => (
              <div key={i} className="text-center group">
                <div className={`w-14 h-14 ${rule.bg} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <rule.icon className={`w-7 h-7 ${rule.color}`} />
                </div>
                <p className="text-sm text-slate-400 mb-1">{rule.label}</p>
                <p className="text-xl font-bold text-white">{rule.value}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Challenge Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-16">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="bg-slate-900 border-slate-800 p-6 h-full">
                <Skeleton className="h-16 w-16 mx-auto mb-4 rounded-2xl" />
                <Skeleton className="h-6 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-32 mx-auto mb-6" />
                <div className="space-y-2 mb-6">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-8 w-20 mx-auto" />
              </Card>
            ))}
          </div>
        ) : displayChallenges.length === 0 ? (
          <div className="text-center py-12 mb-16">
            <p className="text-slate-400">{t('challenges.noChallenges')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-16">
            {displayChallenges.map((challenge, i) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`relative bg-slate-900 border-slate-800 p-4 sm:p-6 h-full flex flex-col hover:border-emerald-500/50 transition-all hover:-translate-y-2 ${challenge.popular ? 'ring-2 ring-emerald-500' : ''}`}>
                  {challenge.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> {t('challenges.card.mostPopular')}
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="text-3xl font-bold text-white">
                      ${challenge.account_size?.toLocaleString()}
                    </p>
                    <p className="text-slate-400">{t('challenges.card.accountSize')}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {t('challenges.card.phase1')}
                      </span>
                      <span className="text-white font-medium">{challenge.phase1_profit_target}%</span>
                    </div>
                    {challengeType === 'two_phase' && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {t('challenges.card.phase2')}
                        </span>
                        <span className="text-white font-medium">{challenge.phase2_profit_target}%</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        {t('challenges.card.dailyDD')}
                      </span>
                      <span className="text-white font-medium">{challenge.max_daily_drawdown}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Shield className="w-4 h-4" />
                        {t('challenges.card.maxDD')}
                      </span>
                      <span className="text-white font-medium">{challenge.max_overall_drawdown}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Percent className="w-4 h-4" />
                        {t('challenges.card.profitSplit')}
                      </span>
                      <span className="text-emerald-400 font-bold">{challenge.profit_split ?? 'N/A'}%</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6 flex-grow">
                    {challenge.features?.slice(0, 3).map((feature, j) => (
                      <div key={j} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto">
                    <p className="text-center text-3xl font-bold text-white mb-4">
                      ${challenge.price}
                    </p>
                    <Link to={createPageUrl('BuyChallenge') + `?challengeId=${challenge.id}&size=${challenge.account_size}`}>
                      <Button
                        className={`w-full ${challenge.popular
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600'
                          : 'bg-slate-800 hover:bg-slate-700'
                          }`}
                      >
                        {t('challenges.card.getStarted')}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Comparison Table */}
        {!isLoading && displayChallenges.length > 0 && (
          <Card className="bg-slate-900 border-slate-800 overflow-hidden mb-12 md:mb-16">
            <div className="p-4 md:p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                {t('challenges.compareTableTitle')}
              </h3>
            </div>
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="text-left p-4 text-slate-400 font-medium">{t('challenges.comparison.accountSize')}</th>
                    <th className="text-center p-4 text-slate-400 font-medium">{t('challenges.comparison.price')}</th>
                    <th className="text-center p-4 text-slate-400 font-medium">{t('challenges.comparison.phase1')}</th>
                    <th className="text-center p-4 text-slate-400 font-medium">{t('challenges.comparison.phase2')}</th>
                    <th className="text-center p-4 text-slate-400 font-medium">{t('challenges.comparison.dailyDD')}</th>
                    <th className="text-center p-4 text-slate-400 font-medium">{t('challenges.comparison.maxDD')}</th>
                    <th className="text-center p-4 text-slate-400 font-medium">{t('challenges.comparison.profitSplit')}</th>
                    <th className="text-center p-4 text-slate-400 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayChallenges.map((challenge, i) => (
                    <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-emerald-400" />
                          </div>
                          <span className="text-white font-semibold">${challenge.account_size?.toLocaleString()}</span>
                          {challenge.popular && <Star className="w-4 h-4 text-amber-400" />}
                        </div>
                      </td>
                      <td className="text-center p-4 text-white font-medium">${challenge.price}</td>
                      <td className="text-center p-4 text-emerald-400">{challenge.phase1_profit_target}%</td>
                      <td className="text-center p-4 text-cyan-400">{challenge.phase2_profit_target}%</td>
                      <td className="text-center p-4 text-amber-400">{challenge.max_daily_drawdown}%</td>
                      <td className="text-center p-4 text-red-400">{challenge.max_overall_drawdown}%</td>
                      <td className="text-center p-4">
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-semibold">
                          {challenge.profit_split ?? 'N/A'}%
                        </span>
                      </td>
                      <td className="p-4">
                        <Link to={createPageUrl('BuyChallenge') + `?challengeId=${challenge.id}&size=${challenge.account_size}`}>
                          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                            {t('challenges.comparison.select')}
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
          <Card className="bg-slate-900 border-slate-800 p-4 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{t('challenges.allChallengesInclude.title')}</h3>
                <p className="text-slate-400">{t('challenges.allChallengesInclude.subtitle')}</p>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                t('challenges.allChallengesInclude.features.unlimitedTrading'),
                t('challenges.allChallengesInclude.features.allMajorPairs'),
                t('challenges.allChallengesInclude.features.weekendHolding'),
                t('challenges.allChallengesInclude.features.newsTrading'),
                t('challenges.allChallengesInclude.features.expertAdvisors'),
                t('challenges.allChallengesInclude.features.biWeeklyPayouts'),
                t('challenges.allChallengesInclude.features.support24'),
                t('challenges.allChallengesInclude.features.analyticsDashboard')
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-300">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-800 p-4 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{t('challenges.whyChoose.title')}</h3>
                <p className="text-slate-400">{t('challenges.whyChoose.subtitle')}</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { title: t('challenges.whyChoose.transparentRules.title'), desc: t('challenges.whyChoose.transparentRules.desc') },
                { title: t('challenges.whyChoose.fastPayouts.title'), desc: t('challenges.whyChoose.fastPayouts.desc') },
                { title: t('challenges.whyChoose.scaleTo2M.title'), desc: t('challenges.whyChoose.scaleTo2M.desc') },
                { title: t('challenges.whyChoose.bestSupport.title'), desc: t('challenges.whyChoose.bestSupport.desc') }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="bg-slate-900 border-slate-800 p-4 md:p-8">
          <h3 className="text-xl font-bold text-white mb-6 text-center">{t('challenges.faq.title')}</h3>
          <Accordion type="single" collapsible className="space-y-2">
            {[
              { q: t('challenges.faq.timeLimit.q'), a: t('challenges.faq.timeLimit.a') },
              { q: t('challenges.faq.newsTrading.q'), a: t('challenges.faq.newsTrading.a') },
              { q: t('challenges.faq.ifFail.q'), a: t('challenges.faq.ifFail.a') },
              { q: t('challenges.faq.payoutSpeed.q'), a: t('challenges.faq.payoutSpeed.a') }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-slate-800 bg-slate-800/30 rounded-lg px-4">
                <AccordionTrigger className="text-white hover:text-emerald-400">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-slate-400">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </div>
  );
}