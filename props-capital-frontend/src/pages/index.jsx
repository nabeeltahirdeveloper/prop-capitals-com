import Layout from "./Layout.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { LanguageProvider } from "../contexts/LanguageContext";

import Home from "./Home";

import Challenges from "./Challenges";

import HowItWorks from "./HowItWorks";

import FAQ from "./FAQ";

import Contact from "./Contact";

import ScalingPlan from "./ScalingPlan";

import Payouts from "./Payouts";

import Terms from "./Terms";

import Privacy from "./Privacy";

import TraderDashboard from "./TraderDashboard";

import MyAccounts from "./MyAccounts";

import Analytics from "./Analytics";

import TraderPayouts from "./TraderPayouts";

import Profile from "./Profile";

import Support from "./Support";

import Rules from "./Rules";

import BuyChallenge from "./BuyChallenge";

import AccountDetails from "./AccountDetails";
import Notifications from "./Notifications";
import TradeHistory from "./TradeHistory";
import ChallengeProgress from "./ChallengeProgress";
import TradingTerminal from "./TradingTerminal";
import RuleCompliance from "./RuleCompliance";
import SignIn from "./SignIn";
import SignUp from "./SignUp";
import TraderBuyChallenge from "./TraderBuyChallenge";
import About from "./About.jsx";
import WatchDemo from "./WatchDemoPage.jsx"
import CareersPage from "./CareersPage.jsx"
import BlogPage from "./BlogPage.jsx";
import TradingRulesPage from "./TradingRulesPage.jsx"
import AffiliatePage from "./AffiliatePage.jsx"
import RiskDisclosurePage from "./RiskDisclosurePage.jsx"
import RefundPage from "./RefundPage.jsx"
import CheckoutPage from "./CheckoutPage.jsx";
import CheckoutSuccessPage from "./CheckoutSuccessPage.jsx";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from "react-router-dom";
import ProtectedRoute, {
  DashboardRedirect,
  PublicOnlyRoute,
} from "../components/ProtectedRoute";
import { PriceProviderWithRouter } from "../contexts/PriceContext";

const PAGES = {
  Home: Home,

  Challenges: Challenges,

  HowItWorks: HowItWorks,

  FAQ: FAQ,

  Contact: Contact,

  ScalingPlan: ScalingPlan,

  Payouts: Payouts,

  Terms: Terms,

  Privacy: Privacy,

  TraderDashboard: TraderDashboard,

  MyAccounts: MyAccounts,

  Analytics: Analytics,

  TraderPayouts: TraderPayouts,

  Profile: Profile,

  Support: Support,

  Rules: Rules,

  BuyChallenge: BuyChallenge,

  AccountDetails: AccountDetails,

  Notifications: Notifications,

  TradeHistory: TradeHistory,

  ChallengeProgress: ChallengeProgress,

  TradingTerminal: TradingTerminal,

  RuleCompliance: RuleCompliance,

  SignIn: SignIn,

  SignUp: SignUp,

  TraderBuyChallenge: TraderBuyChallenge,
};

function _getCurrentPage(url) {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase(),
  );
  return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <PriceProviderWithRouter>
      <LanguageProvider>
        <ErrorBoundary>
          <Layout currentPageName={currentPage}>
            <Routes key={location.pathname}>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/Home" element={<Home />} />
              <Route path="/Challenges" element={<Challenges />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
              <Route path="/HowItWorks" element={<HowItWorks />} />
              <Route path="/FAQ" element={<FAQ />} />
              <Route path="/Contact" element={<Contact />} />
              <Route path="/ScalingPlan" element={<ScalingPlan />} />
              <Route path="/Payouts" element={<Payouts />} />
              <Route path="/Rules" element={<Rules />} />
              <Route path="/about" element={<About />}/>
              <Route path="/watch-demo" element={<WatchDemo />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/trading-rules" element={<TradingRulesPage />} />
              <Route path="/affiliate" element={<AffiliatePage />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/Privacy" element={<Privacy />} />
              <Route path="/risk-disclosure" element={<RiskDisclosurePage />} />
              <Route path="/refund-policy" element={<RefundPage />} />

              <Route
                path="/SignIn"
                element={
                  <PublicOnlyRoute>
                    <SignIn />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/login"
                element={<Navigate to="/SignIn" replace />}
              />
              <Route
                path="/SignUp"
                element={
                  <PublicOnlyRoute>
                    <SignUp />
                  </PublicOnlyRoute>
                }
              />
              <Route path="/dashboard" element={<DashboardRedirect />} />

              {/* Trader Routes */}
              <Route element={<ProtectedRoute allowedRoles={["TRADER"]} />}>
                <Route path="/TraderDashboard" element={<TraderDashboard />} />
                <Route path="/MyAccounts" element={<MyAccounts />} />
                <Route path="/Analytics" element={<Analytics />} />
                <Route path="/TraderPayouts" element={<TraderPayouts />} />
                <Route path="/Support" element={<Support />} />
                <Route path="/BuyChallenge" element={<BuyChallenge />} />
                <Route path="/AccountDetails" element={<AccountDetails />} />
                <Route path="/TradeHistory" element={<TradeHistory />} />
                <Route
                  path="/ChallengeProgress"
                  element={<ChallengeProgress />}
                />
                <Route path="/TradingTerminal" element={<TradingTerminal />} />
                <Route path="/RuleCompliance" element={<RuleCompliance />} />
                <Route
                  path="/TraderBuyChallenge"
                  element={<TraderBuyChallenge />}
                />
              </Route>

              {/* Trader Profile Route */}
              <Route element={<ProtectedRoute allowedRoles={["TRADER"]} />}>
                <Route path="/Profile" element={<Profile />} />
              </Route>

              {/* Notifications Route */}
              <Route element={<ProtectedRoute allowedRoles={["TRADER"]} />}>
                <Route path="/Notifications" element={<Notifications />} />
              </Route>
            </Routes>
          </Layout>
        </ErrorBoundary>
      </LanguageProvider>
    </PriceProviderWithRouter>
  );
}

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
