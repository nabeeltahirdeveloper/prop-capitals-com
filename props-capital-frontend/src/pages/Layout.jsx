import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Layout({ children, currentPageName }) {
  const { t } = useTranslation();
  const location = useLocation();
  const { status } = useAuth();

  // Close mobile sidebar on route change (nice UX)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Full-screen pages with no layout (have their own full-page UI).
  // Both camelCase and hyphenated forms are listed because `_getCurrentPage`
  // returns the literal PAGES key it matched, which depends on which alias
  // was hit (see PAGES map in pages/index.jsx).
  const noLayoutPages = [
    "SignIn",
    "SignUp",
    "BrandLogin",
    "BrandDashboard",
    "ResellerLogin",
    "ResellerDashboard",
    "brand-login",
    "brand-dashboard",
    "reseller-login",
    "reseller-dashboard",
  ];
  const isNoLayoutPage = noLayoutPages.includes(currentPageName);

  // Public pages that render with Navbar + Footer
  const publicPages = [
    "Home",
    "Challenges",
    "HowItWorks",
    "FAQ",
    "ABOUT",
    "Contact",
    "Terms",
    "Privacy",
    "Rules",
    "BuyChallenge",
    "ScalingPlan",
    "Payouts",
    // Guest-accessible checkout / payment-flow pages
    "checkout",
    "CheckoutPage",
    "CheckoutSuccessPage",
    "PayLink",
    "PayLinkSuccess",
    "PayLinkFail",
    "ForgotPassword",
    "SetPassword",
  ];
  const isPublicPage = publicPages.includes(currentPageName);

  // Early returns for no-layout pages (SignIn, SignUp have their own full-screen UI)
  if (isNoLayoutPage) return <>{children}</>;

  // All /traderdashboard/* routes use TraderPanelLayout — no public header/footer
  if (location.pathname.startsWith("/traderdashboard")) {
    return <>{children}</>;
  }

  const isProtectedPage = !isPublicPage && !isNoLayoutPage;

  if (isProtectedPage && status === "checking") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Unauthenticated on a protected page — let ProtectedRoute handle the redirect
  if (isProtectedPage && status !== "authenticated") return null;

  // Public pages layout
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0d12] transition-colors duration-300">
        <Navbar />
        {children}
        <Footer />
      </div>
    );
  }

  // Protected authenticated pages (old standalone routes like /Notifications, /MyAccounts, etc.)
  // Wrap with Navbar so users always have navigation context
  //
  // The Trading Terminal is a full-width, data-dense app surface — boxing it into
  // the 1280px `max-w-7xl` content column makes it feel cramped/"zoomed in" on
  // laptop viewports and wastes horizontal space on large monitors. Give it the
  // full viewport width with tighter padding instead.
  const isTerminalPage = currentPageName === "TradingTerminal";
  return (
    <div className="min-h-screen bg-slate-950 transition-colors duration-300">
      <Navbar />
      <div
        className={
          isTerminalPage
            ? "w-full px-2 sm:px-4 lg:px-6 py-4"
            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        }
      >
        {children}
      </div>
    </div>
  );
}
