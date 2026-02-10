import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Shield, Clock, Star, CreditCard, User, Mail, Phone, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

// Platform options as separate constant
const PLATFORMS = [
  { id: 'mt5', name: 'MetaTrader 5', description: 'Industry standard platform', icon: '📊' },
  { id: 'tradelocker', name: 'TradeLocker', description: 'Modern web-based platform', icon: '🔐' },
  { id: 'bybit', name: 'Bybit', description: 'Crypto trading platform', icon: '₿' },
  { id: 'pt5', name: 'PT5 WebTrader', description: 'Our newest platform', icon: '🚀', isNew: true }
];

// Challenge data
const CHALLENGE_DATA = {
  'one-step': {
    name: '1-Step Challenge',
    profitTarget: '10%',
    dailyDrawdown: '4%',
    maxDrawdown: '8%',
    profitSplit: '85%',
    prices: { '5K': 55, '10K': 99, '25K': 189, '50K': 299, '100K': 499, '200K': 949 }
  },
  'two-step': {
    name: '2-Step Challenge',
    profitTarget: '8% / 5%',
    dailyDrawdown: '5%',
    maxDrawdown: '10%',
    profitSplit: '90%',
    prices: { '5K': 45, '10K': 79, '25K': 159, '50K': 249, '100K': 449, '200K': 849 }
  }
};

const STEP_LABELS = ['Platform', 'Details', 'Confirm'];

const CheckoutPage = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const challengeType = searchParams.get('type') || 'one-step';
  const accountSize = searchParams.get('size') || '50K';
  
  const challenge = CHALLENGE_DATA[challengeType];
  const price = challenge?.prices[accountSize] || 299;

  const [step, setStep] = useState(1);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step === 1 && !selectedPlatform) {
      alert('Please select a trading platform');
      return;
    }
    if (step === 2 && (!formData.firstName || !formData.lastName || !formData.email)) {
      alert('Please fill in all required fields');
      return;
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate('/challenges');
  };

  const handleConfirmOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      navigate('/checkout/success?orderId=' + Math.random().toString(36).substr(2, 9).toUpperCase());
    }, 2000);
  };

  const inputClass = isDark 
    ? 'bg-[#0a0d12] border border-white/10 text-white placeholder-gray-500' 
    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400';

  return (
    <div className={`min-h-screen pt-20 pb-12 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {STEP_LABELS.map((label, index) => (
            <div key={label} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                step > index + 1 ? 'bg-emerald-500 text-white' 
                  : step === index + 1 ? 'bg-amber-500 text-[#0a0d12]' 
                  : isDark ? 'bg-white/10 text-gray-400' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > index + 1 ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step >= index + 1 ? (isDark ? 'text-white' : 'text-slate-900') : (isDark ? 'text-gray-500' : 'text-slate-400')
              }`}>{label}</span>
              {index < 2 && (
                <div className={`w-16 h-0.5 mx-4 ${step > index + 1 ? 'bg-emerald-500' : isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl p-6 lg:p-8 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
              
              {/* Step 1: Platform Selection */}
              {step === 1 && (
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Choose Your Trading Platform</h2>
                  <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Select the platform you want to trade on.</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {PLATFORMS.map((platform) => (
                      <div
                        key={platform.id}
                        onClick={() => setSelectedPlatform(platform.id)}
                        className={`relative rounded-xl p-5 border-2 cursor-pointer transition-all ${
                          selectedPlatform === platform.id
                            ? 'border-amber-500 shadow-lg shadow-amber-500/10'
                            : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
                        } ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}
                      >
                        {platform.isNew && (
                          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">NEW</div>
                        )}
                        <div className="text-3xl mb-3">{platform.icon}</div>
                        <h3 className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{platform.name}</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{platform.description}</p>
                        {selectedPlatform === platform.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-[#0a0d12]" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Personal Details */}
              {step === 2 && (
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Your Information</h2>
                  <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Enter your details to create your trading account.</p>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>First Name *</label>
                        <div className="relative">
                          <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                          <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange}
                            className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500/50 ${inputClass}`}
                            placeholder="John" />
                        </div>
                      </div>
                      <div>
                        <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Last Name *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange}
                          className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${inputClass}`}
                          placeholder="Doe" />
                      </div>
                    </div>
                    <div>
                      <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Email Address *</label>
                      <div className="relative">
                        <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                        <input type="email" name="email" value={formData.email} onChange={handleInputChange}
                          className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500/50 ${inputClass}`}
                          placeholder="trader@example.com" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Phone (Optional)</label>
                        <div className="relative">
                          <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                          <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange}
                            className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500/50 ${inputClass}`}
                            placeholder="+1 234 567 890" />
                        </div>
                      </div>
                      <div>
                        <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>Country</label>
                        <div className="relative">
                          <Globe className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                          <select name="country" value={formData.country} onChange={handleInputChange}
                            className={`w-full rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-amber-500/50 ${inputClass}`}>
                            <option value="">Select country</option>
                            <option value="US">United States</option>
                            <option value="UK">United Kingdom</option>
                            <option value="AE">United Arab Emirates</option>
                            <option value="DE">Germany</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Confirm */}
              {step === 3 && (
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Confirm Your Order</h2>
                  <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Review your selection and complete your purchase.</p>
                  
                  <div className={`rounded-xl p-5 mb-6 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                    <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Order Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Challenge Type</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Account Size</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>${accountSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Platform</span>
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {PLATFORMS.find(p => p.id === selectedPlatform)?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-xl p-5 border-2 border-dashed ${isDark ? 'border-amber-500/30 bg-amber-500/5' : 'border-amber-300 bg-amber-50'}`}>
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-amber-500" />
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Demo Mode</span>
                    </div>
                    <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                      Payment gateway integration coming soon. This is a demo checkout flow.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8">
                <Button variant="outline" onClick={handleBack}
                  className={`rounded-full px-6 py-5 h-auto ${isDark ? 'border-white/20 text-white hover:bg-white/5' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
                  <ArrowLeft className="mr-2 w-5 h-5" /> Back
                </Button>
                {step < 3 ? (
                  <Button onClick={handleNext}
                    className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-6 py-5 h-auto font-bold">
                    Continue <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                ) : (
                  <Button onClick={handleConfirmOrder} disabled={isProcessing}
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-full px-6 py-5 h-auto font-bold disabled:opacity-50">
                    {isProcessing ? 'Processing...' : 'Confirm Order'} <Check className="ml-2 w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl p-6 border sticky top-24 ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Order Summary</h3>
              
              <div className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                <div className="text-amber-500 font-bold text-lg">{challenge?.name}</div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>${accountSize} Account</div>
              </div>

              <div className={`border-t pt-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Subtotal</span>
                  <span className={`line-through ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>${price * 3}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-emerald-500 font-medium">70% OFF</span>
                  <span className="text-emerald-500">-${price * 2}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Total</span>
                  <span className="text-3xl font-black text-amber-500">${price}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>100% Fee Refund</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Instant Account Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-500" />
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
