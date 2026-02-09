// Enhanced Mock data for Prop Capitals website

export const payoutCertificates = [
  {
    id: 1,
    name: "Michael T.",
    country: "US",
    amount: 31362.0,
    date: "Jan 2025",
  },
  { id: 2, name: "Sarah K.", country: "UK", amount: 10086.8, date: "Jan 2025" },
  { id: 3, name: "Ahmed R.", country: "AE", amount: 29260.2, date: "Dec 2024" },
  { id: 4, name: "Lucas M.", country: "BR", amount: 15554.0, date: "Jan 2025" },
  { id: 5, name: "Elena V.", country: "RU", amount: 45496.0, date: "Dec 2024" },
  {
    id: 6,
    name: "Carlos P.",
    country: "ES",
    amount: 42314.4,
    date: "Jan 2025",
  },
  { id: 7, name: "James W.", country: "AU", amount: 14818.9, date: "Jan 2025" },
  { id: 8, name: "Marie L.", country: "FR", amount: 33510.4, date: "Dec 2024" },
  {
    id: 9,
    name: "David H.",
    country: "DE",
    amount: 33576.25,
    date: "Jan 2025",
  },
  {
    id: 10,
    name: "Sofia R.",
    country: "IT",
    amount: 48727.1,
    date: "Dec 2024",
  },
  { id: 11, name: "Chen W.", country: "SG", amount: 22450.0, date: "Jan 2025" },
  { id: 12, name: "Raj P.", country: "IN", amount: 18920.5, date: "Jan 2025" },
];

export const testimonials = [
  {
    id: 1,
    name: "Derex",
    country: "US",
    quote:
      "I just want to express my gratitude to Prop Capitals for being such an outstanding firm!",
    highlight: "outstanding firm",
    tag: "Outstanding Firm",
    avatarVideo: "/assets/videos/video1.mp4",
    avatar: "/assets/images/img2.png",
    promoVideo: "/assets/videos/video1.mp4",
    rating: "4.9/5.0 Rating",
    payout: "$1,450.00",
  },
  {
    id: 2,
    name: "Chad Johnson",
    country: "US",
    quote:
      "The fastest payout I've ever received! Prop Capitals truly cares about their traders.",
    highlight: "fastest payout",
    tag: "Fastest Payout",

    avatarVideo: "/assets/videos/video2.mp4",
    avatar: "/assets/images/img4.png",
    promoVideo: "/assets/videos/video2.mp4",
    rating: "5.0/5.0 Rating",
    payout: "$3,500.00",
  },
  {
    id: 3,
    name: "Josh",
    country: "Canada",
    quote:
      "Incredible support team and amazing trading conditions. Best prop firm hands down!",
    highlight: "Best prop firm",
    tag: "Best Conditions",
    avatar: "/assets/images/img3.png",

    avatarVideo: "/assets/videos/video3.mp4",
    promoVideo: "/assets/videos/video3.mp4",
    rating: "4.8/5.0 Rating",
    payout: "$1,944.00",
  },
  {
    id: 4,
    name: "Nova",
    country: "US",
    quote:
      "From $25K to $200K funded account. Prop Capitals changed my trading career completely!",
    highlight: "changed my trading career",
    tag: "Career Changer",
    avatar: "/assets/images/img1.png",

    avatarVideo: "/assets/videos/video4.mp4",
    promoVideo: "/assets/videos/video4.mp4",
    rating: "4.9/5.0 Rating",
    payout: "$933.00",
  },
];

