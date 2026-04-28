// import React, { useState, useEffect } from 'react';
// import {
//   ShoppingCart,
//   Check,
//   CreditCard,
//   ChevronRight,
//   Zap,
//   Shield,
//   Star,
//   Clock,
//   TrendingUp,
//   AlertTriangle,
//   Loader2,
//   Lock
// } from 'lucide-react';
// import { useMutation } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import { useTraderTheme } from './TraderPanelLayout';
// import { useAuth } from '@/contexts/AuthContext';
// import { getChallenges } from '@/api/challenges';
// import { createWorldCardSession } from '@/api/payments';
// import { PaymentLogos } from '@/components/PaymentLogos';
// const accountSizes = [
//   { label: '$5K', key: '5K', value: 5000 },
//   { label: '$10K', key: '10K', value: 10000 },
//   { label: '$25K', key: '25K', value: 25000 },
//   { label: '$50K', key: '50K', value: 50000 },
//   { label: '$100K', key: '100K', value: 100000 },
//   { label: '$200K', key: '200K', value: 200000 }
// ];

// const challengeTypes = [
//   {
//     id: '1-step',
//     name: '1-Step Challenge',
//     badge: 'Most Popular',
//     description: 'Quick evaluation with achievable targets',
//     phases: 1,
//     profitTarget: '10%',
//     dailyDrawdown: '4%',
//     maxDrawdown: '8%',
//     profitSplit: '85%',
//     leverage: '1:30',
//     minDays: 'None',
//     popular: true,
//     prices: { '5K': 55, '10K': 99, '25K': 189, '50K': 299, '100K': 499, '200K': 949 }
//   },
//   {
//     id: '2-step',
//     name: '2-Step Challenge',
//     badge: 'Best Split',
//     description: 'Traditional evaluation with highest profit split',
//     phases: 2,
//     profitTarget: '8% / 5%',
//     dailyDrawdown: '5%',
//     maxDrawdown: '10%',
//     profitSplit: '90%',
//     leverage: '1:50',
//     minDays: 'None',
//     popular: false,
//     prices: { '5K': 45, '10K': 79, '25K': 159, '50K': 249, '100K': 449, '200K': 849 }
//   }
// ];

// const platforms = [
//   { id: 'mt5', name: 'MetaTrader 5', desc: 'Most popular platform' },
//   { id: 'tradelocker', name: 'TradeLocker', desc: 'Coming soon', comingSoon: true },
//   { id: 'bybit', name: 'Bybit', desc: 'Crypto trading' },
//   { id: 'pt5', name: 'PT5', desc: 'Advanced trading' },
// ];

// const PURCHASES_DISABLED = true;

// const TradeCheckoutPanelPage = () => {
//   const { isDark } = useTraderTheme();
//   const { user } = useAuth();
//   const [step, setStep] = useState(1);
//   const [selectedType, setSelectedType] = useState('1-step');
//   const [selectedSizeIndex, setSelectedSizeIndex] = useState(3);
//   const [selectedPlatform, setSelectedPlatform] = useState('mt5');
//   const [selectedPayment, setSelectedPayment] = useState('card');
//   const [backendChallenges, setBackendChallenges] = useState([]);
//   const [loadingChallenges, setLoadingChallenges] = useState(true);
//   const [tradeLockerAlert, setTradeLockerAlert] = useState(false);
//   const [couponCode, setCouponCode] = useState('');

//   const worldCardMutation = useMutation({
//     mutationFn: createWorldCardSession,
//     onSuccess: (data) => {
//       if (data?.redirectUrl) {
//         toast.success('Redirecting to payment...');
//         window.location.href = data.redirectUrl;
//       } else {
//         toast.error('No checkout URL received from payment gateway.');
//       }
//     },
//     onError: (err) => {
//       toast.error(err?.message || 'Failed to start checkout. Please try again.');
//     },
//   });

//   useEffect(() => {
//     const fetchChallenges = async () => {
//       try {
//         setLoadingChallenges(true);
//         const data = await getChallenges();
//         if (Array.isArray(data)) {
//           setBackendChallenges(data);
//         }
//       } catch (err) {
//         console.warn('Could not fetch challenges from backend, using defaults:', err);
//       } finally {
//         setLoadingChallenges(false);
//       }
//     };
//     fetchChallenges();
//   }, []);

//   const selectedChallenge = challengeTypes.find(c => c.id === selectedType);
//   const selectedSizeKey = accountSizes[selectedSizeIndex].key;
//   const finalPrice = selectedChallenge?.prices[selectedSizeKey] || 299;

//   const matchingBackendChallenge = backendChallenges.find(bc => {
//     const sizeMatch = bc.accountSize === accountSizes[selectedSizeIndex].value;
//     const typeMatch = selectedType === '1-step'
//       ? bc.challengeType === 'one_phase' || bc.challengeType === '1-step'
//       : bc.challengeType === 'two_phase' || bc.challengeType === '2-step';
//     return sizeMatch && typeMatch;
//   });

//   const handlePlatformSelect = (platformId) => {
//     if (platformId === 'tradelocker') {
//       setTradeLockerAlert(true);
//       return;
//     }
//     setTradeLockerAlert(false);
//     setSelectedPlatform(platformId);
//   };

//   const handleProceedToPayment = () => {
//     if (PURCHASES_DISABLED) {
//       toast.info('Purchases are temporarily unavailable. Please check back soon.');
//       return;
//     }
//     if (selectedPlatform === 'tradelocker') {
//       setTradeLockerAlert(true);
//       return;
//     }
//     setStep(2);
//   };

//   const handlePurchase = () => {
//     if (PURCHASES_DISABLED) {
//       toast.info('Purchases are temporarily unavailable. Please check back soon.');
//       return;
//     }
//     if (!user?.userId) {
//       toast.error('You must be logged in to purchase a challenge.');
//       return;
//     }

//     const payload = {
//       userId: user.userId,
//       challengeId: matchingBackendChallenge?.id || undefined,
//       accountSize: accountSizes[selectedSizeIndex].value,
//       challengeType: selectedType,
//       platform: selectedPlatform.toUpperCase(),
//       paymentMethod: selectedPayment,
//       couponCode: couponCode || undefined,
//     };

//     worldCardMutation.mutate(payload);
//   };

//   const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
//   const textClass = isDark ? 'text-white' : 'text-slate-900';
//   const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

