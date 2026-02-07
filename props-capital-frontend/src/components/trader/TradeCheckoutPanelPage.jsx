import React, { useState } from 'react';
import {
  ShoppingCart,
  Check,
  CreditCard,
  ChevronRight,
  Zap,
  Shield,
  Star,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';

const accountSizes = [
  { label: '$5K', key: '5K', value: 5000 },
  { label: '$10K', key: '10K', value: 10000 },
  { label: '$25K', key: '25K', value: 25000 },
  { label: '$50K', key: '50K', value: 50000 },
  { label: '$100K', key: '100K', value: 100000 },
  { label: '$200K', key: '200K', value: 200000 }
];

const challengeTypes = [
  {
    id: '1-step',
    name: '1-Step Challenge',
    badge: 'Most Popular',
    description: 'Quick evaluation with achievable targets',
    phases: 1,
    profitTarget: '10%',
    dailyDrawdown: '4%',
    maxDrawdown: '8%',
    profitSplit: '85%',
    leverage: '1:30',
    minDays: 'None',
    popular: true,
    prices: { '5K': 55, '10K': 99, '25K': 189, '50K': 299, '100K': 499, '200K': 949 }
  },
  {
    id: '2-step',
    name: '2-Step Challenge',
    badge: 'Best Split',
    description: 'Traditional evaluation with highest profit split',
    phases: 2,
    profitTarget: '8% / 5%',
    dailyDrawdown: '5%',
    maxDrawdown: '10%',
    profitSplit: '90%',
    leverage: '1:50',
    minDays: 'None',
    popular: false,
    prices: { '5K': 45, '10K': 79, '25K': 159, '50K': 249, '100K': 449, '200K': 849 }
  }
];

const platforms = [
  { id: 'mt5', name: 'MetaTrader 5', desc: 'Most popular platform' },
  { id: 'tradelocker', name: 'TradeLocker', desc: 'Modern web-based' },
  { id: 'bybit', name: 'Bybit', desc: 'Crypto trading' },
  { id: 'pt5', name: 'PT5', desc: 'Advanced trading' },
];

const TradeCheckoutPanelPage = () => {
  const { isDark } = useTraderTheme();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('1-step');
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(3); // $50K default
  const [selectedPlatform, setSelectedPlatform] = useState('mt5');
  const [selectedPayment, setSelectedPayment] = useState('card');

  const selectedChallenge = challengeTypes.find(c => c.id === selectedType);
  const selectedSizeKey = accountSizes[selectedSizeIndex].key;
  const finalPrice = selectedChallenge?.prices[selectedSizeKey] || 299;

  const handlePurchase = () => setStep(3);

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="space-y-6" data-testid="checkout-panel-page">
      {/* Header */}
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="w-6 h-6 text-amber-500" />
          <h1 className={`text-2xl font-bold ${textClass}`}>Buy New Challenge</h1>
        </div>
        <p className={mutedClass}>Choose your challenge package and start your trading journey.</p>

        {/* Progress Steps */}
        <div className="flex items-center gap-4 mt-6">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-amber-500 text-black' : isDark ? 'bg-white/10 text-gray-500' : 'bg-slate-100 text-slate-400'
                }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className={`text-sm hidden sm:inline ${step >= s ? textClass : mutedClass}`}>
                {s === 1 ? 'Select Package' : 'Payment'}
              </span>
              {s < 2 && <div className={`w-16 h-0.5 ${step > s ? 'bg-amber-500' : isDark ? 'bg-white/10' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Select Challenge Package */}
      {step === 1 && (
        <>
          {/* Account Size Selector */}
          <div className="flex justify-center overflow-x-auto pb-2">
            <div className={`rounded-full p-1 sm:p-1.5 inline-flex gap-1 border ${isDark ? 'bg-[#0a0d12] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              {accountSizes.map((size, index) => (
                <button
                  key={size.value}
                  onClick={() => setSelectedSizeIndex(index)}
                  className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${selectedSizeIndex === index
                    ? 'bg-amber-500 text-black'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Challenge Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {challengeTypes.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => setSelectedType(challenge.id)}
                className={`relative text-left rounded-2xl p-6 border-2 transition-all ${selectedType === challenge.id
                  ? 'border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.15)]'
                  : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
                  } ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}
              >
                {/* Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${challenge.popular
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black'
                    : isDark ? 'bg-white/10 text-gray-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {challenge.popular && <Star className="w-3 h-3 fill-current" />}
                    {challenge.badge}
                  </div>
                </div>

                {/* Selection indicator */}
                <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedType === challenge.id
                  ? 'border-amber-500 bg-amber-500'
                  : isDark ? 'border-white/20' : 'border-slate-300'
                  }`}>
                  {selectedType === challenge.id && <Check className="w-4 h-4 text-black" />}
                </div>

                {/* Header */}
                <div className="text-center mb-4 pt-4">
                  <h3 className={`text-xl font-bold mb-1 ${textClass}`}>{challenge.name}</h3>
                  <p className={`text-sm ${mutedClass}`}>{challenge.description}</p>
                </div>

                {/* Price */}
                <div className={`text-center mb-4 py-4 rounded-xl ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
                  <div className={`text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    ${(challenge.prices[selectedSizeKey] * 3).toFixed(0)}
                  </div>
                  <div className="text-amber-500 text-3xl font-black">
                    ${challenge.prices[selectedSizeKey]}
                  </div>
                  <div className="text-emerald-500 text-xs font-semibold mt-1">70% OFF</div>
                </div>

                {/* Stats Grid */}
                <div className="space-y-2 mb-4">
                  {[
                    { label: 'Phases', value: `${challenge.phases} Phase${challenge.phases > 1 ? 's' : ''}` },
                    { label: 'Profit Target', value: challenge.profitTarget },
                    { label: 'Daily Drawdown', value: challenge.dailyDrawdown },
                    { label: 'Max Drawdown', value: challenge.maxDrawdown },
                    { label: 'Leverage', value: challenge.leverage },
                    { label: 'Min Trading Days', value: challenge.minDays, highlight: true },
                  ].map((item, index) => (
                    <div key={index} className={`flex items-center justify-between py-1.5 text-sm ${index < 5 ? isDark ? 'border-b border-white/5' : 'border-b border-slate-100' : ''
                      }`}>
                      <span className={mutedClass}>{item.label}</span>
                      <span className={`font-semibold ${item.highlight ? 'text-emerald-500' : textClass}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2">
                    <span className={mutedClass}>Profit Split</span>
                    <span className="text-amber-500 text-xl font-bold">{challenge.profitSplit}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-2 gap-2">
                  {['No time limit', 'All strategies', '100% fee refund', 'Free course'].map((feature, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      <span className={`text-xs ${mutedClass}`}>{feature}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Platform Selection */}
          <div className={`${cardClass} p-6`}>
            <h3 className={`font-bold mb-4 ${textClass}`}>Select Trading Platform</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${selectedPlatform === platform.id
                    ? 'border-amber-500 bg-amber-500/10'
                    : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                >
                  <Zap className={`w-6 h-6 ${selectedPlatform === platform.id ? 'text-amber-500' : mutedClass}`} />
                  <span className={`font-semibold text-sm ${textClass}`}>{platform.name}</span>
                  <span className={`text-xs ${mutedClass}`}>{platform.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className={`lg:col-span-2 ${cardClass} p-6`}>
            <h3 className={`font-bold text-lg mb-6 ${textClass}`}>Order Summary</h3>

            <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className={`font-bold ${textClass}`}>{selectedChallenge?.name}</p>
                    <p className={`text-sm ${mutedClass}`}>${accountSizes[selectedSizeIndex].value.toLocaleString()} Account</p>
                  </div>
                </div>
                <p className={`text-2xl font-bold ${textClass}`}>${finalPrice}</p>
              </div>
              <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className={mutedClass}>Profit Target</p>
                    <p className={`font-semibold ${textClass}`}>{selectedChallenge?.profitTarget}</p>
                  </div>
                  <div>
                    <p className={mutedClass}>Profit Split</p>
                    <p className="font-semibold text-amber-500">{selectedChallenge?.profitSplit}</p>
                  </div>
                  <div>
                    <p className={mutedClass}>Platform</p>
                    <p className={`font-semibold ${textClass}`}>{platforms.find(p => p.id === selectedPlatform)?.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">100% fee refund on first payout</span>
              </div>
            </div>

            <div className={`mt-6 pt-6 border-t flex justify-between items-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <p className={`text-lg font-bold ${textClass}`}>Total</p>
              <p className="text-3xl font-bold text-amber-500">${finalPrice}</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className={`${cardClass} p-4 sm:p-6`}>
            <h3 className={`font-bold mb-4 ${textClass}`}>Payment Method</h3>

            <div className="space-y-3">
              <button
                onClick={() => setSelectedPayment('card')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selectedPayment === 'card'
                  ? 'border-amber-500 bg-amber-500/10'
                  : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <CreditCard className={`w-5 h-5 ${selectedPayment === 'card' ? 'text-amber-500' : mutedClass}`} />
                <span className={`font-medium ${textClass}`}>Credit Card</span>
                {selectedPayment === 'card' && <Check className="w-4 h-4 text-amber-500 ml-auto" />}
              </button>

              <button
                onClick={() => setSelectedPayment('crypto')}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selectedPayment === 'crypto'
                  ? 'border-amber-500 bg-amber-500/10'
                  : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
                  }`}
              >
                <span className="text-xl">₿</span>
                <span className={`font-medium ${textClass}`}>Crypto</span>
                {selectedPayment === 'crypto' && <Check className="w-4 h-4 text-amber-500 ml-auto" />}
              </button>
            </div>

            <button
              onClick={handlePurchase}
              className="w-full mt-6 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              Complete Purchase
            </button>

            <p className={`text-xs text-center mt-4 ${mutedClass}`}>
              Secure payment powered by Stripe
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <div className={`${cardClass} p-12 text-center`}>
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>Purchase Successful!</h2>
          <p className={`mb-6 ${mutedClass}`}>Your {selectedChallenge?.name} has been created. Check your email for credentials.</p>

          <div className={`inline-flex items-center gap-6 p-4 rounded-xl mb-6 ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
            <div className="text-left">
              <p className={`text-sm ${mutedClass}`}>Challenge</p>
              <p className={`font-bold ${textClass}`}>{selectedChallenge?.name}</p>
            </div>
            <div className={`w-px h-10 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            <div className="text-left">
              <p className={`text-sm ${mutedClass}`}>Account Size</p>
              <p className={`font-bold ${textClass}`}>${accountSizes[selectedSizeIndex].value.toLocaleString()}</p>
            </div>
            <div className={`w-px h-10 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            <div className="text-left">
              <p className={`text-sm ${mutedClass}`}>Platform</p>
              <p className={`font-bold ${textClass}`}>{platforms.find(p => p.id === selectedPlatform)?.name}</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <a href="/traderdashboard" className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl">
              Go to Dashboard
            </a>
            <a href="/traderdashboard/trading" className={`px-6 py-3 rounded-xl font-medium ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}>
              Start Trading
            </a>
          </div>
        </div>
      )}

      {/* Navigation */}
      {step < 3 && (
        <div className="flex justify-between">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className={`px-6 py-3 rounded-xl font-medium ${step === 1 ? 'opacity-50 cursor-not-allowed' : ''
              } ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}
          >
            Back
          </button>
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl"
          >
            {step === 1 ? 'Continue to Payment' : 'Complete Purchase'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TradeCheckoutPanelPage;
