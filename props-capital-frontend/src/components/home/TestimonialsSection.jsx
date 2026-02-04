import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { testimonials } from './data/mockData.js';
import { useTheme } from '@/contexts/ThemeContext';


const TestimonialsSection = () => {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className={`py-20 lg:py-32 transition-colors duration-300 ${isDark ? 'bg-[#0a0d12]' : 'bg-white'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Testimonials</span>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Hear From Our <span className="text-amber-500">Traders</span>
          </h2>
        </div>

        <div className={`rounded-3xl p-8 lg:p-12 border relative overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117] border-white/10' 
            : 'bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-xl'
        }`}>
          {/* Background Glow */}
          <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl ${
            isDark ? 'bg-amber-500/10' : 'bg-amber-400/20'
          }`}></div>
          
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
            {/* Text Content */}
            <div>
              <Quote className={`w-12 h-12 mb-4 ${isDark ? 'text-amber-400/30' : 'text-amber-400/50'}`} />
              
              <blockquote className={`text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-6 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                "
                {currentTestimonial.quote.split(currentTestimonial.highlight).map((part, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-amber-500">{currentTestimonial.highlight}</span>}
                    {part}
                  </React.Fragment>
                ))}
                "
              </blockquote>

              <div className="flex items-center gap-4">
                <img 
                  src={currentTestimonial.avatar}
                  alt={currentTestimonial.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-amber-400"
                />
                <div>
                  <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {currentTestimonial.name}
                  </p>
                  <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
                    Funded Trader • {currentTestimonial.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Image Grid */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img 
                    src={currentTestimonial.avatar}
                    alt=""
                    className="w-full aspect-square object-cover rounded-2xl"
                  />
                  <div className={`rounded-2xl p-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-white border border-amber-100'}`}>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      {currentTestimonial.rating}
                    </p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className={`rounded-2xl p-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-white border border-amber-100'}`}>
                    <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Payout</p>
                    <p className="text-emerald-500 font-bold text-xl">{currentTestimonial.payout}</p>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=400&fit=crop"
                    alt=""
                    className="w-full aspect-[4/3] object-cover rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prevSlide}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex 
                      ? 'bg-amber-500 w-6' 
                      : isDark ? 'bg-white/20' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                isDark 
                  ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
