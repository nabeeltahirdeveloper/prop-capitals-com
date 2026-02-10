import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, ExternalLink, Quote } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';


const trustpilotReviews = [
  {
    id: 1,
    name: "James Wilson",
    location: "United States",
    date: "2 days ago",
    rating: 5,
    title: "Best prop firm I've worked with",
    review: "The payout process is incredibly fast - received my funds in under 2 hours! The support team is responsive and the trading conditions are excellent. Highly recommend Prop Capitals to anyone serious about prop trading.",
    verified: true
  },
  {
    id: 2,
    name: "Sophie Martin",
    location: "United Kingdom",
    date: "5 days ago",
    rating: 5,
    title: "Exceeded all my expectations",
    review: "I've tried several prop firms before, but Prop Capitals stands out. The 90% profit split is amazing, and the fact that they refund the challenge fee on your first payout shows they truly believe in their traders.",
    verified: true
  },
  {
    id: 3,
    name: "Marco Rossi",
    location: "Italy",
    date: "1 week ago",
    rating: 5,
    title: "Professional and trustworthy",
    review: "From signup to my first payout, everything was smooth. The platform is easy to use, the rules are clear, and the support team actually helps when you need them. This is how prop trading should be!",
    verified: true
  },
  {
    id: 4,
    name: "Anna Kowalski",
    location: "Germany",
    date: "1 week ago",
    rating: 5,
    title: "Finally a reliable prop firm",
    review: "After being burned by other prop firms, I was skeptical. But Prop Capitals delivered exactly what they promised. Fast payouts, great conditions, and excellent customer service. Very impressed!",
    verified: true
  },
  {
    id: 5,
    name: "David Chen",
    location: "Singapore",
    date: "2 weeks ago",
    rating: 5,
    title: "Game changer for my trading career",
    review: "The free trading course included with the challenge was actually valuable - not just marketing fluff. Combined with their generous profit split and fast payouts, Prop Capitals is the real deal.",
    verified: true
  },
  {
    id: 6,
    name: "Lucas Silva",
    location: "Brazil",
    date: "2 weeks ago",
    rating: 4,
    title: "Great experience overall",
    review: "Very satisfied with my experience. The challenge was fair, the rules are reasonable, and I got my first payout within 90 minutes of requesting it. Would definitely recommend to other traders.",
    verified: true
  },
  {
    id: 7,
    name: "Yuki Tanaka",
    location: "Japan",
    date: "3 days ago",
    rating: 5,
    title: "Exceptional trading conditions",
    review: "The spreads are tight, execution is fast, and the PT5 platform is incredibly intuitive. I've scaled my account twice already. Prop Capitals is the real deal for serious traders.",
    verified: true
  },
  {
    id: 8,
    name: "Mohammed Al-Rashid",
    location: "UAE",
    date: "4 days ago",
    rating: 5,
    title: "Lightning fast payouts",
    review: "Requested my payout at 3 PM and had it in my account by 4 PM. Unbelievable speed! The support team is always helpful and the trading rules are fair and transparent.",
    verified: true
  },
  {
    id: 9,
    name: "Emma Thompson",
    location: "Australia",
    date: "1 week ago",
    rating: 5,
    title: "Best decision I've made",
    review: "Started with a $25K challenge and now trading a $100K funded account. The scaling plan is generous and the community is supportive. Couldn't ask for more!",
    verified: true
  },
  {
    id: 10,
    name: "Pierre Dubois",
    location: "France",
    date: "5 days ago",
    rating: 5,
    title: "Transparent and reliable",
    review: "No hidden rules, no tricks. Everything is clear from day one. The dashboard is clean and makes tracking progress easy. This is how prop trading should work.",
    verified: true
  },
  {
    id: 11,
    name: "Carlos Rodriguez",
    location: "Mexico",
    date: "6 days ago",
    rating: 5,
    title: "Life-changing opportunity",
    review: "From struggling retail trader to funded professional in 3 weeks. The education resources helped me refine my strategy. Now making consistent profits with their capital!",
    verified: true
  },
  {
    id: 12,
    name: "Olga Petrov",
    location: "Russia",
    date: "1 week ago",
    rating: 4,
    title: "Solid prop firm",
    review: "Great platform options including MT5 and the new PT5. Support responded to my ticket in under 10 minutes. The only reason for 4 stars is I wish they had more crypto pairs.",
    verified: true
  },
  {
    id: 13,
    name: "Henrik Johansson",
    location: "Sweden",
    date: "2 weeks ago",
    rating: 5,
    title: "Professional in every way",
    review: "The onboarding was smooth, the rules are straightforward, and the profit splits are industry-leading. Already recommended Prop Capitals to my trading group.",
    verified: true
  },
  {
    id: 14,
    name: "Priya Sharma",
    location: "India",
    date: "3 days ago",
    rating: 5,
    title: "Finally found the right firm",
    review: "After trying 3 other prop firms, I can confidently say Prop Capitals is the best. Fast payouts, excellent support, and they actually want you to succeed. 10/10!",
    verified: true
  }
];