export const comparisonData = [
  {
    feature: "Evaluation Process",
    others: "Complex multi-phase",
    propCapitals: "Simple 1 or 2 Step Challenge",
    highlight: true,
  },
  {
    feature: "Payout Times",
    others: "5-7+ Days",
    propCapitals: "Less than 90 Minutes",
    highlight: true,
  },
  {
    feature: "Support",
    others: "Email Only",
    propCapitals: "24/7 Live Chat & Email",
    highlight: false,
  },
  {
    feature: "Support Response",
    others: "Up to 7 Days",
    propCapitals: "Under 60 Seconds Avg",
    highlight: true,
  },
  {
    feature: "Trading Education",
    others: "Not Included",
    propCapitals: "Free Course Included",
    highlight: false,
  },
  {
    feature: "Profit Split",
    others: "70-80%",
    propCapitals: "Up to 90%",
    highlight: true,
  },
  {
    feature: "News Trading",
    others: "Restricted",
    propCapitals: "Fully Allowed",
    highlight: false,
  },
  {
    feature: "Weekend Holding",
    others: "Not Allowed",
    propCapitals: "Fully Allowed",
    highlight: false,
  },
  {
    feature: "Challenge Fee Refund",
    others: "Rarely Offered",
    propCapitals: "100% Refund on 1st Payout",
    highlight: true,
  },
];

export const challengeTypes = [
  {
    id: "one-step",
    name: "1-Step Challenge",
    badge: "Most Popular",
    description:
      "Quick evaluation with achievable targets and best value for traders",
    phases: 1,
    profitTarget: "10%",
    dailyDrawdown: "4%",
    maxDrawdown: "8%",
    profitSplit: "85%",
    leverage: "1:30",
    popular: true,
    prices: {
      "5K": 55,
      "10K": 99,
      "25K": 189,
      "50K": 299,
      "100K": 499,
      "200K": 949,
    },
  },
  {
    id: "two-step",
    name: "2-Step Challenge",
    badge: "Best Split",
    description:
      "Traditional evaluation with highest profit split potential up to 90%",
    phases: 2,
    profitTarget: "8% / 5%",
    dailyDrawdown: "5%",
    maxDrawdown: "10%",
    profitSplit: "90%",
    leverage: "1:50",
    popular: false,
    prices: {
      "5K": 45,
      "10K": 79,
      "25K": 159,
      "50K": 249,
      "100K": 449,
      "200K": 849,
    },
  },
];

export const accountSizes = [
  { value: 5000, label: "$5K", key: "5K" },
  { value: 10000, label: "$10K", key: "10K" },
  { value: 25000, label: "$25K", key: "25K" },
  { value: 50000, label: "$50K", key: "50K" },
  { value: 100000, label: "$100K", key: "100K" },
  { value: 200000, label: "$200K", key: "200K" },
];

export const tradingPlatforms = [
  {
    name: "MetaTrader 5",
    logo: "MT5",
    description:
      "Industry-standard platform with powerful charting and automated trading capabilities.",
    features: ["Expert Advisors", "Advanced Charts", "Mobile App"],
    color: "#6366f1",
  },
  {
    name: "TradeLocker",
    logo: "TL",
    description:
      "Modern platform with TradingView integration for seamless chart analysis.",
    features: ["TradingView Charts", "Web-Based", "One-Click Trading"],
    color: "#f59e0b",
  },
  {
    name: "MatchTrader",
    logo: "MT",
    description:
      "Modern trading platform available on the web and in our mobile apps.",
    features: ["Web & Mobile", "Social Trading", "Copy Trading"],
    color: "#10b981",
  },
  {
    name: "cTrader",
    logo: "cT",
    description:
      "Combines a user-friendly interface with professional trading features.",
    features: ["cAlgo Bots", "Level II Pricing", "cTrader Copy"],
    color: "#3b82f6",
  },
];

export const tradingFeatures = [
  {
    title: "Expert Advisors",
    description: "Use any automated trading bot or EA",
    icon: "bot",
  },
  {
    title: "News Trading",
    description: "Trade during high-impact economic events",
    icon: "news",
  },
  {
    title: "Weekend Holding",
    description: "Keep your positions open over weekends",
    icon: "calendar",
  },
  {
    title: "No Time Limit",
    description: "Complete challenges at your own pace",
    icon: "clock",
  },
  {
    title: "Scalping Allowed",
    description: "No minimum holding time restrictions",
    icon: "zap",
  },
  {
    title: "Copy Trading",
    description: "Use signal services and copy trading",
    icon: "copy",
  },
];

