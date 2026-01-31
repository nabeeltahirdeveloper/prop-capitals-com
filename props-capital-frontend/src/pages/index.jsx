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

import AdminProfile from "./AdminProfile";

import Support from "./Support";

import AdminDashboard from "./AdminDashboard";

import AdminUsers from "./AdminUsers";

import AdminChallenges from "./AdminChallenges";

import AdminAccounts from "./AdminAccounts";

import AdminPayouts from "./AdminPayouts";

import AdminPayments from "./AdminPayments";

import AdminViolations from "./AdminViolations";

import AdminCoupons from "./AdminCoupons";

import AdminSupport from "./AdminSupport";

import AdminSettings from "./AdminSettings";

import Rules from "./Rules";

import BuyChallenge from "./BuyChallenge";

import AccountDetails from "./AccountDetails";

import AdminBrokerServers from "./AdminBrokerServers";

import AdminRiskMonitor from "./AdminRiskMonitor";

import AdminScaling from "./AdminScaling";

import Notifications from "./Notifications";

import TradeHistory from "./TradeHistory";

import ChallengeProgress from "./ChallengeProgress";

import TradingTerminal from "./TradingTerminal";

import RuleCompliance from "./RuleCompliance";

import SignIn from "./SignIn";

import SignUp from "./SignUp";

import TraderBuyChallenge from "./TraderBuyChallenge";

import CRMLeads from "./CRMLeads";
import CRMPipeline from "./CRMPipeline";
import CRMFTDReport from "./CRMFTDReport";
import CRMCalendar from "./CRMCalendar";
import CRMApiKeys from "./CRMApiKeys";

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

  AdminProfile: AdminProfile,

  Support: Support,

  AdminDashboard: AdminDashboard,

  AdminUsers: AdminUsers,

  AdminChallenges: AdminChallenges,

  AdminAccounts: AdminAccounts,

  AdminPayouts: AdminPayouts,

  AdminPayments: AdminPayments,

  AdminViolations: AdminViolations,

  AdminCoupons: AdminCoupons,

  AdminSupport: AdminSupport,

  AdminSettings: AdminSettings,

  Rules: Rules,

  BuyChallenge: BuyChallenge,

  AccountDetails: AccountDetails,

  AdminBrokerServers: AdminBrokerServers,

  AdminRiskMonitor: AdminRiskMonitor,

  AdminScaling: AdminScaling,

  Notifications: Notifications,

  TradeHistory: TradeHistory,

  ChallengeProgress: ChallengeProgress,

  TradingTerminal: TradingTerminal,

  RuleCompliance: RuleCompliance,

  SignIn: SignIn,

  SignUp: SignUp,

  TraderBuyChallenge: TraderBuyChallenge,

  CRMLeads: CRMLeads,
  CRMPipeline: CRMPipeline,
  CRMFTDReport: CRMFTDReport,
  CRMCalendar: CRMCalendar,
  CRMApiKeys: CRMApiKeys,
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
              <Route path="/HowItWorks" element={<HowItWorks />} />
              <Route path="/FAQ" element={<FAQ />} />
              <Route path="/Contact" element={<Contact />} />
              <Route path="/ScalingPlan" element={<ScalingPlan />} />
              <Route path="/Payouts" element={<Payouts />} />
              <Route path="/Terms" element={<Terms />} />
              <Route path="/Privacy" element={<Privacy />} />
              <Route path="/Rules" element={<Rules />} />
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

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/AdminDashboard" element={<AdminDashboard />} />
                <Route path="/AdminUsers" element={<AdminUsers />} />
                <Route path="/AdminChallenges" element={<AdminChallenges />} />
                <Route path="/AdminAccounts" element={<AdminAccounts />} />
                <Route path="/AdminPayouts" element={<AdminPayouts />} />
                <Route path="/AdminPayments" element={<AdminPayments />} />
                <Route path="/AdminViolations" element={<AdminViolations />} />
                <Route path="/AdminCoupons" element={<AdminCoupons />} />
                <Route path="/AdminSupport" element={<AdminSupport />} />
                <Route path="/AdminSettings" element={<AdminSettings />} />
                <Route
                  path="/AdminBrokerServers"
                  element={<AdminBrokerServers />}
                />
                <Route
                  path="/AdminRiskMonitor"
                  element={<AdminRiskMonitor />}
                />
                <Route path="/AdminScaling" element={<AdminScaling />} />
                <Route path="/AdminProfile" element={<AdminProfile />} />
                <Route path="/CRMLeads" element={<CRMLeads />} />
                <Route path="/CRMPipeline" element={<CRMPipeline />} />
                <Route path="/CRMFTDReport" element={<CRMFTDReport />} />
                <Route path="/CRMCalendar" element={<CRMCalendar />} />
                <Route path="/CRMApiKeys" element={<CRMApiKeys />} />
              </Route>

              {/* Trader Profile Route */}
              <Route element={<ProtectedRoute allowedRoles={["TRADER"]} />}>
                <Route path="/Profile" element={<Profile />} />
              </Route>

              {/* Shared Routes (TRADER and ADMIN) */}
              <Route
                element={<ProtectedRoute allowedRoles={["TRADER", "ADMIN"]} />}
              >
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