//   return (
//     <div className="space-y-6" data-testid="checkout-panel-page">
//       {/* Header */}
//       <div className={`${cardClass} p-6`}>
//         <div className="flex items-center gap-3 mb-2">
//           <ShoppingCart className="w-6 h-6 text-amber-500" />
//           <h1 className={`text-2xl font-bold ${textClass}`}>Buy New Challenge</h1>
//         </div>
//         <p className={mutedClass}>Choose your challenge package and start your trading journey.</p>

//         {/* Progress Steps */}
//         <div className="flex items-center gap-4 mt-6">
//           {[1, 2].map((s) => (
//             <div key={s} className="flex items-center gap-2">
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-amber-500 text-black' : isDark ? 'bg-white/10 text-gray-500' : 'bg-slate-100 text-slate-400'
//                 }`}>
//                 {step > s ? <Check className="w-4 h-4" /> : s}
//               </div>
//               <span className={`text-sm hidden sm:inline ${step >= s ? textClass : mutedClass}`}>
//                 {s === 1 ? 'Select Package' : 'Payment'}
//               </span>
//               {s < 2 && <div className={`w-16 h-0.5 ${step > s ? 'bg-amber-500' : isDark ? 'bg-white/10' : 'bg-slate-200'}`} />}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Step 1: Select Challenge Package */}
//       {step === 1 && (
//         <>
//           {/* Account Size Selector */}
//           <div className="flex justify-center overflow-x-auto pb-2">
//             <div className={`rounded-full p-1 sm:p-1.5 inline-flex gap-1 border ${isDark ? 'bg-[#0a0d12] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
//               {accountSizes.map((size, index) => (
//                 <button
//                   key={size.value}
//                   onClick={() => setSelectedSizeIndex(index)}
//                   className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${selectedSizeIndex === index
//                     ? 'bg-amber-500 text-black'
//                     : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
//                     }`}
//                 >
//                   {size.label}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Challenge Cards */}
//           <div className="grid md:grid-cols-2 gap-6">
//             {challengeTypes.map((challenge) => (
//               <button
//                 key={challenge.id}
//                 onClick={() => setSelectedType(challenge.id)}
//                 className={`relative text-left rounded-2xl p-6 border-2 transition-all ${selectedType === challenge.id
//                   ? 'border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.15)]'
//                   : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
//                   } ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}
//               >
//                 {/* Badge */}
//                 <div className="absolute -top-3 left-1/2 -translate-x-1/2">
//                   <div className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${challenge.popular
//                     ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black'
//                     : challenge.badge
//                       ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
//                       : isDark ? 'bg-white/10 text-gray-400' : 'bg-slate-100 text-slate-500'
//                     }`}>
//                     {challenge.popular && <Star className="w-3 h-3 fill-current" />}
//                     {challenge.badge}
//                   </div>
//                 </div>

//                 {/* Selection indicator */}
//                 <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedType === challenge.id
//                   ? 'border-amber-500 bg-amber-500'
//                   : isDark ? 'border-white/20' : 'border-slate-300'
//                   }`}>
//                   {selectedType === challenge.id && <Check className="w-4 h-4 text-black" />}
//                 </div>

//                 {/* Header */}
//                 <div className="text-center mb-4 pt-4">
//                   <h3 className={`text-xl font-bold mb-1 ${textClass}`}>{challenge.name}</h3>
//                   <p className={`text-sm ${mutedClass}`}>{challenge.description}</p>
//                 </div>

//                 {/* Price */}
//                 <div className={`text-center mb-4 py-4 rounded-xl ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
//                   <div className={`text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
//                     ${(challenge.prices[selectedSizeKey] * 3).toFixed(0)}
//                   </div>
//                   <div className="text-amber-500 text-3xl font-black">
//                     ${challenge.prices[selectedSizeKey]}
//                   </div>
//                   <div className="text-emerald-500 text-xs font-semibold mt-1">70% OFF</div>
//                 </div>

//                 {/* Stats Grid */}
//                 <div className="space-y-2 mb-4">
//                   {[
//                     { label: 'Phases', value: `${challenge.phases} Phase${challenge.phases > 1 ? 's' : ''}` },
//                     { label: 'Profit Target', value: challenge.profitTarget },
//                     { label: 'Daily Drawdown', value: challenge.dailyDrawdown },
//                     { label: 'Max Drawdown', value: challenge.maxDrawdown },
//                     { label: 'Leverage', value: challenge.leverage },
//                     { label: 'Min Trading Days', value: challenge.minDays, highlight: true },
//                   ].map((item, index) => (
//                     <div key={index} className={`flex items-center justify-between py-1.5 text-sm ${index < 5 ? isDark ? 'border-b border-white/5' : 'border-b border-slate-100' : ''
//                       }`}>
//                       <span className={mutedClass}>{item.label}</span>
//                       <span className={`font-semibold ${item.highlight ? 'text-emerald-500' : textClass}`}>
//                         {item.value}
//                       </span>
//                     </div>
//                   ))}
//                   <div className="flex items-center justify-between py-2">
//                     <span className={mutedClass}>Profit Split</span>
//                     <span className="text-amber-500 text-xl font-bold">{challenge.profitSplit}</span>
//                   </div>
//                 </div>

//                 {/* Features */}
//                 <div className="grid grid-cols-2 gap-2">
//                   {['No time limit', 'All strategies', '100% fee refund', 'Free course'].map((feature, index) => (
//                     <div key={index} className="flex items-center gap-1.5">
//                       <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
//                       <span className={`text-xs ${mutedClass}`}>{feature}</span>
//                     </div>
//                   ))}
//                 </div>
//               </button>
//             ))}
//           </div>

//           {/* Platform Selection */}
//           <div className={`${cardClass} p-6`}>
//             <h3 className={`font-bold mb-4 ${textClass}`}>Select Trading Platform</h3>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//               {platforms.map((platform) => (
//                 <button
//                   key={platform.id}
//                   onClick={() => handlePlatformSelect(platform.id)}
//                   className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${platform.comingSoon
//                     ? isDark ? 'border-white/5 opacity-60' : 'border-slate-100 opacity-60'
//                     : selectedPlatform === platform.id
//                       ? 'border-amber-500 bg-amber-500/10'
//                       : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
//                     }`}
//                 >
//                   {platform.comingSoon ? (
//                     <Lock className={`w-6 h-6 ${mutedClass}`} />
//                   ) : (
//                     <Zap className={`w-6 h-6 ${selectedPlatform === platform.id ? 'text-amber-500' : mutedClass}`} />
//                   )}
//                   <span className={`font-semibold text-sm ${textClass}`}>{platform.name}</span>
//                   <span className={`text-xs ${platform.comingSoon ? 'text-amber-500 font-medium' : mutedClass}`}>{platform.desc}</span>
//                   {platform.comingSoon && (
//                     <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">SOON</span>
//                   )}
//                 </button>
//               ))}
//             </div>

