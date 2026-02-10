import React from 'react';
import { Calendar, User, ArrowRight, Clock, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const BlogPage = () => {
  const { isDark } = useTheme();

  const featuredPost = {
    title: "How to Pass Your Prop Trading Challenge: A Complete Guide",
    excerpt: "Learn the strategies and mindset needed to successfully pass your prop trading evaluation and get funded.",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
    author: "Trading Team",
    date: "Jan 28, 2025",
    readTime: "8 min read",
    category: "Trading Tips"
  };

  const posts = [
    {
      title: "Risk Management: The Key to Long-Term Trading Success",
      excerpt: "Discover why proper risk management is more important than any trading strategy.",
      image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=250&fit=crop",
      author: "Risk Team",
      date: "Jan 25, 2025",
      readTime: "5 min read",
      category: "Education"
    },
    {
      title: "Understanding Market Structure for Better Entries",
      excerpt: "Learn how to read market structure and improve your trade entries.",
      image: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=250&fit=crop",
      author: "Analysis Team",
      date: "Jan 22, 2025",
      readTime: "6 min read",
      category: "Analysis"
    },
    {
      title: "Top 5 Mistakes New Prop Traders Make",
      excerpt: "Avoid these common pitfalls that cause most traders to fail their challenges.",
      image: "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=250&fit=crop",
      author: "Trading Team",
      date: "Jan 18, 2025",
      readTime: "4 min read",
      category: "Trading Tips"
    },
    {
      title: "Prop Capitals vs Traditional Trading: What's the Difference?",
      excerpt: "Compare prop trading with retail trading and understand the benefits.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop",
      author: "Content Team",
      date: "Jan 15, 2025",
      readTime: "7 min read",
      category: "Industry"
    },
    {
      title: "Building a Consistent Trading Routine",
      excerpt: "How successful traders structure their day for optimal performance.",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=250&fit=crop",
      author: "Trading Team",
      date: "Jan 12, 2025",
      readTime: "5 min read",
      category: "Lifestyle"
    },
    {
      title: "The Psychology of Profitable Trading",
      excerpt: "Master your emotions and develop the mindset of a professional trader.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=250&fit=crop",
      author: "Psychology Team",
      date: "Jan 8, 2025",
      readTime: "6 min read",
      category: "Psychology"
    }
  ];

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Blog</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Trading <span className="text-amber-500">Insights</span>
            </h1>
            <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Expert analysis, trading tips, and industry news to help you become a better trader.
            </p>
          </div>

          {/* Featured Post */}
          <div className="mb-12">
            <div className={`rounded-2xl overflow-hidden border hover:border-amber-500/30 transition-all group ${
              isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
            }`}>
              <div className="grid lg:grid-cols-2">
                <div className="aspect-video lg:aspect-auto">
                  <img src={featuredPost.image} alt={featuredPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6 lg:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-amber-500/10 text-amber-500 text-xs font-semibold px-3 py-1 rounded-full">{featuredPost.category}</span>
                    <span className={`text-sm flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                      <Clock className="w-4 h-4" />
                      {featuredPost.readTime}
                    </span>
                  </div>
                  <h2 className={`text-2xl lg:text-3xl font-black mb-4 group-hover:text-amber-500 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {featuredPost.title}
                  </h2>
                  <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{featuredPost.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                      <User className="w-4 h-4" />
                      {featuredPost.author}
                      <span className="mx-2">•</span>
                      <Calendar className="w-4 h-4" />
                      {featuredPost.date}
                    </div>
                    <span className="text-amber-500 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read More <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <article key={i} className={`rounded-2xl overflow-hidden border hover:border-amber-500/30 transition-all group cursor-pointer ${
                isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className="aspect-video overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-amber-500/10 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">{post.category}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{post.readTime}</span>
                  </div>
                  <h3 className={`font-bold text-lg mb-2 group-hover:text-amber-500 transition-colors line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {post.title}
                  </h3>
                  <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{post.excerpt}</p>
                  <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    <User className="w-3 h-3" />
                    {post.author}
                    <span className="mx-1">•</span>
                    {post.date}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPage;
