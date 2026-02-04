import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Wallet } from 'lucide-react';
// import { useTheme } from '../context/ThemeContext';

// Country flag components using SVG
const flags = {
  US: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="60" height="30" fill="#bf0a30"/>
      <rect y="2.31" width="60" height="2.31" fill="white"/>
      <rect y="6.92" width="60" height="2.31" fill="white"/>
      <rect y="11.54" width="60" height="2.31" fill="white"/>
      <rect y="16.15" width="60" height="2.31" fill="white"/>
      <rect y="20.77" width="60" height="2.31" fill="white"/>
      <rect y="25.38" width="60" height="2.31" fill="white"/>
      <rect width="24" height="16.15" fill="#002868"/>
    </svg>
  ),
  UK: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="60" height="30" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="white" strokeWidth="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
      <path d="M30,0 V30 M0,15 H60" stroke="white" strokeWidth="10"/>
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6"/>
    </svg>
  ),
  AE: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="60" height="10" fill="#00732f"/>
      <rect y="10" width="60" height="10" fill="white"/>
      <rect y="20" width="60" height="10" fill="black"/>
      <rect width="15" height="30" fill="#ff0000"/>
    </svg>
  ),
  BR: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="60" height="30" fill="#009c3b"/>
      <path d="M30,3 L55,15 L30,27 L5,15 Z" fill="#ffdf00"/>
      <circle cx="30" cy="15" r="8" fill="#002776"/>
    </svg>
  ),
  RU: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="60" height="10" fill="white"/>
      <rect y="10" width="60" height="10" fill="#0039a6"/>
      <rect y="20" width="60" height="10" fill="#d52b1e"/>
    </svg>
  ),
  ES: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="60" height="30" fill="#c60b1e"/>
      <rect y="7.5" width="60" height="15" fill="#ffc400"/>
    </svg>
  ),
  AU: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="60" height="30" fill="#00008b"/>
      <rect width="30" height="15" fill="#012169"/>
      <path d="M0,0 L30,15 M30,0 L0,15" stroke="white" strokeWidth="3"/>
      <path d="M0,0 L30,15 M30,0 L0,15" stroke="#C8102E" strokeWidth="2"/>
      <path d="M15,0 V15 M0,7.5 H30" stroke="white" strokeWidth="5"/>
      <path d="M15,0 V15 M0,7.5 H30" stroke="#C8102E" strokeWidth="3"/>
    </svg>
  ),
  FR: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="20" height="30" fill="#002395"/>
      <rect x="20" width="20" height="30" fill="white"/>
      <rect x="40" width="20" height="30" fill="#ed2939"/>
    </svg>
  ),
  DE: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="60" height="10" fill="black"/>
      <rect y="10" width="60" height="10" fill="#dd0000"/>
      <rect y="20" width="60" height="10" fill="#ffcc00"/>
    </svg>
  ),
  IT: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="20" height="30" fill="#009246"/>
      <rect x="20" width="20" height="30" fill="white"/>
      <rect x="40" width="20" height="30" fill="#ce2b37"/>
    </svg>
  ),
  SG: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="60" height="15" fill="#ed2939"/>
      <rect y="15" width="60" height="15" fill="white"/>
      <circle cx="12" cy="10" r="5" fill="white"/>
    </svg>
  ),
  IN: () => (
    <svg className="w-6 h-4 rounded-sm" viewBox="0 0 60 30">
      <rect width="60" height="10" fill="#ff9933"/>
      <rect y="10" width="60" height="10" fill="white"/>
      <rect y="20" width="60" height="10" fill="#138808"/>
      <circle cx="30" cy="15" r="4" fill="#000080" fillOpacity="0.8"/>
    </svg>
  )
};

const payoutCertificates = [
  { id: 1, name: "Michael T.", country: "US", amount: 31362.00, date: "Jan 2025" },
  { id: 2, name: "Sarah K.", country: "UK", amount: 10086.80, date: "Jan 2025" },
  { id: 3, name: "Ahmed R.", country: "AE", amount: 29260.20, date: "Dec 2024" },
  { id: 4, name: "Lucas M.", country: "BR", amount: 15554.00, date: "Jan 2025" },
  { id: 5, name: "Elena V.", country: "RU", amount: 45496.00, date: "Dec 2024" },
  { id: 6, name: "Carlos P.", country: "ES", amount: 42314.40, date: "Jan 2025" },
  { id: 7, name: "James W.", country: "AU", amount: 14818.90, date: "Jan 2025" },
  { id: 8, name: "Marie L.", country: "FR", amount: 33510.40, date: "Dec 2024" },
  { id: 9, name: "David H.", country: "DE", amount: 33576.25, date: "Jan 2025" },
  { id: 10, name: "Sofia R.", country: "IT", amount: 48727.10, date: "Dec 2024" },
  { id: 11, name: "Chen W.", country: "SG", amount: 22450.00, date: "Jan 2025" },
  { id: 12, name: "Raj P.", country: "IN", amount: 18920.50, date: "Jan 2025" }
];