//             {tradeLockerAlert && (
//               <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
//                 <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <p className={`font-semibold text-sm ${textClass}`}>TradeLocker is Coming Soon</p>
//                   <p className={`text-sm mt-1 ${mutedClass}`}>
//                     We're currently working on integrating TradeLocker into our platform. This feature will be available soon. Please choose another trading platform.
//                   </p>
//                   <button
//                     onClick={() => { setTradeLockerAlert(false); setSelectedPlatform('mt5'); }}
//                     className="mt-2 text-sm text-amber-500 font-semibold hover:underline"
//                   >
//                     Select MetaTrader 5 instead
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </>
//       )}

//       {/* Step 2: Payment */}
//       {step === 2 && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Order Summary */}
//           <div className={`lg:col-span-2 ${cardClass} p-6`}>
//             <h3 className={`font-bold text-lg mb-6 ${textClass}`}>Order Summary</h3>

//             <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center gap-3">
//                   <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
//                     <TrendingUp className="w-6 h-6 text-amber-500" />
//                   </div>
//                   <div>
//                     <p className={`font-bold ${textClass}`}>{selectedChallenge?.name}</p>
//                     <p className={`text-sm ${mutedClass}`}>${accountSizes[selectedSizeIndex].value.toLocaleString()} Account</p>
//                   </div>
//                 </div>
//                 <p className={`text-2xl font-bold ${textClass}`}>${finalPrice}</p>
//               </div>
//               <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
//                 <div className="grid grid-cols-3 gap-4 text-sm">
//                   <div>
//                     <p className={mutedClass}>Profit Target</p>
//                     <p className={`font-semibold ${textClass}`}>{selectedChallenge?.profitTarget}</p>
//                   </div>
//                   <div>
//                     <p className={mutedClass}>Profit Split</p>
//                     <p className="font-semibold text-amber-500">{selectedChallenge?.profitSplit}</p>
//                   </div>
//                   <div>
//                     <p className={mutedClass}>Platform</p>
//                     <p className={`font-semibold ${textClass}`}>{platforms.find(p => p.id === selectedPlatform)?.name}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
//               <div className="flex items-center gap-2">
//                 <Shield className="w-5 h-5 text-emerald-500" />
//                 <span className="text-emerald-500 font-medium">100% fee refund on first payout</span>
//               </div>
//             </div>

//             {worldCardMutation.isError && (
//               <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
//                 <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <p className="font-semibold text-sm text-red-500">Purchase Failed</p>
//                   <p className={`text-sm mt-1 ${mutedClass}`}>{worldCardMutation.error?.message || 'Something went wrong. Please try again.'}</p>
//                 </div>
//               </div>
//             )}

//             <div className={`mt-6 pt-6 border-t flex justify-between items-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
//               <p className={`text-lg font-bold ${textClass}`}>Total</p>
//               <p className="text-3xl font-bold text-amber-500">${finalPrice}</p>
//             </div>
//           </div>

//           {/* Payment Methods */}
//           <div className={`${cardClass} p-4 sm:p-6`}>
//             <h3 className={`font-bold mb-4 ${textClass}`}>Payment Method</h3>

//             <div className="space-y-3">
//               <button
//                 onClick={() => setSelectedPayment('card')}
//                 className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selectedPayment === 'card'
//                   ? 'border-amber-500 bg-amber-500/10'
//                   : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
//                   }`}
//               >
//                 <CreditCard className={`w-5 h-5 ${selectedPayment === 'card' ? 'text-amber-500' : mutedClass}`} />
//                 <span className={`font-medium ${textClass}`}>Credit Card</span>
//                 {selectedPayment === 'card' && <Check className="w-4 h-4 text-amber-500 ml-auto" />}
//               </button>

//               <button
//                 disabled
//                 onClick={() => setSelectedPayment('crypto')}
//                 className={`w-full flex  items-center gap-3 p-4 rounded-xl border-2 transition-all ${selectedPayment === 'crypto'
//                   ? 'border-amber-500 bg-amber-500/10'
//                   : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
//                   }`}
//               >
//                 <span className="text-xl">₿</span>
//                 <span className={`font-medium ${textClass}`}>Crypto</span>
//                 <span className={"text-xs "}>(Comming Soon) </span>
//                 {selectedPayment === 'crypto' && <Check className="w-4 h-4 text-amber-500 ml-auto" />}
//               </button>
//             </div>

//             <button
//               onClick={handlePurchase}
//               disabled={worldCardMutation.isPending || PURCHASES_DISABLED}
//               className={`w-full mt-6 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${worldCardMutation.isPending || PURCHASES_DISABLED ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               {worldCardMutation.isPending ? (
//                 <>
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                   Processing...
//                 </>
//               ) : PURCHASES_DISABLED ? (
//                 <>
//                   <Lock className="w-5 h-5" />
//                   Temporarily 
//                 </>
//               ) : (
//                 <>
//                   <Shield className="w-5 h-5" />
//                   Complete Purchase
//                 </>
//               )}
//             </button>

//             <div className="flex flex-col items-center gap-3 mt-4">
//               <p className={`text-xs ${mutedClass}`}>
//                 Secure payment powered by WorldCard
//               </p>
//               <div>
//                 <p className={`text-xs mb-1.5 ${mutedClass}`}>We accept</p>
//                 <PaymentLogos />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Step 3: Success */}
//       {step === 3 && (
//         <div className={`${cardClass} p-12 text-center`}>
//           <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
//             <Check className="w-10 h-10 text-emerald-500" />
//           </div>
//           <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>Purchase Successful!</h2>
//           <p className={`mb-6 ${mutedClass}`}>Your {selectedChallenge?.name} has been created. Check your email for credentials.</p>

