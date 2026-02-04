import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { faqData } from './data/mockData';
import { HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';


const FAQSection = () => {
  const { isDark } = useTheme();

  return (
    <section className={`py-20 lg:py-32 transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-b from-[#0d1117] to-[#0a0d12]' : 'bg-gradient-to-b from-slate-50 to-white'
    }`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Support</span>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Frequently Asked <span className="text-amber-500">Questions</span>
          </h2>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Everything you need to know about Prop Capitals funding programs.
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {faqData.map((faq, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className={`rounded-2xl border px-6 transition-all ${
                isDark 
                  ? 'bg-[#12161d] border-white/10 data-[state=open]:border-amber-500/30' 
                  : 'bg-white border-slate-200 shadow-sm data-[state=open]:border-amber-300 data-[state=open]:shadow-md'
              }`}
            >
              <AccordionTrigger className={`text-left py-5 hover:no-underline font-semibold ${
                isDark ? 'text-white hover:text-amber-400' : 'text-slate-900 hover:text-amber-600'
              }`}>
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  {faq.question}
                </div>
              </AccordionTrigger>
              <AccordionContent className={`pb-5 pl-8 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Contact Support */}
        <div className="mt-12 text-center">
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Still have questions?</p>
          <Link to="/contact" className={`font-semibold hover:underline ${
            isDark ? 'text-amber-400' : 'text-amber-600'
          }`}>
            Contact our 24/7 support team
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
