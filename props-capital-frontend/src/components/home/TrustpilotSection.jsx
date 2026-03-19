import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, ExternalLink, Quote } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';


const trustpilotReviews = [
  {
    id: 1,
    name: "James Wilson",
    location: "United Kingdom",
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
    location: "Netherlands",
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

const PartialStarRating = ({ rating, size = 24 }) => {
  const gap = 4;
  const totalWidth = size * 5 + gap * 4;
  const r = size / 2;
  const outerR = r * 0.9;
  const innerR = r * 0.38;

  const getStarPath = (offsetX) => {
    const cx = offsetX + r;
    const cy = r;
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const radius = i % 2 === 0 ? outerR : innerR;
      pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
    }
    return `M${pts.join('L')}Z`;
  };

  return (
    <svg width={totalWidth} height={size} viewBox={`0 0 ${totalWidth} ${size}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {[0, 1, 2, 3, 4].map((i) => {
          const x = i * (size + gap);
          const fillWidth = size * Math.min(1, Math.max(0, rating - i));
          return (
            <clipPath key={i} id={`tp-clip-${i}`}>
              <rect x={x} y={0} width={fillWidth} height={size} />
            </clipPath>
          );
        })}
      </defs>
      {[0, 1, 2, 3, 4].map((i) => {
        const x = i * (size + gap);
        const d = getStarPath(x);
        return (
          <g key={i}>
            <path d={d} fill="#d1d5db" />
            <path d={d} fill="#00b67a" clipPath={`url(#tp-clip-${i})`} />
          </g>
        );
      })}
    </svg>
  );
};

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
            <svg viewBox="0 0 140 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8 w-auto">
              <path d="M36.785 11.97h14.173v2.597h-5.572v14.602H42.32V14.567h-5.548v-2.598h.012zm13.568 4.745h2.62v2.404h.049c.087-.34.247-.668.482-.984a4.57 4.57 0 0 1 1.965-1.517 3.456 3.456 0 0 1 1.248-.243c.32 0 .556.012.68.025.123.012.246.036.382.048v2.646a9.09 9.09 0 0 0-.605-.085 5.198 5.198 0 0 0-.606-.036c-.47 0-.914.097-1.334.28-.42.181-.779.46-1.087.813a4.107 4.107 0 0 0-.742 1.335c-.185.534-.272 1.14-.272 1.833v5.923h-2.792V16.715h.012zM70.618 29.17h-2.743v-1.736h-.05c-.346.632-.852 1.13-1.532 1.506-.68.376-1.372.57-2.076.57-1.668 0-2.88-.4-3.62-1.214-.742-.813-1.113-2.039-1.113-3.678v-7.902h2.793v7.635c0 1.093.21 1.87.643 2.319.42.449 1.025.68 1.791.68.593 0 1.075-.085 1.47-.268.396-.182.717-.412.952-.716.247-.291.42-.655.532-1.068.11-.413.16-.862.16-1.347v-7.223h2.793V29.17zm4.757-3.993c.087.8.395 1.36.927 1.687.543.316 1.186.486 1.94.486.26 0 .556-.025.89-.061.333-.037.654-.122.939-.23.296-.11.53-.28.728-.498.186-.22.272-.498.26-.85a1.163 1.163 0 0 0-.395-.862c-.248-.23-.556-.4-.94-.546a9.56 9.56 0 0 0-1.31-.352c-.494-.097-.988-.207-1.494-.316a14.42 14.42 0 0 1-1.508-.413 4.632 4.632 0 0 1-1.297-.655 2.898 2.898 0 0 1-.915-1.044c-.234-.425-.346-.947-.346-1.578 0-.68.173-1.238.507-1.7a3.821 3.821 0 0 1 1.273-1.104 5.973 5.973 0 0 1 1.717-.595c.63-.109 1.236-.17 1.804-.17.655 0 1.285.073 1.879.207a4.885 4.885 0 0 1 1.618.667c.482.304.877.704 1.199 1.19.321.485.519 1.08.605 1.772H80.54c-.136-.655-.433-1.104-.914-1.323-.482-.23-1.038-.34-1.656-.34-.198 0-.433.012-.704.049a3.918 3.918 0 0 0-.767.182 1.666 1.666 0 0 0-.605.388.93.93 0 0 0-.247.668c0 .34.123.607.358.813.235.206.544.376.927.522.383.134.816.255 1.31.352.494.097 1 .206 1.52.316.506.109 1 .255 1.495.412.494.158.926.377 1.31.656.383.279.692.619.926 1.032.235.412.359.934.359 1.541 0 .74-.173 1.36-.52 1.882-.345.51-.79.934-1.334 1.25a6.34 6.34 0 0 1-1.829.704 9.334 9.334 0 0 1-1.99.218 8.585 8.585 0 0 1-2.223-.267c-.68-.182-1.273-.449-1.767-.8a3.99 3.99 0 0 1-1.174-1.348c-.284-.534-.433-1.178-.457-1.918h2.817v-.024zm9.218-8.46h2.113v-3.74h2.793v3.74h2.52v2.05H89.5v6.653c0 .29.012.534.037.752.024.207.086.389.173.534a.79.79 0 0 0 .407.328c.186.073.42.11.742.11.197 0 .395 0 .593-.013.198-.012.395-.036.593-.085v2.124c-.309.037-.618.061-.902.097a7.355 7.355 0 0 1-.902.049c-.741 0-1.334-.073-1.78-.206-.444-.134-.803-.34-1.05-.607-.26-.267-.42-.595-.519-.996a7.342 7.342 0 0 1-.16-1.371V18.79h-2.113v-2.076h-.025zm9.403 0h2.645v1.686h.05c.394-.728.938-1.238 1.642-1.553a5.499 5.499 0 0 1 2.287-.474c1 0 1.865.17 2.607.522.741.34 1.359.814 1.853 1.42.494.607.853 1.311 1.1 2.113a8.71 8.71 0 0 1 .371 2.573c0 .837-.111 1.65-.334 2.428a6.436 6.436 0 0 1-1.001 2.087 4.89 4.89 0 0 1-1.705 1.445c-.692.364-1.495.546-2.434.546a6.95 6.95 0 0 1-1.224-.11 5.455 5.455 0 0 1-1.173-.351 4.254 4.254 0 0 1-1.039-.62 3.871 3.871 0 0 1-.803-.873h-.05v6.215h-2.792V16.715zm9.762 6.238a6.11 6.11 0 0 0-.222-1.638 4.391 4.391 0 0 0-.668-1.408 3.374 3.374 0 0 0-1.099-.984 3.129 3.129 0 0 0-1.52-.376c-1.174 0-2.064.4-2.657 1.202-.593.801-.89 1.87-.89 3.204 0 .631.075 1.214.235 1.748.16.534.383.996.704 1.384.31.389.68.692 1.113.91.432.231.939.34 1.507.34.643 0 1.174-.133 1.619-.388a3.389 3.389 0 0 0 1.087-.995c.284-.413.495-.875.618-1.396a7.683 7.683 0 0 0 .173-1.603zm4.93-10.985h2.793v2.598h-2.793v-2.598zm0 4.746h2.793V29.17h-2.793V16.715zm5.289-4.746h2.793v17.2h-2.793v-17.2zm11.356 17.54c-1.014 0-1.916-.17-2.706-.497a5.977 5.977 0 0 1-2.014-1.36 5.908 5.908 0 0 1-1.249-2.076 7.888 7.888 0 0 1-.432-2.646c0-.947.148-1.82.432-2.622a5.91 5.91 0 0 1 1.249-2.075c.543-.583 1.223-1.032 2.014-1.36.79-.328 1.692-.498 2.706-.498 1.013 0 1.915.17 2.706.498.791.328 1.458.79 2.014 1.36a5.893 5.893 0 0 1 1.248 2.075c.284.801.432 1.675.432 2.622 0 .96-.148 1.845-.432 2.646a5.891 5.891 0 0 1-1.248 2.076c-.544.583-1.223 1.032-2.014 1.36-.791.327-1.693.497-2.706.497zm0-2.173c.618 0 1.161-.133 1.618-.388a3.42 3.42 0 0 0 1.125-1.008c.296-.412.506-.886.655-1.408.136-.522.21-1.056.21-1.602 0-.534-.074-1.056-.21-1.59a4.13 4.13 0 0 0-.655-1.408 3.386 3.386 0 0 0-1.125-.995c-.457-.255-1-.389-1.618-.389-.618 0-1.162.134-1.619.389a3.52 3.52 0 0 0-1.124.995 4.347 4.347 0 0 0-.655 1.408 6.387 6.387 0 0 0-.211 1.59c0 .546.075 1.08.211 1.602s.358.996.655 1.408c.296.413.667.753 1.124 1.008.457.267 1.001.388 1.619.388zm7.216-10.62h2.113v-3.74h2.793v3.74h2.52v2.05h-2.52v6.653c0 .29.012.534.036.752.025.207.087.389.174.534a.787.787 0 0 0 .407.328c.186.073.42.11.742.11.197 0 .395 0 .593-.013.198-.012.395-.036.593-.085v2.124c-.309.037-.618.061-.902.097a7.359 7.359 0 0 1-.902.049c-.741 0-1.335-.073-1.78-.206-.444-.134-.803-.34-1.05-.607-.259-.267-.42-.595-.519-.996a7.37 7.37 0 0 1-.16-1.371V18.79h-2.113v-2.076h-.025z" fill="#fff"/>
              <path d="M33.523 11.969H20.722L16.768 0 12.8 11.97 0 11.957l10.367 7.404-3.966 11.956 10.367-7.392 10.355 7.392-3.954-11.956 10.354-7.392z" fill="#04DA8D"/>
              <path d="m24.058 22.069-.89-2.707-6.4 4.564 7.29-1.857z" fill="#126849"/>
            </svg>
          </div>
          
          {/* Rating Summary */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>4.8</span>
              <div className="flex flex-col items-start">
                <PartialStarRating rating={4.8} size={24} />
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

        
      </div>
    </section>
  );
};

export default TrustpilotSection;