//           <div className={`inline-flex items-center gap-6 p-4 rounded-xl mb-6 ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
//             <div className="text-left">
//               <p className={`text-sm ${mutedClass}`}>Challenge</p>
//               <p className={`font-bold ${textClass}`}>{selectedChallenge?.name}</p>
//             </div>
//             <div className={`w-px h-10 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
//             <div className="text-left">
//               <p className={`text-sm ${mutedClass}`}>Account Size</p>
//               <p className={`font-bold ${textClass}`}>${accountSizes[selectedSizeIndex].value.toLocaleString()}</p>
//             </div>
//             <div className={`w-px h-10 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
//             <div className="text-left">
//               <p className={`text-sm ${mutedClass}`}>Platform</p>
//               <p className={`font-bold ${textClass}`}>{platforms.find(p => p.id === selectedPlatform)?.name}</p>
//             </div>
//           </div>

//           <div className="flex justify-center gap-4">
//             <a href="/traderdashboard" className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl">
//               Go to Dashboard
//             </a>
//             <a href="/traderdashboard/trading" className={`px-6 py-3 rounded-xl font-medium ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}>
//               Start Trading
//             </a>
//           </div>
//         </div>
//       )}

//       {/* Navigation */}
//       {step < 3 && (
//         <div className="flex justify-between">
//           <button
//             onClick={() => { setStep(Math.max(1, step - 1)); worldCardMutation.reset(); }}
//             disabled={step === 1}
//             className={`px-6 py-3 rounded-xl font-medium ${step === 1 ? 'opacity-50 cursor-not-allowed' : ''
//               } ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}
//           >
//             Back
//           </button>
//           <button
//             onClick={() => step === 1 ? handleProceedToPayment() : handlePurchase()}
//             disabled={worldCardMutation.isPending || PURCHASES_DISABLED}
//             className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl ${worldCardMutation.isPending || PURCHASES_DISABLED ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             {worldCardMutation.isPending ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Processing...
//               </>
//             ) : PURCHASES_DISABLED ? (
//               <>
//                 <Lock className="w-4 h-4" />
//                 Temporarily 
//               </>
//             ) : (
//               <>
//                 {step === 1 ? 'Continue to Payment' : 'Complete Purchase'}
//                 <ChevronRight className="w-4 h-4" />
//               </>
//             )}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default TradeCheckoutPanelPage;


