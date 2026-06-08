import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminConsoleApi } from '@/api/adminConsole';
import { useTranslation } from "../../contexts/LanguageContext";
// Imports kept for the temporarily-disabled sections so they can be re-enabled easily.
// import DashboardSection from './DashboardSection';
import OrdersSection from './OrdersSection';
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
import QuickLinksSection from './QuickLinksSection';
import BrandsUnpaidTransactionsSection from './BrandsUnpaidTransactionsSection';
import './AdminConsole.css';

// Sections currently disabled — visiting their URLs will render a small notice instead.
const DISABLED_SECTIONS = new Set([
  'dashboard',
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
        {activeSection === 'orders' && <OrdersSection />}
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
        {activeSection === 'quick-links' && <QuickLinksSection />}
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
  const { t } = useTranslation();
  return (
    <div className="glass-panel p-6">
      <h2 className="text-2xl font-bold gradient-text mb-2">{t("adminConsole.settings.sectionUnavailable", { defaultValue: "Section unavailable" })}</h2>
      <p>
        {t("adminConsole.settings.sectionDisabledPrefix", { defaultValue: "The" })} <strong>{section}</strong> {t("adminConsole.settings.sectionDisabledSuffix", { defaultValue: "section is temporarily disabled." })}
      </p>
    </div>
  );
}

// Placeholder components for sections not yet fully implemented
function AnalyticsSection() {
  const { t } = useTranslation();
  const [days, setDays] = React.useState(30);
  const [revenueData, setRevenueData] = React.useState(null);
  const [packageData, setPackageData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const revenueChartRef = React.useRef(null);
  const packageChartRef = React.useRef(null);
  const revenueCanvasRef = React.useRef(null);
  const packageCanvasRef = React.useRef(null);

  // Fetch from backend whenever the time range changes.
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      adminConsoleApi.analytics.revenueChart(days).catch(() => null),
      adminConsoleApi.analytics.packageDistribution(days, 10).catch(() => null),
    ])
      .then(([rev, pkg]) => {
        if (cancelled) return;
        setRevenueData(rev);
        setPackageData(pkg);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [days]);

  // Render / update the line chart for revenue + payouts
  React.useEffect(() => {
    if (!revenueData?.series || !revenueCanvasRef.current) return;
    const Chart = window.Chart;
    if (!Chart) return; // Chart.js loaded via CDN in index.html
    const labels = revenueData.series.map((s) => s.date);
    const revenue = revenueData.series.map((s) => s.revenue);
    const payouts = revenueData.series.map((s) => s.payouts);

    if (revenueChartRef.current) {
      revenueChartRef.current.data.labels = labels;
      revenueChartRef.current.data.datasets[0].data = revenue;
      revenueChartRef.current.data.datasets[1].data = payouts;
      revenueChartRef.current.update();
      return;
    }

    revenueChartRef.current = new Chart(revenueCanvasRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: t("adminConsole.analytics.revenueUsd", { defaultValue: "Revenue (USD)" }),
            data: revenue,
            borderColor: '#D97706',
            backgroundColor: 'rgba(217, 119, 6, 0.1)',
            fill: true,
            tension: 0.3,
          },
          {
            label: t("adminConsole.analytics.payoutsUsd", { defaultValue: "Payouts (USD)" }),
            data: payouts,
            borderColor: '#7c3aed',
            backgroundColor: 'rgba(124, 58, 237, 0.08)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }, [revenueData]);

  // Render / update the donut chart for package distribution
  React.useEffect(() => {
    if (!packageData?.buckets || !packageCanvasRef.current) return;
    const Chart = window.Chart;
    if (!Chart) return;
    const labels = packageData.buckets.map((b) => b.name);
    const values = packageData.buckets.map((b) => b.revenue);

    if (packageChartRef.current) {
      packageChartRef.current.data.labels = labels;
      packageChartRef.current.data.datasets[0].data = values;
      packageChartRef.current.update();
      return;
    }

    packageChartRef.current = new Chart(packageCanvasRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: [
              '#D97706', '#7c3aed', '#10B981', '#3B82F6', '#EF4444',
              '#F59E0B', '#06B6D4', '#EC4899', '#84CC16', '#8B5CF6',
            ],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }, [packageData]);

  // Cleanup chart instances on unmount
  React.useEffect(() => {
    return () => {
      revenueChartRef.current?.destroy?.();
      packageChartRef.current?.destroy?.();
      revenueChartRef.current = null;
      packageChartRef.current = null;
    };
  }, []);

  const totalRevenue = revenueData?.series?.reduce((acc, s) => acc + s.revenue, 0) ?? 0;
  const totalPayouts = revenueData?.series?.reduce((acc, s) => acc + s.payouts, 0) ?? 0;
  const totalOrders = packageData?.buckets?.reduce((acc, b) => acc + b.orders, 0) ?? 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
        <h2 className="text-3xl font-bold gradient-text">{t("adminConsole.analytics.title", { defaultValue: "Advanced Analytics" })}</h2>
        <select
          className="search-input p-2 rounded-lg"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>{t("adminConsole.analytics.last7Days", { defaultValue: "Last 7 days" })}</option>
          <option value={30}>{t("adminConsole.analytics.last30Days", { defaultValue: "Last 30 days" })}</option>
          <option value={90}>{t("adminConsole.analytics.last90Days", { defaultValue: "Last 90 days" })}</option>
          <option value={365}>{t("adminConsole.analytics.lastYear", { defaultValue: "Last year" })}</option>
        </select>
      </div>

      {/* Top-line totals for the selected window */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-gray-500 mb-1">{t("adminConsole.analytics.revenueWindow", { defaultValue: "Revenue ({{days}}d)", days })}</p>
          <p className="text-2xl font-bold">${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-gray-500 mb-1">{t("adminConsole.analytics.payoutsWindow", { defaultValue: "Payouts ({{days}}d)", days })}</p>
          <p className="text-2xl font-bold">${totalPayouts.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <p className="text-sm text-gray-500 mb-1">{t("adminConsole.analytics.ordersWindow", { defaultValue: "Orders ({{days}}d)", days })}</p>
          <p className="text-2xl font-bold">{totalOrders.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">{t("adminConsole.analytics.revenueAndPayouts", { defaultValue: "Revenue & Payouts" })}</h3>
          <div className="chart-container" style={{ height: 320 }}>
            {loading && !revenueData ? (
              <p className="text-sm text-gray-500">{t("adminConsole.analytics.loadingChart", { defaultValue: "Loading chart…" })}</p>
            ) : (
              <canvas ref={revenueCanvasRef}></canvas>
            )}
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">{t("adminConsole.analytics.packageDistribution", { defaultValue: "Package Distribution" })}</h3>
          <div className="chart-container" style={{ height: 320 }}>
            {loading && !packageData ? (
              <p className="text-sm text-gray-500">{t("adminConsole.analytics.loadingChart", { defaultValue: "Loading chart…" })}</p>
            ) : packageData?.buckets?.length ? (
              <canvas ref={packageCanvasRef}></canvas>
            ) : (
              <p className="text-sm text-gray-500">{t("adminConsole.analytics.noPackageSales", { defaultValue: "No package sales in this window yet." })}</p>
            )}
          </div>
        </div>
      </div>

      {/* Top packages table */}
      {packageData?.buckets?.length > 0 && (
        <div className="glass-panel p-6 mt-6">
          <h3 className="text-xl font-semibold mb-4">{t("adminConsole.analytics.topPackages", { defaultValue: "Top Packages" })}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2">{t("adminConsole.analytics.package", { defaultValue: "Package" })}</th>
                <th className="text-right py-2">{t("adminConsole.analytics.accountSize", { defaultValue: "Account Size" })}</th>
                <th className="text-right py-2">{t("adminConsole.analytics.orders", { defaultValue: "Orders" })}</th>
                <th className="text-right py-2">{t("adminConsole.analytics.revenue", { defaultValue: "Revenue" })}</th>
              </tr>
            </thead>
            <tbody>
              {packageData.buckets.map((b) => (
                <tr key={b.challenge_id} className="border-t border-gray-200">
                  <td className="py-2">{b.name}</td>
                  <td className="py-2 text-right">${Number(b.account_size).toLocaleString()}</td>
                  <td className="py-2 text-right">{b.orders}</td>
                  <td className="py-2 text-right">${Number(b.revenue).toLocaleString('en-US', { maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SettingsSection() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold gradient-text">{t("adminConsole.settings.title", { defaultValue: "System Settings" })}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">{t("adminConsole.settings.generalSettings", { defaultValue: "General Settings" })}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t("adminConsole.settings.platformName", { defaultValue: "Platform Name" })}</label>
              <input type="text" defaultValue="Prop Capitals" className="search-input p-3 rounded-lg w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("adminConsole.settings.adminEmail", { defaultValue: "Admin Email" })}</label>
              <input type="email" defaultValue="admin@prop-capitals.com" className="search-input p-3 rounded-lg w-full" />
            </div>
            <button className="action-btn btn-primary">{t("adminConsole.settings.saveChanges", { defaultValue: "Save Changes" })}</button>
          </div>
        </div>

        <div className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">{t("adminConsole.settings.securitySettings", { defaultValue: "Security Settings" })}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>{t("adminConsole.settings.twoFactorAuth", { defaultValue: "Two-Factor Authentication" })}</span>
              <button className="action-btn btn-primary">{t("adminConsole.settings.enable", { defaultValue: "Enable" })}</button>
            </div>
            <div className="flex items-center justify-between">
              <span>{t("adminConsole.settings.sessionTimeout", { defaultValue: "Session Timeout" })}</span>
              <select className="search-input p-2 rounded-lg">
                <option>{t("adminConsole.settings.timeout30min", { defaultValue: "30 minutes" })}</option>
                <option>{t("adminConsole.settings.timeout1hour", { defaultValue: "1 hour" })}</option>
                <option>{t("adminConsole.settings.timeout4hours", { defaultValue: "4 hours" })}</option>
              </select>
            </div>
            <button className="action-btn btn-primary">{t("adminConsole.settings.updateSecurity", { defaultValue: "Update Security" })}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
