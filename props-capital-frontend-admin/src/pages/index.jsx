import Layout from "./Layout.jsx";
import ErrorBoundary from "../components/ErrorBoundary.jsx";
import { LanguageProvider } from '../contexts/LanguageContext';

import AdminProfile from "./AdminProfile";

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

import AdminBrokerServers from "./AdminBrokerServers";

import AdminRiskMonitor from "./AdminRiskMonitor";

import AdminScaling from "./AdminScaling";

import Notifications from "./Notifications";

import SignIn from "./SignIn";

import CRMLeads from "./CRMLeads";
import CRMPipeline from "./CRMPipeline";
import CRMFTDReport from "./CRMFTDReport";
import CRMCalendar from "./CRMCalendar";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import ProtectedRoute, { DashboardRedirect, PublicOnlyRoute } from '../components/ProtectedRoute';
import { PriceProviderWithRouter } from '../contexts/PriceContext';

const PAGES = {

    AdminProfile: AdminProfile,

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

    AdminBrokerServers: AdminBrokerServers,

    AdminRiskMonitor: AdminRiskMonitor,

    AdminScaling: AdminScaling,

    Notifications: Notifications,

    SignIn: SignIn,

    CRMLeads: CRMLeads,
    CRMPipeline: CRMPipeline,
    CRMFTDReport: CRMFTDReport,
    CRMCalendar: CRMCalendar,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
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

                            {/* Login Route - Public */}
                            <Route path="/" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
                            <Route path="/SignIn" element={<PublicOnlyRoute><SignIn /></PublicOnlyRoute>} />
                            <Route path="/login" element={<Navigate to="/SignIn" replace />} />
                            <Route path="/dashboard" element={<DashboardRedirect />} />

                            {/* Admin Routes */}
                            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
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
                                <Route path="/AdminBrokerServers" element={<AdminBrokerServers />} />
                                <Route path="/AdminRiskMonitor" element={<AdminRiskMonitor />} />
                                <Route path="/AdminScaling" element={<AdminScaling />} />
                                <Route path="/AdminProfile" element={<AdminProfile />} />
                                <Route path="/CRMLeads" element={<CRMLeads />} />
                                <Route path="/CRMPipeline" element={<CRMPipeline />} />
                                <Route path="/CRMFTDReport" element={<CRMFTDReport />} />
                                <Route path="/CRMCalendar" element={<CRMCalendar />} />
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