export const educationModules = [
  {
    title: "Your Trading Setup Advantage",
    icon: "monitor",
    items: [
      "Learn trading secrets",
      "Optimize your workspace",
      "Create consistency in every trade",
    ],
  },
  {
    title: "Mapping High Timeframe Zones",
    icon: "target",
    items: [
      "Draw supply and demand zones",
      "Identify optimal entries along zones",
      "Use HTF zones to guide LTF trades",
    ],
  },
  {
    title: "Essential Trading Resources",
    icon: "book",
    items: [
      "Top news sources on X/Twitter",
      "How to evaluate outside resources",
      "Critical risk management tools",
    ],
  },
  {
    title: "Fibonacci Entries & Exits",
    icon: "trending",
    items: [
      "Optimal ratios for entries and exits",
      "Set precise targets with extensions",
      "Catch pullbacks with confidence",
    ],
  },
];

export const faqData = [
  {
    question: "How does Prop Capitals work?",
    answer:
      "Prop Capitals provides traders with funded accounts to trade with. You can choose from Instant Funding, 1-Step, or 2-Step challenges. Once you pass the evaluation (or choose instant funding), you trade with our capital and keep up to 90% of the profits. We handle all the risk while you focus on trading.",
  },
  {
    question: "What is the profit split?",
    answer:
      "We offer industry-leading profit splits up to 90%. The exact split depends on your chosen program: Instant Funding offers 70%, 1-Step Challenge offers 85%, and 2-Step Challenge offers up to 90% profit split. Top performers can even reach 100% profit split.",
  },
  {
    question: "How fast are payouts processed?",
    answer:
      "Our payouts are processed in under 90 minutes on average - one of the fastest in the industry. Once you request a payout, our team works around the clock to ensure you receive your earnings quickly. We support multiple payout methods including bank transfer, crypto, and e-wallets.",
  },
  {
    question: "Can I use Expert Advisors (EAs)?",
    answer:
      "Yes! We allow all trading strategies including EAs, automated bots, scalping, news trading, and weekend holding. There are virtually no restrictions on how you trade - use whatever strategy works best for you.",
  },
  {
    question: "What happens if I fail a challenge?",
    answer:
      "If you breach the rules during a challenge, you can retry with a new purchase at a discounted rate. We offer up to 20% off on retry accounts. Remember, there's no time limit on our challenges, so take your time to trade responsibly and manage your risk.",
  },
  {
    question: "Is the challenge fee refundable?",
    answer:
      "Yes! We refund 100% of your challenge fee with your first payout once you become a funded trader. This means your evaluation is essentially free if you pass and profit.",
  },
  {
    question: "What trading instruments are available?",
    answer:
      "Trade Forex (50+ pairs), Metals (Gold, Silver), Indices (US30, NAS100, SPX500), and Cryptocurrencies (BTC, ETH). We offer competitive spreads starting from 0.0 pips and low commissions.",
  },
  {
    question: "Is there a scaling plan?",
    answer:
      "Yes! Our scaling plan allows you to grow your account up to $5,000,000. Every time you reach a 10% profit milestone, your account size increases by 25%. Top traders can access our Elite program with even better conditions.",
  },
];

export const stats = {
  tradersCount: "18,500+",
  totalPaid: "$15.2M+",
  avgPayout: "$3,850",
  trustpilotRating: "4.8",
  payoutTime: "<90 min",
  successRate: "23%",
};

export const tradingConditions = [
  { label: "Forex Leverage", value: "Up to 1:100" },
  { label: "Spreads From", value: "0.0 pips" },
  { label: "Commission", value: "$2/lot" },
  { label: "Instruments", value: "100+" },
];

export const trustBadges = [
  { name: "Trustpilot", rating: "4.8", reviews: "2,340" },
  { name: "Prop Firm Match", badge: "Top Rated" },
];
