// import React from "react";
// import { Link } from "react-router-dom";
// import { createPageUrl } from "../utils";
// import { motion } from "framer-motion";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { useTranslation } from "../contexts/LanguageContext";
// import {
//   TrendingUp,
//   Shield,
//   Wallet,
//   Zap,
//   Award,
//   Users,
//   ArrowRight,
//   Check,
//   Star,
//   Globe,
//   Clock,
//   Target,
//   BarChart3,
//   DollarSign,
//   Percent,
//   ChevronRight,
//   Play,
//   Trophy,
//   Rocket,
//   LineChart,
//   PiggyBank,
//   BadgeCheck,
//   Headphones,
// } from "lucide-react";
import HeroSection from "@/components/home/HeroSection.jsx";
import PayoutsSection from "@/components/home/PayoutsSection.jsx";
import ComparisonSection from "@/components/home/ComparisonSection.jsx";
import TestimonialsSection from "@/components/home/TestimonialsSection.jsx";
import TrustpilotSection from "@/components/home/TrustpilotSection.jsx";
import PlatformsSection from "@/components/home/PlatformsSection.jsx";
import ChallengesSection from "@/components/home/ChallengesSection.jsx";
import FeaturesSection from "@/components/home/FeaturesSection.jsx";
import EducationSection from "@/components/home/EducationSection.jsx";
import StatsSection from "@/components/home/StatsSection.jsx";
import FAQSection from "@/components/home/FAQSection.jsx";

// const fadeIn = {
//   initial: { opacity: 0, y: 20 },
//   animate: { opacity: 1, y: 0 },
//   transition: { duration: 0.6 },
// };

// const stagger = {
//   animate: {
//     transition: {
//       staggerChildren: 0.1,
//     },
//   },
// };

export default function Home() {
  // const { t } = useTranslation();

  // const features = [
  //   {
  //     icon: Target,
  //     title: t("home.features.clearObjectives.title"),
  //     description: t("home.features.clearObjectives.description"),
  //     image:
  //       "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
  //   },
  //   {
  //     icon: Shield,
  //     title: t("home.features.generousDrawdown.title"),
  //     description: t("home.features.generousDrawdown.description"),
  //     image:
  //       "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
  //   },
  //   {
  //     icon: Wallet,
  //     title: t("home.features.profitSplit.title"),
  //     description: t("home.features.profitSplit.description"),
  //     image:
  //       "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop",
  //   },
  //   {
  //     icon: Zap,
  //     title: t("home.features.instantSetup.title"),
  //     description: t("home.features.instantSetup.description"),
  //     image:
  //       "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
  //   },
  //   {
  //     icon: Globe,
  //     title: t("home.features.tradeAnywhere.title"),
  //     description: t("home.features.tradeAnywhere.description"),
  //     image:
  //       "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=300&fit=crop",
  //   },
  //   {
  //     icon: Clock,
  //     title: t("home.features.noTimeLimits.title"),
  //     description: t("home.features.noTimeLimits.description"),
  //     image:
  //       "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
  //   },
  // ];

  // const challenges = [
  //   { size: "$10,000", price: "$99", profit: "8%", split: "80%" },
  //   { size: "$25,000", price: "$199", profit: "8%", split: "80%" },
  //   { size: "$50,000", price: "$299", profit: "8%", split: "85%" },
  //   {
  //     size: "$100,000",
  //     price: "$499",
  //     profit: "8%",
  //     split: "85%",
  //     popular: true,
  //   },
  //   { size: "$200,000", price: "$999", profit: "8%", split: "90%" },
  // ];

  // const stats = [
  //   { value: "$50M+", label: t("home.stats.fundedCapital"), icon: DollarSign },
  //   { value: "15,000+", label: t("home.stats.activeTraders"), icon: Users },
  //   { value: "$8M+", label: t("home.stats.paidToTraders"), icon: PiggyBank },
  //   { value: "4.9/5", label: t("home.stats.trustScore"), icon: Star },
  // ];

  // const testimonials = [
  //   {
  //     name: "Michael Rodriguez",
  //     country: "🇺🇸 USA",
  //     amount: "$12,450",
  //     image:
  //       "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  //     quote:
  //       "Got funded within 2 weeks. The process was smooth and payouts are always on time!",
  //   },
  //   {
  //     name: "Sarah Chen",
  //     country: "🇬🇧 UK",
  //     amount: "$28,900",
  //     image:
  //       "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
  //     quote:
  //       "Best prop firm I've worked with. Transparent rules and excellent support team.",
  //   },
  //   {
  //     name: "Ahmed Hassan",
  //     country: "🇦🇪 UAE",
  //     amount: "$45,200",
  //     image:
  //       "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  //     quote:
  //       "Scaled my account twice already. The profit split is amazing compared to others.",
  //   },
  // ];

  // const partners = ["MetaTrader", "cTrader", "TradingView", "DXTrade"];

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      <HeroSection />
      <PayoutsSection />
      <ComparisonSection />
      <TestimonialsSection />
      <TrustpilotSection />
      <PlatformsSection />
      <ChallengesSection />
      <FeaturesSection />
      <EducationSection />
      <StatsSection />
      <FAQSection />
    </div>
  );
}
