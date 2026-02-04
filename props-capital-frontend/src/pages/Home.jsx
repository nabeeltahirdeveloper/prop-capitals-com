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
import ProfitCalculatorSection from "@/components/home/ProfitCalculatorSection.jsx"


export default function Home() {

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0d12] transition-colors duration-300">
      <HeroSection />
      <ProfitCalculatorSection />
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
