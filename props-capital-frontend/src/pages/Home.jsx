import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTranslation } from "../contexts/LanguageContext";
import {
  TrendingUp,
  Shield,
  Wallet,
  Zap,
  Award,
  Users,
  ArrowRight,
  Check,
  Star,
  Globe,
  Clock,
  Target,
  BarChart3,
  DollarSign,
  Percent,
  ChevronRight,
  Play,
  Trophy,
  Rocket,
  LineChart,
  PiggyBank,
  BadgeCheck,
  Headphones,
} from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Target,
      title: t("home.features.clearObjectives.title"),
      description: t("home.features.clearObjectives.description"),
      image:
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop",
    },
    {
      icon: Shield,
      title: t("home.features.generousDrawdown.title"),
      description: t("home.features.generousDrawdown.description"),
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop",
    },
    {
      icon: Wallet,
      title: t("home.features.profitSplit.title"),
      description: t("home.features.profitSplit.description"),
      image:
        "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop",
    },
    {
      icon: Zap,
      title: t("home.features.instantSetup.title"),
      description: t("home.features.instantSetup.description"),
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop",
    },
    {
      icon: Globe,
      title: t("home.features.tradeAnywhere.title"),
      description: t("home.features.tradeAnywhere.description"),
      image:
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=300&fit=crop",
    },
    {
      icon: Clock,
      title: t("home.features.noTimeLimits.title"),
      description: t("home.features.noTimeLimits.description"),
      image:
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop",
    },
  ];

  const challenges = [
    { size: "$10,000", price: "$99", profit: "8%", split: "80%" },
    { size: "$25,000", price: "$199", profit: "8%", split: "80%" },
    { size: "$50,000", price: "$299", profit: "8%", split: "85%" },
    {
      size: "$100,000",
      price: "$499",
      profit: "8%",
      split: "85%",
      popular: true,
    },
    { size: "$200,000", price: "$999", profit: "8%", split: "90%" },
  ];

  const stats = [
    { value: "$50M+", label: t("home.stats.fundedCapital"), icon: DollarSign },
    { value: "15,000+", label: t("home.stats.activeTraders"), icon: Users },
    { value: "$8M+", label: t("home.stats.paidToTraders"), icon: PiggyBank },
    { value: "4.9/5", label: t("home.stats.trustScore"), icon: Star },
  ];

  const testimonials = [
    {
      name: "Michael Rodriguez",
      country: "🇺🇸 USA",
      amount: "$12,450",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      quote:
        "Got funded within 2 weeks. The process was smooth and payouts are always on time!",
    },
    {
      name: "Sarah Chen",
      country: "🇬🇧 UK",
      amount: "$28,900",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      quote:
        "Best prop firm I've worked with. Transparent rules and excellent support team.",
    },
    {
      name: "Ahmed Hassan",
      country: "🇦🇪 UAE",
      amount: "$45,200",
      image:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      quote:
        "Scaled my account twice already. The profit split is amazing compared to others.",
    },
  ];

  const partners = ["MetaTrader", "cTrader", "TradingView", "DXTrade"];

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 sm:pt-24 md:pt-32 pb-16 md:pb-24 overflow-x-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&h=1080&fit=crop"
            alt="Trading background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
        </div>

        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-1/4 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div initial="initial" animate="animate" variants={stagger}>
              <motion.div
                variants={fadeIn}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8"
              >
                <Star className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400">
                  {t("home.hero.badge")}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeIn}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 md:mb-6 leading-tight"
              >
                {t("home.hero.title")}
                <span className="block bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {t("home.hero.titleHighlight")}
                </span>
              </motion.h1>

              <motion.p
                variants={fadeIn}
                className="text-base sm:text-lg md:text-xl text-slate-400 mb-6 md:mb-10"
              >
                {t("home.hero.subtitle")}
              </motion.p>

              <motion.div
                variants={fadeIn}
                className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              >
                <a href="#challenges">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg h-auto group w-full sm:w-auto"
                  >
                    {t("home.hero.cta")}
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </a>
                <Link to={createPageUrl("HowItWorks")}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg h-auto group w-full sm:w-auto"
                  >
                    <Play className="mr-2 w-5 h-5" />
                    {t("home.hero.howItWorks")}
                  </Button>
                </Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                variants={fadeIn}
                className="flex items-center gap-6 mt-10"
              >
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-400">
                    {t("home.hero.verified")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-400">
                    {t("home.hero.secure")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm text-slate-400">
                    {t("home.hero.support")}
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Image - Dashboard Preview */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-2xl blur-xl" />
                <img
                  src="https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&h=400&fit=crop"
                  alt="Trading Dashboard"
                  className="relative rounded-2xl border border-slate-800 shadow-2xl"
                />
                {/* Floating Stats Cards */}
                <div className="absolute -left-8 top-1/4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">
                        {t("home.hero.profitToday")}
                      </p>
                      <p className="text-lg font-bold text-emerald-400">
                        +$2,450
                      </p>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-8 bottom-1/4 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">
                        {t("home.hero.winRate")}
                      </p>
                      <p className="text-lg font-bold text-cyan-400">78.5%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mt-12 sm:mt-16 md:mt-24"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {stats.map((stat, i) => (
              <div key={i} className="text-center relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6">
                  <stat.icon className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
                  <p className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2">
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-8 md:py-12 border-y border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 md:gap-8">
            <p className="text-slate-400 text-xs sm:text-sm text-center">
              {t("home.partners.title")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 md:gap-12 w-full max-w-4xl">
              {partners.map((partner, i) => (
                <div
                  key={i}
                  className="text-slate-500 font-semibold text-sm sm:text-base md:text-lg hover:text-slate-300 transition-colors text-center"
                >
                  {partner}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">
                {t("home.features.title")}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-4 mb-4">
                {t("home.features.subtitle")}
              </h2>
              <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                {t("home.features.description")}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-900 border-slate-800 overflow-hidden h-full hover:border-emerald-500/50 transition-all group">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-400">{feature.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-900/50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">
              {t("home.howItWorks.label")}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-4">
              {t("home.howItWorks.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {[
              {
                step: "01",
                icon: Rocket,
                title: t("home.howItWorks.step1.title"),
                desc: t("home.howItWorks.step1.description"),
                image:
                  "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop",
              },
              {
                step: "02",
                icon: LineChart,
                title: t("home.howItWorks.step2.title"),
                desc: t("home.howItWorks.step2.description"),
                image:
                  "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop",
              },
              {
                step: "03",
                icon: Trophy,
                title: t("home.howItWorks.step3.title"),
                desc: t("home.howItWorks.step3.description"),
                image:
                  "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&h=300&fit=crop",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <Card className="bg-slate-900 border-slate-800 overflow-hidden group hover:border-emerald-500/50 transition-all">
                  <div className="h-48 overflow-hidden relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className="text-6xl font-bold text-white/20">
                        {item.step}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-400">{item.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to={createPageUrl("HowItWorks")}>
              <Button
                variant="outline"
                size="lg"
                className="border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white"
              >
                {t("home.howItWorks.learnMore")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Challenges Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">
              {t("home.challenges.label")}
            </span>
            <h2
              id="challenges"
              className="text-3xl md:text-5xl font-bold text-white mt-4 mb-4 scroll-mt-24"
            >
              {t("home.challenges.title")}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              {t("home.challenges.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {challenges.map((challenge, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  className={`relative bg-slate-900 border-slate-800 p-4 sm:p-6 text-center hover:border-emerald-500/50 transition-all hover:-translate-y-2 ${challenge.popular ? "ring-2 ring-emerald-500" : ""}`}
                >
                  {challenge.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" />{" "}
                        {t("home.challenges.popular")}
                      </span>
                    </div>
                  )}
                  <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    {challenge.size}
                  </p>
                  <p className="text-slate-400 mb-4">
                    {t("home.challenges.accountSize")}
                  </p>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        {t("home.challenges.price")}
                      </span>
                      <span className="text-white font-semibold">
                        {challenge.price}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        {t("home.challenges.profitTarget")}
                      </span>
                      <span className="text-white">{challenge.profit}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">
                        {t("home.challenges.profitSplit")}
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        {challenge.split}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={
                      createPageUrl("BuyChallenge") +
                      `?size=${challenge.size.replace(/[^0-9]/g, "")}`
                    }
                  >
                    <Button
                      className={`w-full ${challenge.popular ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-white"}`}
                    >
                      {t("home.challenges.getStarted")}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to={createPageUrl("Challenges")}>
              <Button
                variant="outline"
                size="lg"
                className="border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white"
              >
                {t("home.challenges.viewAll")}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">
              {t("home.testimonials.label")}
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-white mt-4 mb-4">
              {t("home.testimonials.title")}
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              {t("home.testimonials.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-500"
                    />
                    <div>
                      <p className="text-white font-semibold">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-slate-400">
                        {testimonial.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star
                        key={j}
                        className="w-4 h-4 text-amber-400 fill-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-4">"{testimonial.quote}"</p>
                  <div className="pt-4 border-t border-slate-800">
                    <p className="text-sm text-slate-400">
                      {t("home.testimonials.totalEarned")}
                    </p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {testimonial.amount}
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=600&fit=crop"
            alt="Trading success"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6 leading-tight">
              {t("home.cta.title")}{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {t("home.cta.titleHighlight")}
              </span>
            </h2>
            <p className="text-xl text-slate-400 mb-10">
              {t("home.cta.subtitle")}
            </p>
            <a href="#challenges">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg h-auto group w-full sm:w-auto"
              >
                {t("home.cta.button")}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <p className="text-sm text-slate-500 mt-6">
              {t("home.cta.footer")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  Prop Capitals
                </span>
              </div>
              <p className="text-slate-400 mb-6">
                {t("home.footer.description")}
              </p>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-slate-400">
                  {t("home.footer.verified")}
                </span>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">
                {t("home.footer.company")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to={createPageUrl("HowItWorks")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {t("home.footer.howItWorks")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={createPageUrl("Challenges")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {t("home.footer.challenges")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={createPageUrl("ScalingPlan")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {t("home.footer.scalingPlan")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={createPageUrl("Payouts")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {t("home.footer.payouts")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">
                {t("home.footer.support")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to={createPageUrl("FAQ")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {t("home.footer.faq")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={createPageUrl("Contact")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {t("home.footer.contact")}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">
                {t("home.footer.legal")}
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to={createPageUrl("Terms")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {t("home.footer.terms")}
                  </Link>
                </li>
                <li>
                  <Link
                    to={createPageUrl("Privacy")}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    {t("home.footer.privacy")}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
              <p className="text-slate-500">{t("home.footer.copyright")}</p>
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 text-slate-600" />
                <span className="text-sm text-slate-500">
                  {t("home.footer.secure")}
                </span>
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="text-xs text-slate-600">
                BLUEHAVEN MANAGEMENT LTD | 60 TOTTENHAM COURT ROAD, OFFICE 469,
                LONDON, ENGLAND W1T 2EW
              </p>
              <p className="text-xs text-slate-600 mt-1">
                Email: support@the-bluehaven.com
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
