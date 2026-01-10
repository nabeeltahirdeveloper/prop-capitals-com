import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Search,
  BookOpen,
  Target,
  Shield,
  Wallet,
  TrendingUp,
  MessageCircle,
  ArrowRight,
  Zap,
  Users,
  Clock,
  Settings
} from 'lucide-react';

export default function FAQ() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'getting-started',
      title: t('faq.categories.gettingStarted.title'),
      icon: Zap,
      color: 'emerald',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
      faqs: [
        {
          q: t('faq.categories.gettingStarted.faqs.whatIsPropCapitals.q'),
          a: t('faq.categories.gettingStarted.faqs.whatIsPropCapitals.a')
        },
        {
          q: t('faq.categories.gettingStarted.faqs.howToStartChallenge.q'),
          a: t('faq.categories.gettingStarted.faqs.howToStartChallenge.a')
        },
        {
          q: t('faq.categories.gettingStarted.faqs.tradingPlatforms.q'),
          a: t('faq.categories.gettingStarted.faqs.tradingPlatforms.a')
        },
        {
          q: t('faq.categories.gettingStarted.faqs.credentialsTiming.q'),
          a: t('faq.categories.gettingStarted.faqs.credentialsTiming.a')
        }
      ]
    },
    {
      id: 'trading-rules',
      title: t('faq.categories.tradingRules.title'),
      icon: Target,
      color: 'cyan',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
      faqs: [
        {
          q: t('faq.categories.tradingRules.faqs.profitTarget.q'),
          a: t('faq.categories.tradingRules.faqs.profitTarget.a')
        },
        {
          q: t('faq.categories.tradingRules.faqs.drawdownRules.q'),
          a: t('faq.categories.tradingRules.faqs.drawdownRules.a')
        },
        {
          q: t('faq.categories.tradingRules.faqs.timeLimit.q'),
          a: t('faq.categories.tradingRules.faqs.timeLimit.a')
        },
        {
          q: t('faq.categories.tradingRules.faqs.newsTrading.q'),
          a: t('faq.categories.tradingRules.faqs.newsTrading.a')
        },
        {
          q: t('faq.categories.tradingRules.faqs.weekendHolding.q'),
          a: t('faq.categories.tradingRules.faqs.weekendHolding.a')
        },
        {
          q: t('faq.categories.tradingRules.faqs.expertAdvisors.q'),
          a: t('faq.categories.tradingRules.faqs.expertAdvisors.a')
        }
      ]
    },
    {
      id: 'violations',
      title: t('faq.categories.violations.title'),
      icon: Shield,
      color: 'amber',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      faqs: [
        {
          q: t('faq.categories.violations.faqs.whatHappensIfViolate.q'),
          a: t('faq.categories.violations.faqs.whatHappensIfViolate.a')
        },
        {
          q: t('faq.categories.violations.faqs.freeRetry.q'),
          a: t('faq.categories.violations.faqs.freeRetry.a')
        },
        {
          q: t('faq.categories.violations.faqs.resetAccount.q'),
          a: t('faq.categories.violations.faqs.resetAccount.a')
        },
        {
          q: t('faq.categories.violations.faqs.tradingDay.q'),
          a: t('faq.categories.violations.faqs.tradingDay.a')
        }
      ]
    },
    {
      id: 'payouts',
      title: t('faq.categories.payouts.title'),
      icon: Wallet,
      color: 'purple',
      image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop',
      faqs: [
        {
          q: t('faq.categories.payouts.faqs.profitSplit.q'),
          a: t('faq.categories.payouts.faqs.profitSplit.a')
        },
        {
          q: t('faq.categories.payouts.faqs.payoutFrequency.q'),
          a: t('faq.categories.payouts.faqs.payoutFrequency.a')
        },
        {
          q: t('faq.categories.payouts.faqs.paymentMethods.q'),
          a: t('faq.categories.payouts.faqs.paymentMethods.a')
        },
        {
          q: t('faq.categories.payouts.faqs.minimumPayout.q'),
          a: t('faq.categories.payouts.faqs.minimumPayout.a')
        },
        {
          q: t('faq.categories.payouts.faqs.payoutProcessing.q'),
          a: t('faq.categories.payouts.faqs.payoutProcessing.a')
        }
      ]
    },
    {
      id: 'scaling',
      title: t('faq.categories.scaling.title'),
      icon: TrendingUp,
      color: 'pink',
      image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop',
      faqs: [
        {
          q: t('faq.categories.scaling.faqs.howScalingWorks.q'),
          a: t('faq.categories.scaling.faqs.howScalingWorks.a')
        },
        {
          q: t('faq.categories.scaling.faqs.profitSplitScaling.q'),
          a: t('faq.categories.scaling.faqs.profitSplitScaling.a')
        },
        {
          q: t('faq.categories.scaling.faqs.scalingConditions.q'),
          a: t('faq.categories.scaling.faqs.scalingConditions.a')
        }
      ]
    },
    {
      id: 'account',
      title: t('faq.categories.account.title'),
      icon: Settings,
      color: 'slate',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
      faqs: [
        {
          q: t('faq.categories.account.faqs.refund.q'),
          a: t('faq.categories.account.faqs.refund.a')
        },
        {
          q: t('faq.categories.account.faqs.multipleAccounts.q'),
          a: t('faq.categories.account.faqs.multipleAccounts.a')
        },
        {
          q: t('faq.categories.account.faqs.weekendAccount.q'),
          a: t('faq.categories.account.faqs.weekendAccount.a')
        },
        {
          q: t('faq.categories.account.faqs.contactSupport.q'),
          a: t('faq.categories.account.faqs.contactSupport.a')
        }
      ]
    }
  ];

  const filteredCategories = categories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-slate-950 pt-16 sm:pt-20 md:pt-24 pb-12 md:pb-16 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1920&h=600&fit=crop"
            alt="FAQ"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">{t('faq.helpCenter')}</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6"
            >
              {t('faq.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 max-w-2xl mx-auto mb-8"
            >
              {t('faq.subtitle')}
            </motion.p>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative max-w-xl mx-auto"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder={t('faq.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-slate-900 border-slate-800 text-white text-lg rounded-xl"
              />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Category Cards */}
        {!searchQuery && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-12">
            {categories.slice(0, 6).map((category, i) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="bg-slate-900 border-slate-800 p-3 sm:p-4 cursor-pointer hover:border-emerald-500/50 transition-all group"
                  onClick={() => {
                    document.getElementById(category.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${category.color}-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <category.icon className={`w-5 h-5 text-${category.color}-400`} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{category.title}</p>
                      <p className="text-xs text-slate-400">{category.faqs.length} {t('faq.questions')}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* FAQ Categories */}
        <div className="space-y-8">
          {(searchQuery ? filteredCategories : categories).map((category, i) => (
            <motion.div
              key={category.id}
              id={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
                  <div className="absolute inset-0 flex items-center p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 bg-${category.color}-500/20 backdrop-blur rounded-xl flex items-center justify-center`}>
                        <category.icon className={`w-7 h-7 text-${category.color}-400`} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{category.title}</h2>
                        <p className="text-slate-400">{category.faqs.length} {t('faq.questions')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.faqs.map((faq, j) => (
                      <AccordionItem key={j} value={`${i}-${j}`} className="border-slate-800 bg-slate-800/30 rounded-lg px-4">
                        <AccordionTrigger className="text-left text-slate-200 hover:text-emerald-400">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-400 leading-relaxed">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 p-4 md:p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{t('faq.stillHaveQuestions')}</h3>
            <p className="text-slate-400 mb-6">{t('faq.supportDescription')}</p>
            <Link to={createPageUrl('Contact')}>
              <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                {t('faq.contactSupport')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}