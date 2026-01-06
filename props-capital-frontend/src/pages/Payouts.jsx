import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Wallet,
  Clock,
  DollarSign,
  ArrowRight,
  Check,
  CreditCard,
  Bitcoin,
  Banknote,
  Shield,
  Zap,
  Calendar,
  TrendingUp,
  Star,
  Users,
  Globe
} from 'lucide-react';

export default function Payouts() {
  const { t } = useTranslation();

  const payoutMethods = [
    {
      icon: Banknote,
      name: t('payoutsPage.withdrawalOptions.methods.bankWire'),
      time: t('payoutsPage.withdrawalOptions.methods.time.businessDays'),
      fee: '$0',
      min: '$50',
      image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=400&h=300&fit=crop'
    },
    {
      icon: Bitcoin,
      name: t('payoutsPage.withdrawalOptions.methods.cryptocurrency'),
      time: t('payoutsPage.withdrawalOptions.methods.time.hours24'),
      fee: '$0',
      min: '$50',
      types: ['BTC', 'ETH', 'USDT'],
      image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=300&fit=crop'
    },
    {
      icon: CreditCard,
      name: t('payoutsPage.withdrawalOptions.methods.paypal'),
      time: t('payoutsPage.withdrawalOptions.methods.time.hours24'),
      fee: '$0',
      min: '$50',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop'
    },
    {
      icon: Banknote,
      name: t('payoutsPage.withdrawalOptions.methods.wiseTransfer'),
      time: t('payoutsPage.withdrawalOptions.methods.time.businessDays12'),
      fee: '$0',
      min: '$50',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop'
    }
  ];

  const recentPayouts = [
    { trader: 'Michael R.', amount: 12450, country: '🇺🇸', date: '2 hours ago', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face' },
    { trader: 'Sarah C.', amount: 8320, country: '🇬🇧', date: '5 hours ago', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face' },
    { trader: 'Ahmed H.', amount: 15680, country: '🇦🇪', date: '8 hours ago', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face' },
    { trader: 'Sophie M.', amount: 6240, country: '🇩🇪', date: '12 hours ago', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face' },
    { trader: 'Kenji T.', amount: 21500, country: '🇯🇵', date: '1 day ago', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face' },
    { trader: 'Rosa L.', amount: 9870, country: '🇪🇸', date: '1 day ago', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face' },
  ];

  const stats = [
    { value: '$8M+', label: t('payoutsPage.stats.totalPaidOut'), icon: DollarSign },
    { value: '15,000+', label: t('payoutsPage.stats.payoutsProcessed'), icon: Users },
    { value: '24h', label: t('payoutsPage.stats.avgProcessing'), icon: Clock },
    { value: '0%', label: t('payoutsPage.stats.payoutFees'), icon: Zap },
  ];

  const profitSplitTiers = [
    { size: t('payoutsPage.profitSharing.tiers.tier1'), split: '80%' },
    { size: t('payoutsPage.profitSharing.tiers.tier2'), split: '85%' },
    { size: t('payoutsPage.profitSharing.tiers.tier3'), split: '85-90%' },
    { size: t('payoutsPage.profitSharing.tiers.tier4'), split: t('howItWorks.rules.profitSplit.funded') }
  ];

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-16 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1920&h=800&fit=crop"
            alt="Payouts"
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
              <Wallet className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">{t('payoutsPage.badge')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6"
            >
              {t('payoutsPage.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              {t('payoutsPage.subtitle')}
            </motion.p>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
          >
            {stats.map((stat, i) => (
              <Card key={i} className="bg-slate-900/80 backdrop-blur border-slate-800 p-4 md:p-6 text-center group hover:border-emerald-500/50 transition-all">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-slate-400 mt-2">{stat.label}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profit Split Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">{t('payoutsPage.profitSharing.badge')}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-4 mb-4">
              {t('payoutsPage.profitSharing.title')}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {t('payoutsPage.profitSharing.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {profitSplitTiers.map((tier, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`bg-slate-900 border-slate-800 p-4 md:p-6 text-center hover:border-emerald-500/50 transition-all ${i === 3 ? 'ring-2 ring-emerald-500' : ''}`}>
                  {i === 3 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> {t('payoutsPage.profitSharing.best')}
                      </span>
                    </div>
                  )}
                  <p className="text-slate-400 mb-2">{t('payoutsPage.profitSharing.accountSize')}</p>
                  <p className="text-xl font-bold text-white mb-4">{tier.size}</p>
                  <p className="text-4xl font-bold text-emerald-400">{tier.split}</p>
                  <p className="text-sm text-slate-500 mt-2">{t('payoutsPage.profitSharing.profitSplit')}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Payout Methods */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">{t('payoutsPage.withdrawalOptions.badge')}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-4 mb-4">
              {t('payoutsPage.withdrawalOptions.title')}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {t('payoutsPage.withdrawalOptions.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {payoutMethods.map((method, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-900 border-slate-800 overflow-hidden h-full group hover:border-emerald-500/50 transition-all">
                  <div className="h-40 overflow-hidden">
                    <img
                      src={method.image}
                      alt={method.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 md:p-6">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
                      <method.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-4">{method.name}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{t('payoutsPage.withdrawalOptions.processing')}</span>
                        <span className="text-white">{method.time}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{t('payoutsPage.withdrawalOptions.fee')}</span>
                        <span className="text-emerald-400 font-medium">{method.fee}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">{t('payoutsPage.withdrawalOptions.minimum')}</span>
                        <span className="text-white">{method.min}</span>
                      </div>
                      {method.types && (
                        <div className="pt-2 flex gap-2 flex-wrap">
                          {method.types.map((type, j) => (
                            <span key={j} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                              {type}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How Payouts Work */}
        <Card className="bg-slate-900 border-slate-800 p-4 md:p-8 mb-12 md:mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white">{t('payoutsPage.howItWorks.title')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { step: 1, icon: Calendar, title: t('payoutsPage.howItWorks.requestPayout.title'), desc: t('payoutsPage.howItWorks.requestPayout.desc') },
              { step: 2, icon: Shield, title: t('payoutsPage.howItWorks.verification.title'), desc: t('payoutsPage.howItWorks.verification.desc') },
              { step: 3, icon: Clock, title: t('payoutsPage.howItWorks.processing.title'), desc: t('payoutsPage.howItWorks.processing.desc') },
              { step: 4, icon: Wallet, title: t('payoutsPage.howItWorks.receiveFunds.title'), desc: t('payoutsPage.howItWorks.receiveFunds.desc') },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center relative"
              >
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-transparent" />
                )}
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 relative z-10">
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-900 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm z-20">
                  {item.step}
                </div>
                <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Recent Payouts */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">{t('payoutsPage.recentPayouts.badge')}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-4 mb-4">
              {t('payoutsPage.recentPayouts.title')}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {t('payoutsPage.recentPayouts.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {recentPayouts.map((payout, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-900 border-slate-800 p-4 hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={payout.image}
                        alt={payout.trader}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/50"
                      />
                      <div>
                        <p className="text-white font-medium">{payout.trader}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <span>{payout.country}</span>
                          <span>•</span>
                          <span>{payout.date}</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-emerald-400 font-bold text-lg">
                      ${payout.amount.toLocaleString()}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Payout Terms */}
        <Card className="bg-slate-900/50 border-slate-800 p-4 md:p-8 mb-12 md:mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">{t('payoutsPage.payoutTerms.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {[
              t('payoutsPage.payoutTerms.biWeekly'),
              t('payoutsPage.payoutTerms.minimumAmount'),
              t('payoutsPage.payoutTerms.noMaximum'),
              t('payoutsPage.payoutTerms.noFees'),
              t('payoutsPage.payoutTerms.firstPayout'),
              t('payoutsPage.payoutTerms.kycRequired'),
              t('payoutsPage.payoutTerms.profitSplitRange'),
              t('payoutsPage.payoutTerms.scaleUp')
            ].map((rule, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-300">{rule}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* CTA */}
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
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t('payoutsPage.cta.title')}</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto">
              {t('payoutsPage.cta.subtitle')}
            </p>
            <Link to={createPageUrl('Challenges')}>
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8">
                {t('payoutsPage.cta.getFundedNow')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}