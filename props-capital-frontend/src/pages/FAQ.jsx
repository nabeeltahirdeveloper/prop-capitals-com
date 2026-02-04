import React, { useState } from 'react';
import { ChevronDown, Search, MessageCircle, Mail, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';

const faqCategories = [
  { id: 'general', name: 'General', count: 8 },
  { id: 'challenges', name: 'Challenges', count: 6 },
  { id: 'trading', name: 'Trading Rules', count: 7 },
  { id: 'payouts', name: 'Payouts', count: 5 },
  { id: 'platforms', name: 'Platforms', count: 4 }
];

const faqData = {
  general: [
    {
      question: "What is Prop Capitals?",
      answer: "Prop Capitals is a proprietary trading firm that provides talented traders with funded accounts to trade with. We handle all the risk while you keep up to 90% of the profits you generate."
    },
    {
      question: "How does the funding work?",
      answer: "After you pass our evaluation challenge (1-Step or 2-Step), you receive a funded account with our capital. You trade normally and we split the profits - you keep up to 90%, we keep 10%."
    },
    {
      question: "Is Prop Capitals legitimate?",
      answer: "Yes, Prop Capitals is a legitimate proprietary trading firm with thousands of funded traders worldwide. We have paid out over $15 million to our traders and have a 4.8 rating on Trustpilot."
    },
    {
      question: "What countries do you accept traders from?",
      answer: "We accept traders from most countries worldwide. However, due to regulatory restrictions, we cannot accept traders from certain jurisdictions. Please check our terms of service for the complete list."
    },
    {
      question: "Do I need trading experience?",
      answer: "While we don't require specific credentials, prop trading is suited for traders with a solid understanding of the markets and risk management. We provide free education with every challenge purchase to help you succeed."
    },
    {
      question: "What is the minimum age requirement?",
      answer: "You must be at least 18 years old to participate in our funding programs."
    },
    {
      question: "Can I have multiple accounts?",
      answer: "Yes, you can have multiple funded accounts with us. Many of our successful traders manage several accounts simultaneously to maximize their earning potential."
    },
    {
      question: "Is there a time limit to pass the challenge?",
      answer: "No! Unlike many other prop firms, we have no time limit on our challenges. Take as long as you need to hit your profit targets."
    }
  ],
  challenges: [
    {
      question: "What's the difference between 1-Step and 2-Step?",
      answer: "The 1-Step Challenge has one evaluation phase with a 10% profit target and offers an 85% profit split. The 2-Step Challenge has two phases (8% and 5% profit targets) but offers a higher 90% profit split."
    },
    {
      question: "What happens if I fail a challenge?",
      answer: "If you breach the rules during a challenge, you can retry with a new purchase. We offer discounts of up to 20% on retry accounts. Your trading data is saved for analysis to help you improve."
    },
    {
      question: "Is the challenge fee refundable?",
      answer: "Yes! We refund 100% of your challenge fee with your first payout once you become a funded trader. This effectively makes your evaluation free."
    },
    {
      question: "Can I upgrade my account size?",
      answer: "Yes, once funded, you can participate in our scaling program. Hit profit milestones and your account size can grow up to $5,000,000."
    },
    {
      question: "What account sizes are available?",
      answer: "We offer account sizes ranging from $5,000 to $200,000 for both 1-Step and 2-Step challenges. Choose the size that matches your trading style and risk tolerance."
    },
    {
      question: "Are there any minimum trading days?",
      answer: "No, there are no minimum trading days required. You can complete the challenge as quickly as your trading allows, though we encourage sustainable trading practices."
    }
  ],
  trading: [
    {
      question: "What trading strategies are allowed?",
      answer: "We allow all legitimate trading strategies including scalping, swing trading, day trading, and position trading. Expert Advisors (EAs) and automated trading are also permitted."
    },
    {
      question: "Can I trade during news events?",
      answer: "Yes, news trading is fully allowed on our platform. You can trade during high-impact economic events without restrictions."
    },
    {
      question: "Can I hold positions overnight?",
      answer: "Yes, overnight holding is allowed. You can also hold positions over weekends with no restrictions."
    },
    {
      question: "What is the daily drawdown limit?",
      answer: "The daily drawdown limit is 4% for 1-Step and 5% for 2-Step challenges. This is calculated based on your previous day's closing balance."
    },
    {
      question: "What is the maximum drawdown?",
      answer: "The maximum drawdown is 8% for 1-Step and 10% for 2-Step challenges. This is the maximum your account can decline from its highest point."
    },
    {
      question: "Can I use copy trading services?",
      answer: "Yes, copy trading is allowed. However, you must be the account owner and cannot share your account credentials with others."
    },
    {
      question: "What instruments can I trade?",
      answer: "You can trade Forex (50+ pairs), Metals (Gold, Silver), Indices (US30, NAS100, SPX500), and Cryptocurrencies (BTC, ETH). Over 100 instruments available."
    }
  ],
  payouts: [
    {
      question: "How fast are payouts processed?",
      answer: "Our average payout processing time is under 90 minutes - one of the fastest in the industry. Most payouts are completed within a few hours of request."
    },
    {
      question: "What is the minimum payout amount?",
      answer: "The minimum payout amount is $100. You can request payouts as often as you like once you meet this threshold."
    },
    {
      question: "What payout methods are available?",
      answer: "We support multiple payout methods including bank wire transfer, cryptocurrency (BTC, ETH, USDT), and popular e-wallets like Wise and Payoneer."
    },
    {
      question: "Is there a payout schedule?",
      answer: "No fixed schedule - you can request payouts anytime once you have profits. Many traders request weekly or bi-weekly payouts."
    },
    {
      question: "What is the profit split?",
      answer: "The profit split is 85% for 1-Step funded traders and 90% for 2-Step funded traders. You keep the majority of every dollar you make."
    }
  ],
  platforms: [
    {
      question: "What trading platforms do you offer?",
      answer: "We offer MetaTrader 5 (MT5), TradeLocker, MatchTrader, and cTrader. You can choose your preferred platform when starting your challenge."
    },
    {
      question: "Can I use Expert Advisors (EAs)?",
      answer: "Yes, EAs and automated trading systems are fully allowed on all our platforms. Use any strategy that works for you."
    },
    {
      question: "Is there a mobile trading app?",
      answer: "Yes, all our platforms have mobile apps available for iOS and Android, allowing you to trade on the go."
    },
    {
      question: "Can I change platforms after starting?",
      answer: "You can choose your platform when starting a new challenge or funded account. Contact support if you need to discuss platform changes for existing accounts."
    }
  ]
};

const FAQ = () => {
  const { isDark } = useTheme();
  const [activeCategory, setActiveCategory] = useState('general');
  const [openQuestion, setOpenQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = searchQuery
    ? Object.values(faqData).flat().filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqData[activeCategory];

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Hero Section */}
      <section className="py-12 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 left-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Support</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Frequently Asked <span className="text-amber-500">Questions</span>
            </h1>
            <p className={`text-base lg:text-lg max-w-2xl mx-auto mb-8 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Find answers to common questions about Prop Capitals funding programs, trading rules, and payouts.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
              <Input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-12 pr-4 py-4 rounded-xl focus:border-amber-500/50 ${
                  isDark 
                    ? 'bg-[#12161d] border-white/10 text-white placeholder:text-gray-500' 
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className={`py-12 lg:py-16 ${isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Tabs */}
          {!searchQuery && (
            <div className="flex flex-wrap justify-center gap-2 mb-10 overflow-x-auto pb-2">
              {faqCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setOpenQuestion(null);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeCategory === category.id
                      ? 'bg-amber-400 text-[#0a0d12]'
                      : isDark 
                        ? 'bg-[#12161d] text-gray-400 hover:text-white border border-white/10' 
                        : 'bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {category.name}
                  <span className={`ml-2 text-xs ${activeCategory === category.id ? 'text-[#0a0d12]/70' : isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    ({category.count})
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results Label */}
          {searchQuery && (
            <div className="mb-6">
              <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
                Found <span className="text-amber-500 font-semibold">{filteredFaqs.length}</span> results for "{searchQuery}"
              </p>
            </div>
          )}

          {/* FAQ Accordion */}
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className={`rounded-2xl border transition-all ${
                  openQuestion === index 
                    ? 'border-amber-500/30' 
                    : isDark ? 'border-white/10' : 'border-slate-200'
                } ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}
              >
                <button
                  onClick={() => setOpenQuestion(openQuestion === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className={`font-semibold pr-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-amber-500 flex-shrink-0 transition-transform ${
                    openQuestion === index ? 'rotate-180' : ''
                  }`} />
                </button>
                {openQuestion === index && (
                  <div className="px-6 pb-5">
                    <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className={`py-16 lg:py-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-3xl p-8 lg:p-12 border text-center ${
            isDark 
              ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117] border-white/10' 
              : 'bg-white border-slate-200'
          }`}>
            <h2 className={`text-2xl lg:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Still Have Questions?
            </h2>
            <p className={`mb-8 max-w-lg mx-auto ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              Our support team is available 24/7 to help you with any questions or concerns.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 py-6 h-auto font-bold w-full sm:w-auto">
                <MessageCircle className="w-5 h-5 mr-2" />
                Live Chat
              </Button>
              <Button variant="outline" className={`rounded-full px-8 py-6 h-auto font-medium w-full sm:w-auto ${
                isDark 
                  ? 'border-white/20 text-white hover:bg-white/5' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}>
                <Mail className="w-5 h-5 mr-2" />
                Email Support
              </Button>
            </div>
            <p className={`text-sm mt-6 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
              Average response time: <span className="text-emerald-400 font-semibold">Under 60 seconds</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
