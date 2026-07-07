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
import { Link } from 'react-router-dom';
import { useTraderTheme } from './TraderPanelLayout';
import { useTranslation } from '@/contexts/LanguageContext';

const FAQPage = () => {
  const { isDark } = useTraderTheme();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: t('traderFaq.categories.all'), icon: HelpCircle },
    { id: 'challenges', label: t('traderFaq.categories.challenges'), icon: TrendingUp },
    { id: 'rules', label: t('traderFaq.categories.rules'), icon: Shield },
    { id: 'payouts', label: t('traderFaq.categories.payouts'), icon: DollarSign },
    { id: 'billing', label: t('traderFaq.categories.billing'), icon: CreditCard },
  ];

  const categoryBadges = {
    challenges: t('traderFaq.badges.challenges'),
    rules: t('traderFaq.badges.rules'),
    payouts: t('traderFaq.badges.payouts'),
    billing: t('traderFaq.badges.billing'),
  };

  const faqContent = t('traderFaq.faqs', { returnObjects: true });

  const faqs = [
    {
      id: 1,
      category: 'challenges',
      question: faqContent[0]?.question,
      answer: faqContent[0]?.answer
    },
    {
      id: 2,
      category: 'challenges',
      question: faqContent[1]?.question,
      answer: faqContent[1]?.answer
    },
    {
      id: 3,
      category: 'rules',
      question: faqContent[2]?.question,
      answer: faqContent[2]?.answer
    },
    {
      id: 4,
      category: 'rules',
      question: faqContent[3]?.question,
      answer: faqContent[3]?.answer
    },
    {
      id: 5,
      category: 'rules',
      question: faqContent[4]?.question,
      answer: faqContent[4]?.answer
    },
    {
      id: 6,
      category: 'payouts',
      question: faqContent[5]?.question,
      answer: faqContent[5]?.answer
    },
    {
      id: 7,
      category: 'payouts',
      question: faqContent[6]?.question,
      answer: faqContent[6]?.answer
    },
    {
      id: 8,
      category: 'payouts',
      question: faqContent[7]?.question,
      answer: faqContent[7]?.answer
    },
    {
      id: 9,
      category: 'billing',
      question: faqContent[8]?.question,
      answer: faqContent[8]?.answer
    },
    {
      id: 10,
      category: 'billing',
      question: faqContent[9]?.question,
      answer: faqContent[9]?.answer
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
    const query = searchQuery.toLowerCase();
    const matchesSearch = (faq.question || '').toLowerCase().includes(query) ||
      (faq.answer || '').toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6" data-testid="faq-page">
      {/* Header */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <HelpCircle className="w-6 h-6 text-amber-500" />
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('traderFaq.title')}</h1>
        </div>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          {t('traderFaq.subtitle')}
        </p>

        {/* Search */}
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('traderFaq.searchPlaceholder')}
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
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${activeCategory === cat.id
                ? 'bg-amber-500 text-[#0a0d12]'
                : isDark
                  ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
          >
            <cat.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {filteredFaqs.length === 0 ? (
          <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
            <AlertTriangle className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-slate-300'}`} />
            <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('traderFaq.noResultsTitle')}</h3>
            <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
              {t('traderFaq.noResultsDescription')}
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
                    {categoryBadges[faq.category]}
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
        <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('traderFaq.stillHaveQuestionsTitle')}</h3>
        <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          {t('traderFaq.stillHaveQuestionsDescription')}
        </p>
        <Link
          to="/traderdashboard/support"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] font-bold rounded-xl transition-all"
        >
          {t('traderFaq.contactSupport')}
        </Link>
      </div>
    </div>
  );
};

export default FAQPage;