const FlagIcon = ({ country }) => {
  const FlagComponent = flags[country];
  return FlagComponent ? <FlagComponent /> : null;
};

const PayoutCheck = ({ payout }) => {
  return (
    <div className="flex-shrink-0 w-[320px] mx-3">
      <div className="relative bg-gradient-to-br from-[#fefce8] to-[#fef9c3] rounded-lg overflow-hidden shadow-xl border-2 border-amber-200">
        {/* Check Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-amber-600 font-black text-xs">PC</span>
            </div>
            <div>
              <span className="text-white font-bold text-sm">PROP CAPITALS</span>
              <p className="text-amber-100 text-[10px]">Funded Trading</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-amber-100 text-[10px]">Check No.</span>
            <p className="text-white font-mono text-xs">#{String(payout.id).padStart(6, '0')}</p>
          </div>
        </div>

        {/* Check Body */}
        <div className="p-4">
          {/* Date */}
          <div className="flex justify-end mb-3">
            <div className="text-right">
              <span className="text-amber-700 text-[10px]">DATE</span>
              <p className="text-amber-900 font-semibold text-xs">{payout.date}</p>
            </div>
          </div>

          {/* Pay To */}
          <div className="mb-3">
            <span className="text-amber-700 text-[10px]">PAY TO THE ORDER OF</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                {payout.name.charAt(0)}
              </div>
              <div>
                <p className="text-amber-900 font-bold">{payout.name}</p>
                <div className="flex items-center gap-1.5">
                  <FlagIcon country={payout.country} />
                  <span className="text-amber-600 text-xs">{payout.country}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-white rounded-lg p-3 border-2 border-amber-300 mb-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-amber-600 text-xs font-medium">AMOUNT (USD)</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-amber-900 text-2xl font-black mt-1">
              ${payout.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Memo & Signature */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-amber-700 text-[10px]">MEMO</span>
              <p className="text-amber-800 text-xs">Trading Profit Payout</p>
            </div>
            <div className="text-right">
              <div className="border-t border-amber-400 pt-1 px-4">
                <span className="text-amber-600 text-[10px] italic">Authorized</span>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Badge */}
        <div className="absolute top-12 right-3 rotate-12">
          <div className="bg-emerald-500 text-white text-[8px] font-bold px-2 py-1 rounded shadow-lg">
            VERIFIED ✓
          </div>
        </div>
      </div>
    </div>
  );
};

const PayoutsSection = () => {
  // const { isDark } = useTheme();
  const isDark = true;
  const scrollRef1 = useRef(null);
  const scrollRef2 = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const row1Payouts = payoutCertificates.slice(0, 6);
  const row2Payouts = payoutCertificates.slice(6, 12);

  useEffect(() => {
    const scroll1 = scrollRef1.current;
    const scroll2 = scrollRef2.current;
    let animationId;
    let position1 = 0;
    let position2 = 0;

    const animate = () => {
      if (!isHovered) {
        position1 -= 0.5;
        position2 += 0.5;

        if (scroll1) {
          const maxScroll1 = scroll1.scrollWidth / 2;
          if (Math.abs(position1) >= maxScroll1) position1 = 0;
          scroll1.style.transform = `translateX(${position1}px)`;
        }

        if (scroll2) {
          const maxScroll2 = scroll2.scrollWidth / 2;
          if (position2 >= maxScroll2) position2 = 0;
          scroll2.style.transform = `translateX(${-position2}px)`;
        }
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => { if (animationId) cancelAnimationFrame(animationId); };
  }, [isHovered]);

  const duplicatedRow1 = [...row1Payouts, ...row1Payouts];
  const duplicatedRow2 = [...row2Payouts, ...row2Payouts];

  return (
    <section 
      className={`py-20 overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0a0d12]' : 'bg-white'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 ${
            isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
          }`}>
            <Wallet className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Real Trader Payouts</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Over <span className="text-amber-500">$15.2M+</span> Paid Out
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Every check represents a real trader who achieved their goals with Prop Capitals.
          </p>
        </div>
      </div>

      {/* Row 1 */}
      <div className="mb-8 overflow-hidden">
        <div ref={scrollRef1} className="flex py-2" style={{ width: 'fit-content' }}>
          {duplicatedRow1.map((payout, index) => (
            <PayoutCheck key={`row1-${index}`} payout={payout} />
          ))}
        </div>
      </div>

      {/* Row 2 */}
      <div className="overflow-hidden">
        <div ref={scrollRef2} className="flex py-2" style={{ width: 'fit-content' }}>
          {duplicatedRow2.map((payout, index) => (
            <PayoutCheck key={`row2-${index}`} payout={payout} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PayoutsSection;
