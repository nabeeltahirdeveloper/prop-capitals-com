import React, { useState } from 'react';
import { ChevronDown, Search, MessageCircle, Mail, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useChatSupportStore } from '@/lib/stores/chat-support.store';

const FAQ = () => {
  const { isDark } = useTheme();
  const { cur } = useCurrency();
  const { t } = useTranslation();
  const openChat = useChatSupportStore((state) => state.openChat);
  const [activeCategory, setActiveCategory] = useState('general');
  const [openQuestion, setOpenQuestion] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    { id: 'general', name: t('faqPage.categories.general'), count: 8 },
    { id: 'challenges', name: t('faqPage.categories.challenges'), count: 6 },
    { id: 'trading', name: t('faqPage.categories.trading'), count: 7 },
    { id: 'payouts', name: t('faqPage.categories.payouts'), count: 5 },
    { id: 'platforms', name: t('faqPage.categories.platforms'), count: 4 }
  ];

  const faqData = {
    general: t('faqPage.questions.general', { returnObjects: true }),
    challenges: t('faqPage.questions.challenges', { returnObjects: true }),
    trading: t('faqPage.questions.trading', { returnObjects: true }),
    payouts: t('faqPage.questions.payouts', { returnObjects: true }),
    platforms: t('faqPage.questions.platforms', { returnObjects: true })
  };

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
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('faqPage.eyebrow')}</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('faqPage.titleLine1')} <span className="text-amber-500">{t('faqPage.titleHighlight')}</span>
            </h1>
            <p className={`text-base lg:text-lg max-w-2xl mx-auto mb-8 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              {t('faqPage.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-400' : 'text-slate-400'}`} />
              <Input
                type="text"
                placeholder={t('faqPage.searchPlaceholder')}
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
                {t('faqPage.searchResultsPrefix')} <span className="text-amber-500 font-semibold">{filteredFaqs.length}</span> {t('faqPage.searchResultsSuffix', { query: searchQuery })}
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
                  <span className={`font-semibold pr-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>{cur(faq.question)}</span>
                  <ChevronDown className={`w-5 h-5 text-amber-500 flex-shrink-0 transition-transform ${
                    openQuestion === index ? 'rotate-180' : ''
                  }`} />
                </button>
                {openQuestion === index && (
                  <div className="px-6 pb-5">
                    <p className={`leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{cur(faq.answer)}</p>
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
              {t('faqPage.contact.title')}
            </h2>
            <p className={`mb-8 max-w-lg mx-auto ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              {t('faqPage.contact.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={openChat}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 py-6 h-auto font-bold w-full sm:w-auto"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {t('faqPage.contact.liveChat')}
              </Button>
                <Button 
                onClick={() => window.location.href = '/contact'}
                  variant="outline" className={`rounded-full px-8 py-6 h-auto font-medium w-full sm:w-auto ${
                  isDark
                    ? 'border-white/20 text-white hover:bg-white/5'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}>
                  <Send className="w-5 h-5 mr-2" />
                  {t('faqPage.contact.contactForm')}
                </Button>
              
              <a href="mailto:support@prop-capitals.com">
                <Button 
                  onClick={() => window.location.href = '/contact'}
                  variant="outline" className={`rounded-full px-8 py-6 h-auto font-medium w-full sm:w-auto ${
                  isDark
                    ? 'border-white/20 text-white hover:bg-white/5'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}>
                  <Mail className="w-5 h-5 mr-2" />
                  {t('faqPage.contact.emailSupport')}
                </Button>
              </a>
            </div>
            <p className={`text-sm mt-6 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
              {t('faqPage.contact.responseTimeLabel')} <span className="text-emerald-400 font-semibold">{t('faqPage.contact.responseTimeValue')}</span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
