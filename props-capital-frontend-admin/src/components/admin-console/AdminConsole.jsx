import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// Imports kept for the temporarily-disabled sections so they can be re-enabled easily.
// import DashboardSection from './DashboardSection';
// import OrdersSection from './OrdersSection';
// import UsersSection from './UsersSection';
// import PackagesSection from './PackagesSection';
// import PaymentGatewayGeoSection from './PaymentGatewayGeoSection';
import BrandsSection from './BrandsSection';
import BrandWalletsSection from './BrandWalletsSection';
import CurrenciesSection from './CurrenciesSection';
import CurrencyGeoMappingsSection from './CurrencyGeoMappingsSection';
import AdminVisitsSection from './AdminVisitsSection';
import AdminAllTransactionsSection from './AdminAllTransactionsSection';
import BlockedIPsSection from './BlockedIPsSection';
import AdminPayoutsSection from './AdminPayoutsSection';
import AdminPendingBrandsSection from './AdminPendingBrandsSection';
import IpWhitelistSection from './IpWhitelistSection';
import SystemToolsSection from './SystemToolsSection';
import AdminLogsSection from './AdminLogsSection';
import BotLogsSection from './BotLogsSection';
import DirectPurchaseLinksSection from './DirectPurchaseLinksSection';
import BrandsUnpaidTransactionsSection from './BrandsUnpaidTransactionsSection';
import './AdminConsole.css';

// Sections currently disabled — visiting their URLs will render a small notice instead.
const DISABLED_SECTIONS = new Set([
  'dashboard',
  'orders',
  'users',
  'packages',
  'payment-gateway-geo',
]);

// First available section, used when no `section` param is in the URL or
// the persisted/requested section is disabled.
const DEFAULT_SECTION = 'transactions';

export default function AdminConsole() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionFromUrl = searchParams.get('section');
  const persistedSection = localStorage.getItem('admin-active-section');

  // Resolution order:
  // 1. Explicit ?section= in URL — honored even if disabled (so we can show a notice)
  // 2. Persisted section — only if it's still enabled
  // 3. DEFAULT_SECTION
  let activeSection;
  if (sectionFromUrl) {
    activeSection = sectionFromUrl;
  } else if (persistedSection && !DISABLED_SECTIONS.has(persistedSection)) {
    activeSection = persistedSection;
  } else {
    activeSection = DEFAULT_SECTION;
  }

  // Persist the active section so links from elsewhere remember the last view
  useEffect(() => {
    if (!DISABLED_SECTIONS.has(activeSection)) {
      localStorage.setItem('admin-active-section', activeSection);
    }
  }, [activeSection]);

  // If the URL has no `section` param yet, write the resolved one back so deep links / refresh work
  useEffect(() => {
    if (!sectionFromUrl) {
      const next = new URLSearchParams(searchParams);
      next.set('section', activeSection);
      setSearchParams(next, { replace: true });
    }
  }, [sectionFromUrl, activeSection, searchParams, setSearchParams]);

  return (
    <div className="admin-console-wrapper admin-console-embedded">
      <div className="main-content">
        {/* Temporarily disabled sections — uncomment to restore */}
        {/* {activeSection === 'dashboard' && <DashboardSection />} */}
        {/* {activeSection === 'orders' && <OrdersSection />} */}
        {/* {activeSection === 'users' && <UsersSection />} */}
        {/* {activeSection === 'packages' && <PackagesSection />} */}
        {/* {activeSection === 'payment-gateway-geo' && <PaymentGatewayGeoSection />} */}

        {DISABLED_SECTIONS.has(activeSection) && (
          <DisabledSectionNotice section={activeSection} />
        )}

        {activeSection === 'visits' && <AdminVisitsSection />}
        {activeSection === 'transactions' && <AdminAllTransactionsSection />}
        {activeSection === 'blocked-ips' && <BlockedIPsSection />}
        {activeSection === 'payouts' && <AdminPayoutsSection />}
        {activeSection === 'brands-unpaid-transactions' && <BrandsUnpaidTransactionsSection />}
        {activeSection === 'brands' && <BrandsSection />}
        {activeSection === 'pending-brands' && <AdminPendingBrandsSection />}
        {activeSection === 'brand-wallets' && <BrandWalletsSection />}
        {activeSection === 'direct-purchase-links' && <DirectPurchaseLinksSection />}
        {activeSection === 'currencies' && <CurrenciesSection />}
        {activeSection === 'currency-geo' && <CurrencyGeoMappingsSection />}
        {activeSection === 'ip-whitelist' && <IpWhitelistSection />}
        {activeSection === 'system-tools' && <SystemToolsSection />}
        {activeSection === 'logs' && <AdminLogsSection />}
        {activeSection === 'bot-logs' && <BotLogsSection />}
        {activeSection === 'analytics' && <AnalyticsSection />}
        {activeSection === 'settings' && <SettingsSection />}
      </div>
    </div>
  );
}

function DisabledSectionNotice({ section }) {
  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-bold gradient-text mb-2">Section unavailable</h2>
      <p>
        The <strong>{section}</strong> section is temporarily disabled.
      </p>
    </div>
  );
}

// Placeholder components for sections not yet fully implemented
function AnalyticsSection() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold gradient-text">Advanced Analytics</h2>
        <select className="search-input p-2 rounded-lg">
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>Last year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">Revenue Analytics</h3>
          <div className="chart-container">
            <canvas id="analyticsRevenueChart"></canvas>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">Package Distribution</h3>
          <div className="chart-container">
            <canvas id="packageChart"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsSection() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold gradient-text">System Settings</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Platform Name</label>
              <input type="text" defaultValue="Prop Capitals" className="search-input p-3 rounded-lg w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Admin Email</label>
              <input type="email" defaultValue="admin@prop-capitals.com" className="search-input p-3 rounded-lg w-full" />
            </div>
            <button className="action-btn btn-primary">Save Changes</button>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Two-Factor Authentication</span>
              <button className="action-btn btn-primary">Enable</button>
            </div>
            <div className="flex items-center justify-between">
              <span>Session Timeout</span>
              <select className="search-input p-2 rounded-lg">
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
              </select>
            </div>
            <button className="action-btn btn-primary">Update Security</button>
          </div>
        </div>
      </div>
    </div>
  );
}
