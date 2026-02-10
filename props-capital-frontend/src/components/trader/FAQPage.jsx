import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Search,
  DollarSign,
  Shield,
  Clock,
  TrendingUp,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';

const FAQPage = () => {
  const { isDark } = useTraderTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Questions', icon: HelpCircle },
    { id: 'challenges', label: 'Challenges', icon: TrendingUp },
    { id: 'rules', label: 'Trading Rules', icon: Shield },
    { id: 'payouts', label: 'Payouts', icon: DollarSign },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const faqs = [
    {
      id: 1,
      category: 'challenges',
      question: 'What is the difference between 1-Step and 2-Step challenges?',
      answer: 'The 1-Step challenge requires you to hit a single profit target (typically 10%) to get funded. The 2-Step challenge has two phases with lower profit targets (8% and 5%) but is generally considered less risky. Both have the same drawdown rules.'
    },
    {
      id: 2,
      category: 'challenges',
      question: 'How long do I have to complete a challenge?',
      answer: 'There is no time limit to complete our challenges. Take as much time as you need to reach your profit target while following the trading rules. The only requirement is to complete the minimum trading days.'
    },
    {
      id: 3,
      category: 'rules',
      question: 'What happens if I break the daily loss limit?',
      answer: 'If your daily loss exceeds 5% of your starting balance for that day, your challenge will be marked as failed. This is a hard breach and cannot be reversed. We recommend using stop losses and monitoring your daily P/L closely.'
    },
    {
      id: 4,
      category: 'rules',
      question: 'Can I trade during news events?',
      answer: 'Yes, news trading is allowed on all our challenge types. However, we recommend being cautious as spreads can widen significantly during high-impact news events, which could affect your positions.'
    },
    {
      id: 5,
      category: 'rules',
      question: 'Is weekend holding allowed?',
      answer: 'No, holding positions over the weekend is not allowed. All positions must be closed before the market closes on Friday. Positions left open will be automatically closed and may result in slippage.'
    },
    {
      id: 6,
      category: 'payouts',
      question: 'How do I request a payout?',
      answer: 'Once you have profits in your funded account and have completed the minimum trading days, you can request a payout from the "Payout History" section. Payouts are processed within 24-48 hours to your preferred payment method.'
    },
    {
      id: 7,
      category: 'payouts',
      question: 'What is the profit split?',
      answer: 'Our profit split starts at 80% for traders and goes up to 90% based on your performance. This means you keep 80-90% of all profits made on your funded account.'
    },
    {
      id: 8,
      category: 'payouts',
      question: 'What payment methods are available for payouts?',
      answer: 'We support multiple payment methods including bank transfer, crypto (USDT, BTC, ETH), and various e-wallets. You can set your preferred payment method in your account settings.'
    },
    {
      id: 9,
      category: 'billing',
      question: 'What happens if I fail a challenge?',
      answer: 'If you fail a challenge, you can purchase a new one at a discounted rate. We also offer a free retry for traders who fail within the first 14 days without breaking any hard rules.'
    },
    {
      id: 10,
      category: 'billing',
      question: 'Do you offer refunds?',
      answer: 'We offer a 14-day refund policy for challenges that have not been started (no trades placed). Once you start trading, the challenge fee is non-refundable. Please refer to our refund policy for full details.'
    },
  ];

  const toggleItem = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6" data-testid="faq-page">
      {/* Header */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-6 h-6 text-amber-500" />
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Frequently Asked Questions</h1>
        </div>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          Find answers to common questions about challenges, trading rules, and payouts.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className={`w-full pl-12 pr-4 py-3 rounded-xl border transition-all ${isDark
                ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:border-amber-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
              } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${activeCategory === cat.id
                ? 'bg-amber-500 text-[#0a0d12]'
                : isDark
                  ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
          >
            <cat.icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
            <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-slate-300'}`} />
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>No results found</h3>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
              Try adjusting your search or category filter.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className={`rounded-2xl border overflow-hidden transition-all ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'
                }`}
            >
              <button
                onClick={() => toggleItem(faq.id)}
                className={`w-full flex items-center justify-between p-5 text-left transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-start gap-3 pr-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${faq.category === 'challenges' ? 'bg-blue-500/10 text-blue-500' :
                      faq.category === 'rules' ? 'bg-purple-500/10 text-purple-500' :
                        faq.category === 'payouts' ? 'bg-emerald-500/10 text-emerald-500' :
                          'bg-amber-500/10 text-amber-500'
                    }`}>
                    {faq.category.charAt(0).toUpperCase() + faq.category.slice(1)}
                  </span>
                  <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {faq.question}
                  </span>
                </div>
                {expandedItems[faq.id] ? (
                  <ChevronUp className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                ) : (
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
                )}
              </button>
              {expandedItems[faq.id] && (
                <div className={`px-5 pb-5 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                  <div className={`pt-4 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Still Need Help */}
      <div className={`rounded-2xl border p-6 text-center ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Still have questions?</h3>
        <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          Cannot find what you are looking for? Our support team is here to help.
        </p>
        <a
          href="/trader-panel/support"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] font-bold rounded-xl transition-all"
        >
          Contact Support
        </a>
      </div>
    </div>
  );
};

export default FAQPage;