// import React, { useState, useEffect } from 'react';
// import {
//   ShoppingCart,
//   Check,
//   CreditCard,
//   ChevronRight,
//   Zap,
//   Shield,
//   Star,
//   Clock,
//   TrendingUp,
//   AlertTriangle,
//   Loader2,
//   Lock
// } from 'lucide-react';
// import { useMutation } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import { useTraderTheme } from './TraderPanelLayout';
// import { useAuth } from '@/contexts/AuthContext';
// import { getChallenges } from '@/api/challenges';
// import { createWorldCardSession } from '@/api/payments';
// import { PaymentLogos } from '@/components/PaymentLogos';
// 
// const accountSizes = [
//   { label: '$5K', key: '5K', value: 5000 },
//   { label: '$10K', key: '10K', value: 10000 },
//   { label: '$25K', key: '25K', value: 25000 },
//   { label: '$50K', key: '50K', value: 50000 },
//   { label: '$100K', key: '100K', value: 100000 },
//   { label: '$200K', key: '200K', value: 200000 }
// ];
// 
// const challengeTypes = [
//   {
//     id: '1-step',
//     name: '1-Step Challenge',
//     badge: 'Most Popular',
//     description: 'Quick evaluation with achievable targets',
//     phases: 1,
//     profitTarget: '10%',
//     dailyDrawdown: '4%',
//     maxDrawdown: '8%',
//     profitSplit: '85%',
//     leverage: '1:30',
//     minDays: 'None',
//     popular: true,
//     prices: { '5K': 55, '10K': 99, '25K': 189, '50K': 299, '100K': 499, '200K': 949 }
//   },
//   {
//     id: '2-step',
//     name: '2-Step Challenge',
//     badge: 'Best Split',
//     description: 'Traditional evaluation with highest profit split',
//     phases: 2,
//     profitTarget: '8% / 5%',
//     dailyDrawdown: '5%',
//     maxDrawdown: '10%',
//     profitSplit: '90%',
//     leverage: '1:50',
//     minDays: 'None',
//     popular: false,
//     prices: { '5K': 45, '10K': 79, '25K': 159, '50K': 249, '100K': 449, '200K': 849 }
//   }
// ];
// 
// const platforms = [
//   { id: 'mt5', name: 'MetaTrader 5', desc: 'Most popular platform' },
//   { id: 'tradelocker', name: 'TradeLocker', desc: 'Coming soon', comingSoon: true },
//   { id: 'bybit', name: 'Bybit', desc: 'Crypto trading' },
//   { id: 'pt5', name: 'PT5', desc: 'Advanced trading' },
// ];
// 
// const TradeCheckoutPanelPage = () => {
//   const { isDark } = useTraderTheme();
//   const { user } = useAuth();
//   const [step, setStep] = useState(1);
//   const [selectedType, setSelectedType] = useState('1-step');
//   const [selectedSizeIndex, setSelectedSizeIndex] = useState(3);
//   const [selectedPlatform, setSelectedPlatform] = useState('mt5');
//   const [selectedPayment, setSelectedPayment] = useState('card');
//   const [backendChallenges, setBackendChallenges] = useState([]);
//   const [loadingChallenges, setLoadingChallenges] = useState(true);
//   const [tradeLockerAlert, setTradeLockerAlert] = useState(false);
//   const [couponCode, setCouponCode] = useState('');
// 
//   const worldCardMutation = useMutation({
//     mutationFn: createWorldCardSession,
//     onSuccess: (data) => {
//       if (data?.redirectUrl) {
//         toast.success('Redirecting to payment...');
//         window.location.href = data.redirectUrl;
//       } else {
//         toast.error('No checkout URL received from payment gateway.');
//       }
//     },
//     onError: (err) => {
//       toast.error(err?.message || 'Failed to start checkout. Please try again.');
//     },
//   });
// 
//   useEffect(() => {
//     const fetchChallenges = async () => {
//       try {
//         setLoadingChallenges(true);
//         const data = await getChallenges();
//         if (Array.isArray(data)) {
//           setBackendChallenges(data);
//         }
//       } catch (err) {
//         console.warn('Could not fetch challenges from backend, using defaults:', err);
//       } finally {
//         setLoadingChallenges(false);
//       }
//     };
//     fetchChallenges();
//   }, []);
// 
//   const selectedChallenge = challengeTypes.find(c => c.id === selectedType);
//   const selectedSizeKey = accountSizes[selectedSizeIndex].key;
//   const finalPrice = selectedChallenge?.prices[selectedSizeKey] || 299;
// 
//   const matchingBackendChallenge = backendChallenges.find(bc => {
//     const sizeMatch = bc.accountSize === accountSizes[selectedSizeIndex].value;
//     const typeMatch = selectedType === '1-step'
//       ? bc.challengeType === 'one_phase' || bc.challengeType === '1-step'
//       : bc.challengeType === 'two_phase' || bc.challengeType === '2-step';
//     return sizeMatch && typeMatch;
//   });
// 
//   const handlePlatformSelect = (platformId) => {
//     if (platformId === 'tradelocker') {
//       setTradeLockerAlert(true);
//       return;
//     }
//     setTradeLockerAlert(false);
//     setSelectedPlatform(platformId);
//   };
// 
//   const handleProceedToPayment = () => {
//     if (selectedPlatform === 'tradelocker') {
//       setTradeLockerAlert(true);
//       return;
//     }
//     setStep(2);
//   };
// 
//   const handlePurchase = () => {
//     if (!user?.userId) {
//       toast.error('You must be logged in to purchase a challenge.');
//       return;
//     }
// 
//     const payload = {
//       userId: user.userId,
//       challengeId: matchingBackendChallenge?.id || undefined,
//       accountSize: accountSizes[selectedSizeIndex].value,
//       challengeType: selectedType,
//       platform: selectedPlatform.toUpperCase(),
//       paymentMethod: selectedPayment,
//       couponCode: couponCode || undefined,
//     };
// 
//     worldCardMutation.mutate(payload);
//   };
// 
//   const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
//   const textClass = isDark ? 'text-white' : 'text-slate-900';
//   const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';
// 
//   return (
//     <div className="space-y-6" data-testid="checkout-panel-page">
//       {/* Header */}
//       <div className={`${cardClass} p-6`}>
//         <div className="flex items-center gap-3 mb-2">
//           <ShoppingCart className="w-6 h-6 text-amber-500" />
//           <h1 className={`text-2xl font-bold ${textClass}`}>Buy New Challenge</h1>
//         </div>
//         <p className={mutedClass}>Choose your challenge package and start your trading journey.</p>
// 
//         {/* Progress Steps */}
//         <div className="flex items-center gap-4 mt-6">
//           {[1, 2].map((s) => (
//             <div key={s} className="flex items-center gap-2">
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s ? 'bg-amber-500 text-black' : isDark ? 'bg-white/10 text-gray-500' : 'bg-slate-100 text-slate-400'
//                 }`}>
//                 {step > s ? <Check className="w-4 h-4" /> : s}
//               </div>
//               <span className={`text-sm hidden sm:inline ${step >= s ? textClass : mutedClass}`}>
//                 {s === 1 ? 'Select Package' : 'Payment'}
//               </span>
//               {s < 2 && <div className={`w-16 h-0.5 ${step > s ? 'bg-amber-500' : isDark ? 'bg-white/10' : 'bg-slate-200'}`} />}
//             </div>
//           ))}
//         </div>
//       </div>
// 
//       {/* Step 1: Select Challenge Package */}
//       {step === 1 && (
//         <>
//           {/* Account Size Selector */}
//           <div className="flex justify-center overflow-x-auto pb-2">
//             <div className={`rounded-full p-1 sm:p-1.5 inline-flex gap-1 border ${isDark ? 'bg-[#0a0d12] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
//               {accountSizes.map((size, index) => (
//                 <button
//                   key={size.value}
//                   onClick={() => setSelectedSizeIndex(index)}
//                   className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${selectedSizeIndex === index
//                     ? 'bg-amber-500 text-black'
//                     : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
//                     }`}
//                 >
//                   {size.label}
//                 </button>
//               ))}
//             </div>
//           </div>
// 
//           {/* Challenge Cards */}
//           <div className="grid md:grid-cols-2 gap-6">
//             {challengeTypes.map((challenge) => (
//               <button
//                 key={challenge.id}
//                 onClick={() => setSelectedType(challenge.id)}
//                 className={`relative text-left rounded-2xl p-6 border-2 transition-all ${selectedType === challenge.id
//                   ? 'border-amber-500 shadow-[0_0_30px_rgba(251,191,36,0.15)]'
//                   : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
//                   } ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}
//               >
//                 {/* Badge */}
//                 <div className="absolute -top-3 left-1/2 -translate-x-1/2">
//                   <div className={`px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${challenge.popular
//                     ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black'
//                     : challenge.badge
//                       ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
//                       : isDark ? 'bg-white/10 text-gray-400' : 'bg-slate-100 text-slate-500'
//                     }`}>
//                     {challenge.popular && <Star className="w-3 h-3 fill-current" />}
//                     {challenge.badge}
//                   </div>
//                 </div>
// 
//                 {/* Selection indicator */}
//                 <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedType === challenge.id
//                   ? 'border-amber-500 bg-amber-500'
//                   : isDark ? 'border-white/20' : 'border-slate-300'
//                   }`}>
//                   {selectedType === challenge.id && <Check className="w-4 h-4 text-black" />}
//                 </div>
// 
//                 {/* Header */}
//                 <div className="text-center mb-4 pt-4">
//                   <h3 className={`text-xl font-bold mb-1 ${textClass}`}>{challenge.name}</h3>
//                   <p className={`text-sm ${mutedClass}`}>{challenge.description}</p>
//                 </div>
// 
//                 {/* Price */}
//                 <div className={`text-center mb-4 py-4 rounded-xl ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
//                   <div className={`text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
//                     ${(challenge.prices[selectedSizeKey] * 3).toFixed(0)}
//                   </div>
//                   <div className="text-amber-500 text-3xl font-black">
//                     ${challenge.prices[selectedSizeKey]}
//                   </div>
//                   <div className="text-emerald-500 text-xs font-semibold mt-1">70% OFF</div>
//                 </div>
// 
//                 {/* Stats Grid */}
//                 <div className="space-y-2 mb-4">
//                   {[
//                     { label: 'Phases', value: `${challenge.phases} Phase${challenge.phases > 1 ? 's' : ''}` },
//                     { label: 'Profit Target', value: challenge.profitTarget },
//                     { label: 'Daily Drawdown', value: challenge.dailyDrawdown },
//                     { label: 'Max Drawdown', value: challenge.maxDrawdown },
//                     { label: 'Leverage', value: challenge.leverage },
//                     { label: 'Min Trading Days', value: challenge.minDays, highlight: true },
//                   ].map((item, index) => (
//                     <div key={index} className={`flex items-center justify-between py-1.5 text-sm ${index < 5 ? isDark ? 'border-b border-white/5' : 'border-b border-slate-100' : ''
//                       }`}>
//                       <span className={mutedClass}>{item.label}</span>
//                       <span className={`font-semibold ${item.highlight ? 'text-emerald-500' : textClass}`}>
//                         {item.value}
//                       </span>
//                     </div>
//                   ))}
//                   <div className="flex items-center justify-between py-2">
//                     <span className={mutedClass}>Profit Split</span>
//                     <span className="text-amber-500 text-xl font-bold">{challenge.profitSplit}</span>
//                   </div>
//                 </div>
// 
//                 {/* Features */}
//                 <div className="grid grid-cols-2 gap-2">
//                   {['No time limit', 'All strategies', '100% fee refund', 'Free course'].map((feature, index) => (
//                     <div key={index} className="flex items-center gap-1.5">
//                       <Check className="w-3 h-3 text-emerald-500 flex-shrink-0" />
//                       <span className={`text-xs ${mutedClass}`}>{feature}</span>
//                     </div>
//                   ))}
//                 </div>
//               </button>
//             ))}
//           </div>
// 
//           {/* Platform Selection */}
//           <div className={`${cardClass} p-6`}>
//             <h3 className={`font-bold mb-4 ${textClass}`}>Select Trading Platform</h3>
//             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//               {platforms.map((platform) => (
//                 <button
//                   key={platform.id}
//                   onClick={() => handlePlatformSelect(platform.id)}
//                   className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${platform.comingSoon
//                     ? isDark ? 'border-white/5 opacity-60' : 'border-slate-100 opacity-60'
//                     : selectedPlatform === platform.id
//                       ? 'border-amber-500 bg-amber-500/10'
//                       : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
//                     }`}
//                 >
//                   {platform.comingSoon ? (
//                     <Lock className={`w-6 h-6 ${mutedClass}`} />
//                   ) : (
//                     <Zap className={`w-6 h-6 ${selectedPlatform === platform.id ? 'text-amber-500' : mutedClass}`} />
//                   )}
//                   <span className={`font-semibold text-sm ${textClass}`}>{platform.name}</span>
//                   <span className={`text-xs ${platform.comingSoon ? 'text-amber-500 font-medium' : mutedClass}`}>{platform.desc}</span>
//                   {platform.comingSoon && (
//                     <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">SOON</span>
//                   )}
//                 </button>
//               ))}
//             </div>
// 
//             {tradeLockerAlert && (
//               <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
//                 <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <p className={`font-semibold text-sm ${textClass}`}>TradeLocker is Coming Soon</p>
//                   <p className={`text-sm mt-1 ${mutedClass}`}>
//                     We're currently working on integrating TradeLocker into our platform. This feature will be available soon. Please choose another trading platform.
//                   </p>
//                   <button
//                     onClick={() => { setTradeLockerAlert(false); setSelectedPlatform('mt5'); }}
//                     className="mt-2 text-sm text-amber-500 font-semibold hover:underline"
//                   >
//                     Select MetaTrader 5 instead
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </>
//       )}
// 
//       {/* Step 2: Payment */}
//       {step === 2 && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Order Summary */}
//           <div className={`lg:col-span-2 ${cardClass} p-6`}>
//             <h3 className={`font-bold text-lg mb-6 ${textClass}`}>Order Summary</h3>
// 
//             <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
//               <div className="flex items-center justify-between mb-3">
//                 <div className="flex items-center gap-3">
//                   <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
//                     <TrendingUp className="w-6 h-6 text-amber-500" />
//                   </div>
//                   <div>
//                     <p className={`font-bold ${textClass}`}>{selectedChallenge?.name}</p>
//                     <p className={`text-sm ${mutedClass}`}>${accountSizes[selectedSizeIndex].value.toLocaleString()} Account</p>
//                   </div>
//                 </div>
//                 <p className={`text-2xl font-bold ${textClass}`}>${finalPrice}</p>
//               </div>
//               <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
//                 <div className="grid grid-cols-3 gap-4 text-sm">
//                   <div>
//                     <p className={mutedClass}>Profit Target</p>
//                     <p className={`font-semibold ${textClass}`}>{selectedChallenge?.profitTarget}</p>
//                   </div>
//                   <div>
//                     <p className={mutedClass}>Profit Split</p>
//                     <p className="font-semibold text-amber-500">{selectedChallenge?.profitSplit}</p>
//                   </div>
//                   <div>
//                     <p className={mutedClass}>Platform</p>
//                     <p className={`font-semibold ${textClass}`}>{platforms.find(p => p.id === selectedPlatform)?.name}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
// 
//             <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
//               <div className="flex items-center gap-2">
//                 <Shield className="w-5 h-5 text-emerald-500" />
//                 <span className="text-emerald-500 font-medium">100% fee refund on first payout</span>
//               </div>
//             </div>
// 
//             {worldCardMutation.isError && (
//               <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
//                 <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
//                 <div>
//                   <p className="font-semibold text-sm text-red-500">Purchase Failed</p>
//                   <p className={`text-sm mt-1 ${mutedClass}`}>{worldCardMutation.error?.message || 'Something went wrong. Please try again.'}</p>
//                 </div>
//               </div>
//             )}
// 
//             <div className={`mt-6 pt-6 border-t flex justify-between items-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
//               <p className={`text-lg font-bold ${textClass}`}>Total</p>
//               <p className="text-3xl font-bold text-amber-500">${finalPrice}</p>
//             </div>
//           </div>
// 
//           {/* Payment Methods */}
//           <div className={`${cardClass} p-4 sm:p-6`}>
//             <h3 className={`font-bold mb-4 ${textClass}`}>Payment Method</h3>
// 
//             <div className="space-y-3">
//               <button
//                 onClick={() => setSelectedPayment('card')}
//                 className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${selectedPayment === 'card'
//                   ? 'border-amber-500 bg-amber-500/10'
//                   : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
//                   }`}
//               >
//                 <CreditCard className={`w-5 h-5 ${selectedPayment === 'card' ? 'text-amber-500' : mutedClass}`} />
//                 <span className={`font-medium ${textClass}`}>Credit Card</span>
//                 {selectedPayment === 'card' && <Check className="w-4 h-4 text-amber-500 ml-auto" />}
//               </button>
// 
//               <button
//                 disabled
//                 onClick={() => setSelectedPayment('crypto')}
//                 className={`w-full flex  items-center gap-3 p-4 rounded-xl border-2 transition-all ${selectedPayment === 'crypto'
//                   ? 'border-amber-500 bg-amber-500/10'
//                   : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
//                   }`}
//               >
//                 <span className="text-xl">₿</span>
//                 <span className={`font-medium ${textClass}`}>Crypto</span>
//                 <span className={"text-xs "}>(Comming Soon) </span>
//                 {selectedPayment === 'crypto' && <Check className="w-4 h-4 text-amber-500 ml-auto" />}
//               </button>
//             </div>
// 
//             <button
//               onClick={handlePurchase}
//               disabled={worldCardMutation.isPending}
//               className={`w-full mt-6 py-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${worldCardMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
//             >
//               {worldCardMutation.isPending ? (
//                 <>
//                   <Loader2 className="w-5 h-5 animate-spin" />
//                   Processing...
//                 </>
//               ) : (
//                 <>
//                   <Shield className="w-5 h-5" />
//                   Complete Purcha
//                 </>
//               )}
//             </button>
// 
//             <div className="flex flex-col items-center gap-3 mt-4">
//               <p className={`text-xs ${mutedClass}`}>
//                 Secure payment powered by WorldCard
//               </p>
//               <div>
//                 <p className={`text-xs mb-1.5 ${mutedClass}`}>We accept</p>
//                 <PaymentLogos />
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
// 
//       {/* Step 3: Success */}
//       {step === 3 && (
//         <div className={`${cardClass} p-12 text-center`}>
//           <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
//             <Check className="w-10 h-10 text-emerald-500" />
//           </div>
//           <h2 className={`text-2xl font-bold mb-2 ${textClass}`}>Purchase Successful!</h2>
//           <p className={`mb-6 ${mutedClass}`}>Your {selectedChallenge?.name} has been created. Check your email for credentials.</p>
// 
//           <div className={`inline-flex items-center gap-6 p-4 rounded-xl mb-6 ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
//             <div className="text-left">
//               <p className={`text-sm ${mutedClass}`}>Challenge</p>
//               <p className={`font-bold ${textClass}`}>{selectedChallenge?.name}</p>
//             </div>
//             <div className={`w-px h-10 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
//             <div className="text-left">
//               <p className={`text-sm ${mutedClass}`}>Account Size</p>
//               <p className={`font-bold ${textClass}`}>${accountSizes[selectedSizeIndex].value.toLocaleString()}</p>
//             </div>
//             <div className={`w-px h-10 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
//             <div className="text-left">
//               <p className={`text-sm ${mutedClass}`}>Platform</p>
//               <p className={`font-bold ${textClass}`}>{platforms.find(p => p.id === selectedPlatform)?.name}</p>
//             </div>
//           </div>
// 
//           <div className="flex justify-center gap-4">
//             <a href="/traderdashboard" className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl">
//               Go to Dashboard
//             </a>
//             <a href="/traderdashboard/trading" className={`px-6 py-3 rounded-xl font-medium ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}>
//               Start Trading
//             </a>
//           </div>
//         </div>
//       )}
// 
//       {/* Navigation */}
//       {step < 3 && (
//         <div className="flex justify-between">
//           <button
//             onClick={() => { setStep(Math.max(1, step - 1)); worldCardMutation.reset(); }}
//             disabled={step === 1}
//             className={`px-6 py-3 rounded-xl font-medium ${step === 1 ? 'opacity-50 cursor-not-allowed' : ''
//               } ${isDark ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}
//           >
//             Back
//           </button>
//           <button
//             onClick={() => step === 1 ? handleProceedToPayment() : handlePurchase()}
//             // disabled={worldCardMutation.isPending}
//             className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl ${worldCardMutation.isPending ? 'opacity-50' : ''}`}
//           >
//             {worldCardMutation.isPending ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Processing...
//               </>
//             ) : (
//               <>
//                 {step === 1 ? 'Continue to Paymet' : 'Complete Purcha'}
//                 <ChevronRight className="w-4 h-4" />
//               </>
//             )}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };
// 
// export default TradeCheckoutPanelPage;


