import { useState, useEffect } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { createPageUrl } from '@/utils';
import { useTranslation } from "../../contexts/LanguageContext";

export default function DashboardSection() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState({
    revenue: 0,
    users: 0,
    orders: 0,
    credits: 0,
    vpnBlocks: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [brandBreakdown, setBrandBreakdown] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setRefreshing(true);
    try {
      const data = await adminConsoleApi.analytics.overview();
      setMetrics({
        revenue: data?.totals?.revenue || 0,
        users: data?.totals?.users || 0,
        orders: data?.totals?.orders || 0,
        credits: data?.totals?.credits_used || 0,
        vpnBlocks: data?.totals?.vpn_proxy_blocks || 0
      });
      setRecentOrders(data?.recent_orders || []);
      setBrandBreakdown(data?.brand_breakdown || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    const lines = [
      t("adminConsole.dashboard.reportTitle", { defaultValue: "PROP CAPITALS - DASHBOARD REPORT" }),
      `${t("adminConsole.dashboard.reportGenerated", { defaultValue: "Generated" })}: ${new Date().toLocaleString('en-US')}`,
      '',
      `=== ${t("adminConsole.dashboard.reportKeyMetrics", { defaultValue: "KEY METRICS" })} ===`,
      `${t("adminConsole.dashboard.totalRevenue", { defaultValue: "Total Revenue" })}: $${Number(metrics.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      `${t("adminConsole.dashboard.activeUsers", { defaultValue: "Active Users" })}: ${Number(metrics.users || 0).toLocaleString()}`,
      `${t("adminConsole.dashboard.totalOrders", { defaultValue: "Total Orders" })}: ${Number(metrics.orders || 0).toLocaleString()}`,
      `${t("adminConsole.dashboard.creditsUsed", { defaultValue: "Credits Used" })}: ${Number(metrics.credits || 0).toLocaleString()}`,
      `${t("adminConsole.dashboard.vpnProxyBlocks", { defaultValue: "VPN/Proxy Blocks" })}: ${Number(metrics.vpnBlocks || 0).toLocaleString()}`,
      '',
      `=== ${t("adminConsole.dashboard.reportRecentOrders", { defaultValue: "RECENT ORDERS" })} ===`,
      ...recentOrders.slice(0, 10).map(o =>
        `${o.order_id || '-'}  |  ${o.email || '-'}  |  $${Number(o.total_amount || 0).toFixed(2)}  |  ${new Date(o.created_at).toLocaleString()}`
      ),
      '',
      `=== ${t("adminConsole.dashboard.reportBrandBreakdown", { defaultValue: "BRAND BREAKDOWN" })} ===`,
      ...brandBreakdown.map(b =>
        `${b.name}  |  ${t("adminConsole.dashboard.orders", { defaultValue: "Orders" })}: ${b.total_orders}  |  ${t("adminConsole.dashboard.revenue", { defaultValue: "Revenue" })}: $${Number(b.total_revenue || 0).toFixed(2)}  |  ${t("adminConsole.dashboard.commission", { defaultValue: "Commission" })}: $${Number(b.total_commission || 0).toFixed(2)}  |  ${t("adminConsole.dashboard.payout", { defaultValue: "Payout" })}: $${Number(b.final_payout_amount || 0).toFixed(2)}`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (n) => '$' + new Intl.NumberFormat('en-US', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  }).format(Number(n || 0));

  const formatNumber = (n) => new Intl.NumberFormat('en-US', { 
    maximumFractionDigits: 0 
  }).format(Number(n || 0));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold gradient-text">{t("adminConsole.dashboard.title", { defaultValue: "Dashboard Overview" })}</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button className="action-btn btn-primary w-full sm:w-auto" onClick={loadDashboardData} disabled={refreshing}>
            <i className={`fas fa-sync-alt mr-2 ${refreshing ? 'fa-spin' : ''}`}></i>{refreshing ? t("adminConsole.dashboard.refreshing", { defaultValue: "Refreshing..." }) : t("adminConsole.dashboard.refresh", { defaultValue: "Refresh" })}
          </button>
          <button className="action-btn btn-secondary w-full sm:w-auto" onClick={handleExport}>
            <i className="fas fa-download mr-2"></i>{t("adminConsole.dashboard.export", { defaultValue: "Export" })}
          </button>
          <button className="action-btn btn-danger w-full sm:w-auto" onClick={() => window.location.href = createPageUrl('Dashboard')}>
            <i className="fas fa-arrow-left mr-2"></i>{t("adminConsole.dashboard.switchToUserDashboard", { defaultValue: "Switch to User Dashboard" })}
          </button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
        <div className="metric-card glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t("adminConsole.dashboard.totalRevenue", { defaultValue: "Total Revenue" })}</p>
              <p className="text-2xl font-bold text-cyan-400">{formatCurrency(metrics.revenue)}</p>
              <p className="text-green-400 text-xs"><i className="fas fa-arrow-up mr-1"></i>12.5%</p>
            </div>
            <i className="fas fa-dollar-sign text-3xl text-cyan-400 opacity-20"></i>
          </div>
        </div>
        
        <div className="metric-card glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t("adminConsole.dashboard.activeUsers", { defaultValue: "Active Users" })}</p>
              <p className="text-2xl font-bold text-purple-400">{formatNumber(metrics.users)}</p>
              <p className="text-green-400 text-xs"><i className="fas fa-arrow-up mr-1"></i>8.3%</p>
            </div>
            <i className="fas fa-users text-3xl text-purple-400 opacity-20"></i>
          </div>
        </div>
        
        <div className="metric-card glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t("adminConsole.dashboard.totalOrders", { defaultValue: "Total Orders" })}</p>
              <p className="text-2xl font-bold text-green-400">{formatNumber(metrics.orders)}</p>
              <p className="text-green-400 text-xs"><i className="fas fa-arrow-up mr-1"></i>15.7%</p>
            </div>
            <i className="fas fa-shopping-cart text-3xl text-green-400 opacity-20"></i>
          </div>
        </div>
        
        <div className="metric-card glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t("adminConsole.dashboard.creditsUsed", { defaultValue: "Credits Used" })}</p>
              <p className="text-2xl font-bold text-yellow-400">{formatNumber(metrics.credits)}</p>
              <p className="text-green-400 text-xs"><i className="fas fa-arrow-up mr-1"></i>22.1%</p>
            </div>
            <i className="fas fa-coins text-3xl text-yellow-400 opacity-20"></i>
          </div>
        </div>
        
        <div className="metric-card glass-card p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">{t("adminConsole.dashboard.vpnProxyBlocks", { defaultValue: "VPN/Proxy Blocks" })}</p>
              <p className="text-2xl font-bold text-red-400">{formatNumber(metrics.vpnBlocks)}</p>
              <p className="text-gray-400 text-xs"><i className="fas fa-shield-alt mr-1"></i>{t("adminConsole.dashboard.security", { defaultValue: "Security" })}</p>
            </div>
            <i className="fas fa-ban text-3xl text-red-400 opacity-20"></i>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="glass-panel p-6">
        <h3 className="text-xl font-semibold mb-4">{t("adminConsole.dashboard.recentActivity", { defaultValue: "Recent Activity" })}</h3>
        <div className="space-y-4">
          {recentOrders.slice(0, 5).map((order, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 glass-card rounded-lg gap-2">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-shopping-cart text-white"></i>
                </div>
                <div>
                  <p className="font-medium">{t("adminConsole.dashboard.orderLabel", { defaultValue: "Order {{id}}", id: order.order_id || '' })}</p>
                  <p className="text-sm text-gray-400">{order.email || ''} - {formatCurrency(order.total_amount)}</p>
                </div>
              </div>
              <span className="text-sm text-gray-400 sm:text-right">{new Date(order.created_at).toLocaleString()}</span>
            </div>
          ))}
          {recentOrders.length === 0 && (
            <p className="text-center text-gray-400 py-8">{t("adminConsole.dashboard.noRecentActivity", { defaultValue: "No recent activity" })}</p>
          )}
        </div>
      </div>
      
      {/* Brand Breakdown */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">{t("adminConsole.dashboard.brandPerformance", { defaultValue: "Brand Performance" })}</h3>
          <div className="flex space-x-2">
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              {t("adminConsole.dashboard.overview", { defaultValue: "Overview" })}
            </button>
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'brands' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveTab('brands')}
            >
              {t("adminConsole.dashboard.brandBreakdown", { defaultValue: "Brand Breakdown" })}
            </button>
          </div>
        </div>
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{t("adminConsole.dashboard.totalBrands", { defaultValue: "Total Brands" })}</span>
                <i className="fas fa-building text-blue-400"></i>
              </div>
              <p className="text-2xl font-bold text-blue-400">{brandBreakdown.length}</p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{t("adminConsole.dashboard.totalRevenue", { defaultValue: "Total Revenue" })}</span>
                <i className="fas fa-dollar-sign text-green-400"></i>
              </div>
              <p className="text-2xl font-bold text-green-400">{formatCurrency(brandBreakdown.reduce((sum, brand) => sum + (brand.total_revenue || 0), 0))}</p>
            </div>
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">{t("adminConsole.dashboard.totalCommissions", { defaultValue: "Total Commissions" })}</span>
                <i className="fas fa-percentage text-purple-400"></i>
              </div>
              <p className="text-2xl font-bold text-purple-400">{formatCurrency(brandBreakdown.reduce((sum, brand) => sum + (brand.total_commission || 0), 0))}</p>
            </div>
          </div>
        )}
        
        {activeTab === 'brands' && (
          <div className="space-y-4">
            {brandBreakdown.map((brand) => (
              <div key={brand.id} className="glass-card p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold">{brand.name}</h4>
                  <span className="text-sm text-gray-400">{t("adminConsole.dashboard.idLabel", { defaultValue: "ID: {{id}}", id: brand.id })}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <span className="text-sm text-gray-400">{t("adminConsole.dashboard.orders", { defaultValue: "Orders" })}</span>
                    <p className="text-lg font-bold">{brand.total_orders}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">{t("adminConsole.dashboard.revenue", { defaultValue: "Revenue" })}</span>
                    <p className="text-lg font-bold text-green-400">{formatCurrency(brand.total_revenue)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">{t("adminConsole.dashboard.commission", { defaultValue: "Commission" })}</span>
                    <p className="text-lg font-bold text-blue-400">{formatCurrency(brand.total_commission)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">{t("adminConsole.dashboard.finalPayout", { defaultValue: "Final Payout" })}</span>
                    <p className="text-lg font-bold text-purple-400">{formatCurrency(brand.final_payout_amount)}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div>
                    <span className="text-sm text-gray-400">{t("adminConsole.dashboard.paid", { defaultValue: "Paid" })}</span>
                    <p className="text-sm font-semibold text-green-400">{formatCurrency(brand.paid_commission)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">{t("adminConsole.dashboard.unpaid", { defaultValue: "Unpaid" })}</span>
                    <p className="text-sm font-semibold text-orange-400">{formatCurrency(brand.unpaid_commission)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">{t("adminConsole.dashboard.rollingReserve", { defaultValue: "Rolling Reserve" })}</span>
                    <p className="text-sm font-semibold text-yellow-400">{formatCurrency(brand.rolling_reserve)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">{t("adminConsole.dashboard.status", { defaultValue: "Status" })}</span>
                    <p className="text-sm font-semibold text-gray-400">
                      {brand.total_orders > 0 ? t("adminConsole.dashboard.active", { defaultValue: "Active" }) : t("adminConsole.dashboard.inactive", { defaultValue: "Inactive" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {brandBreakdown.length === 0 && (
              <p className="text-center text-gray-400 py-8">{t("adminConsole.dashboard.noBrandData", { defaultValue: "No brand data available" })}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
