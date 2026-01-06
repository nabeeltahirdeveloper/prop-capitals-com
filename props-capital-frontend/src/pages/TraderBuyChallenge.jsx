import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import { getChallenges } from '@/api/challenges';
import { purchaseChallenge } from '@/api/payments';
import { useTranslation } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Shield,
  CreditCard,
  Bitcoin,
  Wallet,
  CheckCircle,
  Award,
  Star,
  Lock,
  TrendingUp
} from 'lucide-react';

export default function TraderBuyChallenge() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [orderComplete, setOrderComplete] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Get challenges from backend
  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: getChallenges,
  });

  // Map backend challenges to frontend format
  const mappedChallenges = challenges.map((challenge) => ({
    id: challenge.id,
    name: challenge.name || `$${challenge.accountSize?.toLocaleString()} Standard`,
    account_size: challenge.accountSize,
    price: challenge.price,
    phase1_profit_target: challenge.phase1TargetPercent,
    phase2_profit_target: challenge.phase2TargetPercent,
    max_daily_drawdown: challenge.dailyDrawdownPercent,
    max_overall_drawdown: challenge.overallDrawdownPercent,
    profit_split: 80, // Default profit split
  }));

  // Only use real challenges from backend, no mock data fallback
  const displayChallenges = mappedChallenges;

  const platforms = [
    { id: 'MT5', name: t('buyChallenge.platforms.MT5.name'), desc: t('buyChallenge.platforms.MT5.desc'), image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=200&h=150&fit=crop' },
    { id: 'MT4', name: t('buyChallenge.platforms.MT4.name'), desc: t('buyChallenge.platforms.MT4.desc'), image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=200&h=150&fit=crop' },
    { id: 'cTrader', name: t('buyChallenge.platforms.cTrader.name'), desc: t('buyChallenge.platforms.cTrader.desc'), image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=200&h=150&fit=crop' },
    { id: 'DXTrade', name: t('buyChallenge.platforms.DXTrade.name'), desc: t('buyChallenge.platforms.DXTrade.desc'), image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=200&h=150&fit=crop' },
  ];

  const paymentMethods = [
    { id: 'card', name: t('buyChallenge.paymentMethods.card.name'), icon: CreditCard, desc: t('buyChallenge.paymentMethods.card.desc') },
    { id: 'crypto', name: t('buyChallenge.paymentMethods.crypto.name'), icon: Bitcoin, desc: t('buyChallenge.paymentMethods.crypto.desc') },
    { id: 'paypal', name: t('buyChallenge.paymentMethods.paypal.name'), icon: Wallet, desc: t('buyChallenge.paymentMethods.paypal.desc') },
  ];

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'WELCOME20') {
      setCouponApplied({ code: 'WELCOME20', discount: 20, type: 'percentage' });
    } else if (couponCode.toUpperCase() === 'TRADER10') {
      setCouponApplied({ code: 'TRADER10', discount: 10, type: 'percentage' });
    } else {
      setCouponApplied(null);
    }
  };

  const calculateTotal = () => {
    if (!selectedChallenge) return 0;
    let total = selectedChallenge.price;
    if (couponApplied) {
      if (couponApplied.type === 'percentage') {
        total = total * (1 - couponApplied.discount / 100);
      } else {
        total = total - couponApplied.discount;
      }
    }
    return Math.max(total, 0).toFixed(2);
  };

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (purchaseData) => {
      return purchaseChallenge({
        userId: purchaseData.userId,
        challengeId: purchaseData.challengeId,
        platform: purchaseData.platform,
        tradingPlatform: purchaseData.tradingPlatform,
        trading_platform: purchaseData.trading_platform,
        brokerPlatform: purchaseData.brokerPlatform,
      });
    },
    onSuccess: (data) => {
      setOrderComplete(true);
      // Invalidate accounts query so dashboard refetches
      if (user?.userId) {
        queryClient.invalidateQueries({ queryKey: ['trader-accounts', user.userId] });
        queryClient.invalidateQueries({ queryKey: ['accounts'] });
      }
    },
    onError: (error) => {
      console.error('Purchase failed:', error);
      // Error handling can be added here
    },
  });

  const handlePurchase = async () => {
    console.log('🛒 Purchase initiated', {
      user: user?.userId,
      challenge: selectedChallenge?.id,
      platform: selectedPlatform,
      paymentMethod: paymentMethod
    });

    // Check if user is logged in
    if (!user || !user.userId) {
      console.error('❌ User not logged in');
      navigate(createPageUrl('SignIn'));
      return;
    }

    if (!selectedChallenge) {
      console.error('❌ No challenge selected');
      return;
    }

    console.log('✅ Calling purchase mutation...');
    purchaseMutation.mutate({
      userId: user.userId,
      challengeId: selectedChallenge.id,
      platform: selectedPlatform,
      tradingPlatform: selectedPlatform,
      trading_platform: selectedPlatform,
      brokerPlatform: selectedPlatform,
    });
  };

  if (orderComplete) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">{t('buyChallenge.purchaseSuccessful')}</h1>
          <p className="text-slate-400 mb-8">
            {t('buyChallenge.purchaseSuccessfulDesc')}
          </p>
          <Card className="bg-slate-900 border-slate-800 p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-white mb-4">{t('buyChallenge.orderSummary')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">{t('buyChallenge.challenge')}</span>
                <span className="text-white">{selectedChallenge?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('buyChallenge.platform')}</span>
                <span className="text-white">{selectedPlatform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('buyChallenge.amountPaid')}</span>
                <span className="text-emerald-400 font-bold">${calculateTotal()}</span>
              </div>
            </div>
          </Card>
          <Link to={createPageUrl('TraderDashboard')}>
            <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 w-full">
              {t('buyChallenge.goToDashboard')}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('buyChallenge.title')}</h1>
        <p className="text-slate-400">{t('buyChallenge.subtitle')}</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[
          { num: 1, label: t('buyChallenge.chooseChallenge') },
          { num: 2, label: t('buyChallenge.selectPlatform') },
          { num: 3, label: t('buyChallenge.payment') }
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s.num
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                : 'bg-slate-800 text-slate-400'
                }`}>
                {step > s.num ? <Check className="w-5 h-5" /> : s.num}
              </div>
              <span className={`hidden md:inline ${step >= s.num ? 'text-white' : 'text-slate-400'}`}>
                {s.label}
              </span>
            </div>
            {i < 2 && (
              <div className={`w-12 h-0.5 ${step > s.num ? 'bg-emerald-500' : 'bg-slate-800'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Choose Challenge */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <>
            {challengesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Card key={i} className="bg-slate-900 border-slate-800 p-6">
                    <Skeleton className="h-8 w-24 mx-auto mb-4" />
                    <Skeleton className="h-4 w-32 mx-auto mb-4" />
                    <div className="space-y-2 mb-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="pt-4 border-t border-slate-800">
                      <Skeleton className="h-8 w-20 mx-auto" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : displayChallenges.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">{t('buyChallenge.noChallenges')}</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayChallenges.map((challenge) => (
                  <Card
                    key={challenge.id}
                    className={`bg-slate-900 border-slate-800 p-6 cursor-pointer transition-all hover:border-emerald-500/50 ${selectedChallenge?.id === challenge.id ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
                      } ${challenge.popular ? 'relative' : ''}`}
                    onClick={() => setSelectedChallenge(challenge)}
                  >
                    {challenge.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" /> {t('buyChallenge.popular')}
                        </span>
                      </div>
                    )}
                    <div className="text-center mb-4">
                      <p className="text-2xl font-bold text-white">${challenge.account_size?.toLocaleString()}</p>
                      <p className="text-slate-400 text-sm">{t('buyChallenge.accountSize')}</p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t('buyChallenge.profitTarget')}</span>
                        <span className="text-white">{challenge.phase1_profit_target}% / {challenge.phase2_profit_target}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t('buyChallenge.drawdown')}</span>
                        <span className="text-white">{challenge.max_daily_drawdown}% / {challenge.max_overall_drawdown}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">{t('buyChallenge.profitSplit')}</span>
                        <span className="text-emerald-400 font-bold">{challenge.profit_split}%</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                      <p className="text-2xl font-bold text-white">${challenge.price}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {!challengesLoading && displayChallenges.length > 0 && (
              <div className="flex justify-end mt-8">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!selectedChallenge}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500"
                >
                  {t('buyChallenge.continue')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        </motion.div>
      )}

      {/* Step 2: Select Platform */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="grid md:grid-cols-2 gap-4">
            {platforms.map((platform) => (
              <Card
                key={platform.id}
                className={`bg-slate-900 border-slate-800 overflow-hidden cursor-pointer transition-all hover:border-emerald-500/50 ${selectedPlatform === platform.id ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
                  }`}
                onClick={() => setSelectedPlatform(platform.id)}
              >
                <div className="h-32 overflow-hidden">
                  <img
                    src={platform.image}
                    alt={platform.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlatform === platform.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                      }`}>
                      {selectedPlatform === platform.id && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{platform.name}</p>
                      <p className="text-sm text-slate-400">{platform.desc}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setStep(1)} className="border-slate-700 text-slate-300 hover:text-white">
              <ArrowLeft className="mr-2 w-4 h-4" />
              {t('buyChallenge.back')}
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!selectedPlatform}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500"
            >
              {t('buyChallenge.continue')}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Payment */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Payment Methods */}
            <div className="space-y-6">
              <Card className="bg-slate-900 border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t('buyChallenge.paymentMethod')}</h3>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === method.id
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                        }`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                          }`}>
                          {paymentMethod === method.id && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <method.icon className="w-6 h-6 text-slate-400" />
                        <div>
                          <p className="text-white font-medium">{method.name}</p>
                          <p className="text-sm text-slate-400">{method.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-slate-900 border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t('buyChallenge.couponCode')}</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('buyChallenge.enterCode')}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Button variant="outline" onClick={applyCoupon} className="border-slate-700 text-slate-300 hover:text-white">
                    {t('buyChallenge.apply')}
                  </Button>
                </div>
                {couponApplied && (
                  <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 text-sm">
                      {t('buyChallenge.couponApplied', { code: couponApplied.code, discount: couponApplied.discount })}
                    </span>
                  </div>
                )}
              </Card>
            </div>

            {/* Order Summary */}
            <div>
              <Card className="bg-slate-900 border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">{t('buyChallenge.orderSummary')}</h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('buyChallenge.challenge')}</span>
                    <span className="text-white font-medium">{selectedChallenge?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('buyChallenge.platform')}</span>
                    <span className="text-white">{selectedPlatform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('buyChallenge.accountSize')}</span>
                    <span className="text-white">${selectedChallenge?.account_size?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">{t('buyChallenge.profitSplit')}</span>
                    <span className="text-emerald-400">{selectedChallenge?.profit_split}%</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-400">{t('buyChallenge.subtotal')}</span>
                    <span className="text-white">${selectedChallenge?.price}</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between mb-2">
                      <span className="text-emerald-400">{t('buyChallenge.discount')} ({couponApplied.discount}%)</span>
                      <span className="text-emerald-400">-${(selectedChallenge?.price * couponApplied.discount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">{t('buyChallenge.total')}</span>
                    <span className="text-emerald-400">${calculateTotal()}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 h-14 text-lg"
                  onClick={handlePurchase}
                  disabled={!paymentMethod || purchaseMutation.isPending}
                >
                  {purchaseMutation.isPending ? (
                    t('buyChallenge.processing')
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      {t('buyChallenge.payAmount', { amount: calculateTotal() })}
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-500">
                  <Shield className="w-4 h-4" />
                  {t('buyChallenge.secureEncryption')}
                </div>
              </Card>
            </div>
          </div>

          <div className="flex justify-start mt-8">
            <Button variant="outline" onClick={() => setStep(2)} className="border-slate-700 text-slate-300 hover:text-white">
              <ArrowLeft className="mr-2 w-4 h-4" />
              {t('buyChallenge.back')}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}