const StarRating = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-5 h-5 ${star <= rating ? 'text-[#00b67a] fill-[#00b67a]' : 'text-gray-300 fill-gray-300'}`}
      />
    ))}
  </div>
);

const ReviewCard = ({ review }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 h-full flex flex-col">
    {/* Header */}
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
          {review.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{review.name}</p>
            {review.verified && (
              <span className="bg-[#00b67a]/10 text-[#00b67a] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Verified
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{review.location}</p>
        </div>
      </div>
      <span className="text-gray-400 text-xs">{review.date}</span>
    </div>

    {/* Rating */}
    <StarRating rating={review.rating} />

    {/* Review Content */}
    <h4 className="font-bold text-gray-900 mt-3 mb-2">{review.title}</h4>
    <p className="text-gray-600 text-sm leading-relaxed flex-1">{review.review}</p>

    {/* Footer */}
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
      <svg viewBox="0 0 126 31" className="h-5 w-auto">
        <path fill="#00b67a" d="M15.5 0L19.1 9.8H29.4L21.1 15.9L24.7 25.7L15.5 19.2L6.3 25.7L9.9 15.9L1.6 9.8H11.9L15.5 0Z"/>
        <path fill="#005128" d="M22.3 18.2L21.1 15.9L15.5 19.2L22.3 18.2Z"/>
      </svg>
      <span className="text-gray-500 text-xs">Posted on Trustpilot</span>
    </div>
  </div>
);

const TrustpilotSection = () => {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 3;
  const totalPages = Math.ceil(trustpilotReviews.length / reviewsPerPage);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalPages);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const visibleReviews = trustpilotReviews.slice(
    currentIndex * reviewsPerPage,
    (currentIndex + 1) * reviewsPerPage
  );

  return (
    <section className={`py-20 lg:py-32 transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-gradient-to-b from-white to-slate-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            {/* Trustpilot Logo */}
            <div className="bg-[#00b67a] px-4 py-2 rounded-lg flex items-center gap-2">
              <svg viewBox="0 0 126 31" className="h-6 w-auto">
                <path fill="white" d="M15.5 0L19.1 9.8H29.4L21.1 15.9L24.7 25.7L15.5 19.2L6.3 25.7L9.9 15.9L1.6 9.8H11.9L15.5 0Z"/>
              </svg>
              <span className="text-white font-bold">Trustpilot</span>
            </div>
          </div>
          
          {/* Rating Summary */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>4.8</span>
              <div className="flex flex-col items-start">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-6 h-6 text-[#00b67a] fill-[#00b67a]" />
                  ))}
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Based on 2,340+ reviews</span>
              </div>
            </div>
          </div>

          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Trusted by <span className="text-amber-500">Thousands</span> of Traders
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Don't just take our word for it. See what real traders are saying about their experience with Prop Capitals.
          </p>
        </div>

        {/* Reviews Grid - Desktop */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 mb-8">
          {visibleReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>

        {/* Reviews - Mobile (Single Card) */}
        <div className="md:hidden mb-8">
          <ReviewCard review={trustpilotReviews[currentIndex]} />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
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
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentIndex ? 'bg-amber-500 w-6' : isDark ? 'bg-white/20' : 'bg-slate-300'
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

        {/* View All Reviews Link */}
        <div className="text-center mt-8">
          <a
            href="#"
            className={`inline-flex items-center gap-2 font-semibold transition-colors ${
              isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'
            }`}
          >
            View all reviews on Trustpilot
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default TrustpilotSection;
