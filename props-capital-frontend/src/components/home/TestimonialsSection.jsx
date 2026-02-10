import React, { useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Quote,
  Star,
  Volume2,
  VolumeX,
  Play,
  Pause,
} from "lucide-react";
import { testimonials } from "./data/mockData.js";
import { useTheme } from "@/contexts/ThemeContext";

const VideoPlayer = ({ src, className, isDark }) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl ${className}`}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted={isMuted}
        playsInline
        preload="auto"
      />

      {/* Overlay Controls */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
        {!isPlaying && (
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        )}
      </div>

      {/* Mute Toggle */}
      <button
        onClick={toggleMute}
        className={`absolute bottom-4 right-4 z-20 p-2 rounded-full backdrop-blur-md border transition-all ${
          isDark
            ? "bg-white/10 hover:bg-white/20 border-white/10 text-white"
            : "bg-slate-900/10 hover:bg-slate-900/20 border-slate-900/10 text-slate-900"
        }`}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </button>

      {/* Play/Pause Indicator (Mobile/Small) */}
      <div className="absolute top-4 left-4 z-20">
        {!isPlaying ? (
          <Pause className="w-4 h-4 text-white/50" />
        ) : (
          <Play className="w-4 h-4 text-white/50" />
        )}
      </div>
    </div>
  );
};

const TestimonialsSection = () => {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section
      className={`py-20 lg:py-32 transition-colors duration-300 ${isDark ? "bg-[#0a0d12]" : "bg-white"}`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">
            Testimonials
          </span>
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-black ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Hear From Our <span className="text-amber-500">Traders</span>
          </h2>
        </div>

        <div
          className={`rounded-3xl p-8 lg:p-12 border relative overflow-hidden ${
            isDark
              ? "bg-gradient-to-br from-[#12161d] to-[#0d1117] border-white/10"
              : "bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-xl"
          }`}
        >
          {/* Background Glow */}
          <div
            className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl ${
              isDark ? "bg-amber-500/10" : "bg-amber-400/20"
            }`}
          ></div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
            {/* Left side info */}
            <div className="order-2 lg:order-1">
              <Quote
                className={`w-12 h-12 mb-4 ${isDark ? "text-amber-400/30" : "text-amber-400/50"}`}
              />

              <blockquote
                className={`text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-8 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                "
                {currentTestimonial.quote
                  .split(currentTestimonial.highlight)
                  .map((part, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <span className="text-amber-500">
                          {currentTestimonial.highlight}
                        </span>
                      )}
                      {part}
                    </React.Fragment>
                  ))}
                "
              </blockquote>

              <div className="flex flex-wrap items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <img
                    src={currentTestimonial.avatar}
                    alt={currentTestimonial.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-amber-400"
                  />
                  <div>
                    <p
                      className={`font-semibold text-lg ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {currentTestimonial.name}
                    </p>
                    <p
                      className={
                        isDark ? "text-gray-400" : "text-slate-500 text-sm"
                      }
                    >
                      Funded Trader • {currentTestimonial.country}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col border-l border-amber-500/20 pl-6">
                  <span
                    className={`text-xs uppercase tracking-wider mb-1 ${isDark ? "text-gray-500" : "text-slate-400"}`}
                  >
                    Payout
                  </span>
                  <span className="text-emerald-500 font-bold text-xl">
                    {currentTestimonial.payout}
                  </span>
                </div>

                <div className="flex flex-col border-l border-amber-500/20 pl-6">
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                  <span
                    className={`text-sm font-medium ${isDark ? "text-amber-400" : "text-amber-600"}`}
                  >
                    {currentTestimonial.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* Right side video - Focused Single Video View */}
            <div className="order-1 lg:order-2 relative group">
              <VideoPlayer
                key={currentTestimonial.id}
                src={currentTestimonial.promoVideo}
                className="w-full aspect-[4/5] lg:aspect-square shadow-2xl ring-1 ring-white/10"
                isDark={isDark}
              />

              {/* Verified Badge Overlay */}
              {/* <div className="absolute -top-4 -right-4 bg-amber-500 text-slate-950 px-4 py-2 rounded-full font-bold text-xs shadow-lg rotate-12 z-20 pointer-events-none">
                Verified Trader Result
              </div> */}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-12 relative z-10">
            <button
              onClick={prevSlide}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
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
                      ? "bg-amber-500 w-6"
                      : isDark
                        ? "bg-white/20"
                        : "bg-slate-300"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                isDark
                  ? "bg-white/5 hover:bg-white/10 text-white border-white/10"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
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