// ─── New active version (v3): Step 1 select package + Step 2 billing form (mirrors /pay/:slug) ───

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Check,
  ChevronRight,
  Zap,
  Shield,
  Star,
  AlertTriangle,
  Loader2,
  Lock,
  CreditCard,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTraderTheme } from './TraderPanelLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getChallenges } from '@/api/challenges';
import { useNavigate } from 'react-router-dom';

// Format any amount + currency as a localized currency string.
// Backend Challenge rows carry their own currency, so the trader-side
// checkout adapts: USD challenge → "$245", GBP challenge → "£245", etc.
const formatCurrency = (amount, currency) => {
  if (amount === undefined || amount === null) return '';
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency || 'GBP',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency || ''} ${amount}`.trim();
  }
};

const accountSizes = [
  { label: '£5K', key: '5K', value: 5000 },
  { label: '£10K', key: '10K', value: 10000 },
  { label: '£25K', key: '25K', value: 25000 },
  { label: '£50K', key: '50K', value: 50000 },
  { label: '£100K', key: '100K', value: 100000 },
  { label: '£200K', key: '200K', value: 200000 },
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
    prices: { '5K': 245, '10K': 99, '25K': 189, '50K': 299, '100K': 499, '200K': 949 },
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
    prices: { '5K': 45, '10K': 79, '25K': 245, '50K': 490, '100K': 449, '200K': 849 },
  },
];

const platforms = [
  { id: 'mt5', name: 'MetaTrader 5', desc: 'Most popular platform' },
  { id: 'tradelocker', name: 'TradeLocker', desc: 'Coming soon', comingSoon: true },
  { id: 'bybit', name: 'Bybit', desc: 'Crypto trading' },
  { id: 'pt5', name: 'PT5', desc: 'Advanced trading' },
];


const TradeCheckoutPanelPage = () => {
  const { isDark } = useTraderTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState('1-step');
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(3);
  const [selectedPlatform, setSelectedPlatform] = useState('mt5');
  const [tradeLockerAlert, setTradeLockerAlert] = useState(false);

  const [backendChallenges, setBackendChallenges] = useState([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        setLoadingChallenges(true);
        const data = await getChallenges();
        if (Array.isArray(data)) setBackendChallenges(data);
      } catch (err) {
        console.warn('Could not fetch challenges from backend:', err);
      } finally {
        setLoadingChallenges(false);
      }
    };
    fetchChallenges();
  }, []);



  const selectedChallenge = challengeTypes.find((c) => c.id === selectedType);
  const selectedSizeKey = accountSizes[selectedSizeIndex].key;
  const finalPrice = selectedChallenge?.prices[selectedSizeKey] || 299;

  // Find the backend challenge that matches a given (typeId, sizeIndex) pair.
  // Lets each card render its real backend price + currency, so when the user
  // updates challenges in the DB (e.g. swapping USD → GBP) the UI follows.
  const findBackendChallenge = (typeId, sizeIndex) =>
    backendChallenges.find((bc) => {
      const sizeMatch = bc.accountSize === accountSizes[sizeIndex].value;
      const typeMatch = typeId === '1-step'
        ? bc.challengeType === 'one_phase' || bc.challengeType === '1-step'
        : bc.challengeType === 'two_phase' || bc.challengeType === '2-step';
      return sizeMatch && typeMatch;
    });

  const matchingBackendChallenge = findBackendChallenge(selectedType, selectedSizeIndex);

  // Currency-aware derived values for the selected challenge. Falls back to the
  // hardcoded USD price (used by the visual cards) until backend data loads.
  // GBP only — Pay button + Order Summary always show £ regardless of backend currency.
  const matchedCurrency = 'GBP';
  const matchedPrice = matchingBackendChallenge?.price ?? finalPrice;
  const matchedFormatted = formatCurrency(matchedPrice, matchedCurrency);

  const handlePlatformSelect = (platformId) => {
    if (platformId === 'tradelocker') {
      setTradeLockerAlert(true);
      return;
    }
    setTradeLockerAlert(false);
    setSelectedPlatform(platformId);
  };

  const handleProceedToPayment = () => {
    if (selectedPlatform === 'tradelocker') {
      setTradeLockerAlert(true);
      return;
    }
    if (!matchingBackendChallenge?.id) {
      toast.error('No matching challenge found. Try a different size or type.');
      return;
    }
    // Hand off to the public /pay/:slug page using the challenge id as the
    // slug param. The backend by-slug lookup accepts ids; the form on that
    // page is the single source of truth for billing details + WorldCard.
    navigate(`/paycheckout/${matchingBackendChallenge.id}`);
  };






  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';


  return (
    <div className="space-y-6" data-testid="checkout-panel-page">
      <div className={`${cardClass} p-6`}>
        <div className="flex items-center gap-3 mb-2">
          <ShoppingCart className="w-6 h-6 text-amber-500" />
          <h1 className={`text-2xl font-bold ${textClass}`}>Buy New Challenge</h1>
        </div>
        <p className={mutedClass}>Choose your challenge package and start your trading journey.</p>
      </div>

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
                : challenge.badge
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
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

            {/* Price — pulled from backend so trader-card matches PayCheckout exactly */}
            {(() => {
              const cardMatch = findBackendChallenge(challenge.id, selectedSizeIndex);
              // Always display in GBP regardless of what the backend row says — we
              // do not deal in USD on this checkout.
              const cardCurrency = 'GBP';
              const cardPrice = cardMatch?.price ?? challenge.prices[selectedSizeKey];
              return (
                <div className={`text-center mb-4 py-4 rounded-xl ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
                  <div className={`text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    {formatCurrency(cardPrice * 3, cardCurrency)}
                  </div>
                  <div className="text-amber-500 text-3xl font-black">
                    {formatCurrency(cardPrice, cardCurrency)}
                  </div>
                  <div className="text-emerald-500 text-xs font-semibold mt-1">70% OFF</div>
                </div>
              );
            })()}

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
              onClick={() => handlePlatformSelect(platform.id)}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${platform.comingSoon
                ? isDark ? 'border-white/5 opacity-60' : 'border-slate-100 opacity-60'
                : selectedPlatform === platform.id
                  ? 'border-amber-500 bg-amber-500/10'
                  : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
                }`}
            >
              {platform.comingSoon ? (
                <Lock className={`w-6 h-6 ${mutedClass}`} />
              ) : (
                <Zap className={`w-6 h-6 ${selectedPlatform === platform.id ? 'text-amber-500' : mutedClass}`} />
              )}
              <span className={`font-semibold text-sm ${textClass}`}>{platform.name}</span>
              <span className={`text-xs ${platform.comingSoon ? 'text-amber-500 font-medium' : mutedClass}`}>{platform.desc}</span>
              {platform.comingSoon && (
                <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">SOON</span>
              )}
            </button>
          ))}
        </div>
        {tradeLockerAlert && (
          <div className={`mt-4 p-4 rounded-xl border flex items-start gap-3 ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className={`font-semibold text-sm ${textClass}`}>TradeLocker is Coming Soon</p>
              <p className={`text-sm mt-1 ${mutedClass}`}>
                We are currently working on integrating TradeLocker. Please choose another trading platform.
              </p>
              <button
                onClick={() => { setTradeLockerAlert(false); setSelectedPlatform('mt5'); }}
                className="mt-2 text-sm text-amber-500 font-semibold hover:underline"
              >
                Select MetaTrader 5 instead
              </button>






            </div>
          </div>
        )}
      </div>
      <div className="mx-auto">

        <button
          onClick={handleProceedToPayment}
          disabled={loadingChallenges || !matchingBackendChallenge}
          className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl ${loadingChallenges || !matchingBackendChallenge ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Continue to Payment
        </button>
      </div>
    </div >
  );
};

export default TradeCheckoutPanelPage;
