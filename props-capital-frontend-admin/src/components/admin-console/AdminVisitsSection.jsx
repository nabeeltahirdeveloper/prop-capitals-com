import { useState, useEffect } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { useTranslation } from "../../contexts/LanguageContext";

export default function AdminVisitsSection() {
  const { t } = useTranslation();
  const [, setVisits] = useState([]);
  const [stats, setStats] = useState({ total_visits: 0, total_clicks: 0 });
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);
  const [, setMeta] = useState({ total: 0, pages: 1 });
  const [days, setDays] = useState(30);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadVisits();
    loadLinks();
  }, [page]);

  useEffect(() => {
    loadStats();
  }, [days]);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await adminConsoleApi.visits.list({ page: String(page), pageSize: '20' });
      setVisits(data.visits || []);
      setMeta(data.meta || { total: 0, pages: 1 });
    } catch (error) {
      console.error('Failed to load visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminConsoleApi.visits.getStats({ days: String(days) });
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadLinks = async () => {
    try {
      // Admin doesn't filter by links - views all visits across all brands
      setLinks([]);
    } catch (error) {
      console.error('Failed to load links:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess(t("adminConsole.visits.linkCopied", { defaultValue: "Link copied to clipboard!" }));
    setTimeout(() => setSuccess(''), 2000);
  };

  const getTrackingUrl = (link) => {
    const url = new URL(link.destination_url);
    url.searchParams.set('link', link.link_id);
    return url.toString();
  };

  if (loading && page === 1) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-cyan-400 mb-4"></i>
        <p className="text-gray-400">{t("adminConsole.visits.loading", { defaultValue: "Loading visits..." })}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">{t("adminConsole.visits.title", { defaultValue: "Visits" })}</h2>
          <p className="text-sm text-gray-400 mt-1">{t("adminConsole.visits.subtitle", { defaultValue: "Track visitor analytics and engagement" })}</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="search-input p-3 rounded-lg w-full sm:w-auto"
        >
          <option value="7">{t("adminConsole.visits.last7Days", { defaultValue: "Last 7 days" })}</option>
          <option value="30">{t("adminConsole.visits.last30Days", { defaultValue: "Last 30 days" })}</option>
          <option value="90">{t("adminConsole.visits.last90Days", { defaultValue: "Last 90 days" })}</option>
        </select>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">{t("adminConsole.visits.totalVisits", { defaultValue: "Total Visits" })}</h3>
              <i className="fas fa-eye text-cyan-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_visits || 0}</p>
            <p className="text-xs text-gray-500/70 mt-1">{t("adminConsole.visits.allTime", { defaultValue: "All time" })}</p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">{t("adminConsole.visits.periodVisits", { defaultValue: "Period Visits" })}</h3>
              <i className="fas fa-calendar text-emerald-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.daily_stats?.reduce((sum, day) => sum + (day.total_visits || 0), 0) || 0}
            </p>
            <p className="text-xs text-gray-500/70 mt-1">{t("adminConsole.visits.lastNDays", { days: stats.period_days, defaultValue: "Last {{days}} days" })}</p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">{t("adminConsole.visits.avgPerDay", { defaultValue: "Avg Per Day" })}</h3>
              <i className="fas fa-chart-line text-violet-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold text-white">
              {stats.daily_stats?.length > 0
                ? Math.round(stats.daily_stats.reduce((sum, day) => sum + (day.total_visits || 0), 0) / stats.daily_stats.length)
                : 0}
            </p>
            <p className="text-xs text-gray-500/70 mt-1">{t("adminConsole.visits.dailyAverage", { defaultValue: "Daily average" })}</p>
          </div>

          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-400">{t("adminConsole.visits.vpnProxyBlocks", { defaultValue: "VPN/Proxy Blocks" })}</h3>
              <i className="fas fa-ban text-red-400 text-xl"></i>
            </div>
            <p className="text-3xl font-bold text-white">{stats.total_vpn_proxy_blocks || 0}</p>
            <p className="text-xs text-gray-500/70 mt-1">
              {t("adminConsole.visits.vpnProxyBreakdown", { vpn: stats.vpn_blocks || 0, proxy: stats.proxy_blocks || 0, defaultValue: "VPN: {{vpn}} | Proxy: {{proxy}}" })}
            </p>
          </div>
        </div>
      )}

      {/* Daily Stats Chart */}
      {stats && stats.daily_stats && stats.daily_stats.length > 0 && (
        <div className="glass-panel p-6 mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">{t("adminConsole.visits.visitsOverTime", { defaultValue: "Visits Over Time" })}</h3>
          <div className="space-y-2">
            {stats.daily_stats.slice(0, 10).map((day) => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="text-sm text-gray-400 w-24">
                  {new Date(day.date).toLocaleDateString()}
                </span>
                <div className="flex-1 bg-white/10 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.min(100, (day.total_visits / Math.max(...stats.daily_stats.map(d => d.total_visits))) * 100)}%`
                    }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {day.total_visits}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visits Statistics per Link */}
      <div className="mb-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">{t("adminConsole.visits.statsPerLink", { defaultValue: "Visits Statistics per Link" })}</h2>
            <p className="text-gray-400">
              {t("adminConsole.visits.statsPerLinkDesc", { defaultValue: "Detailed performance breakdown for each of your brand links." })}
            </p>
          </div>
          <button
            onClick={loadLinks}
            disabled={loading}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            {t("adminConsole.visits.refresh", { defaultValue: "Refresh" })}
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
            <i className="fas fa-check-circle mr-2"></i>
            {success}
          </div>
        )}

        {/* Main Link */}
        {links.find(l => l.is_main_link) && (
          <div className="glass-card rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">{t("adminConsole.visits.mainLink", { defaultValue: "Main link" })}</h3>
            
            <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 p-3 rounded-lg">
              <input
                type="text"
                value={getTrackingUrl(links.find(l => l.is_main_link))}
                readOnly
                className="flex-1 bg-transparent text-gray-300 outline-none font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(getTrackingUrl(links.find(l => l.is_main_link)))}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
              >
                <i className="fas fa-copy mr-2"></i>
                {t("adminConsole.visits.copy", { defaultValue: "Copy" })}
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center text-gray-400 text-sm mb-2">
                  <i className="fas fa-eye mr-2"></i>
                  {t("adminConsole.visits.visits", { defaultValue: "Visits" })}
                </div>
                <div className="text-3xl font-bold text-cyan-400">
                  {links.find(l => l.is_main_link)?.visits_count || 0}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center text-gray-400 text-sm mb-2">
                  <i className="fas fa-receipt mr-2"></i>
                  {t("adminConsole.visits.transactions", { defaultValue: "Transactions" })}
                </div>
                <div className="text-3xl font-bold text-violet-400">
                  {links.find(l => l.is_main_link)?.transactions_count || 0}
                </div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center text-gray-400 text-sm mb-2">
                  <i className="fas fa-percentage mr-2"></i>
                  {t("adminConsole.visits.convRate", { defaultValue: "Conv. Rate" })}
                </div>
                <div className={`text-3xl font-bold ${
                  Number(links.find(l => l.is_main_link)?.conversion_rate || 0) >= 50 ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  {Number(links.find(l => l.is_main_link)?.conversion_rate || 0).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Package Links */}
        {links.filter(l => !l.is_main_link).length > 0 && (
          <div className="space-y-6">
            {links.filter(l => !l.is_main_link).map((link) => (
              <div key={link.id} className="glass-card rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">{link.name}</h3>
                
                <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 p-3 rounded-lg">
                  <input
                    type="text"
                    value={getTrackingUrl(link)}
                    readOnly
                    className="flex-1 bg-transparent text-gray-300 outline-none font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(getTrackingUrl(link))}
                    className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
                  >
                    <i className="fas fa-copy mr-2"></i>
                    Copy
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-gray-400 text-sm mb-2">
                      <i className="fas fa-eye mr-2"></i>
                      Visits
                    </div>
                    <div className="text-3xl font-bold text-cyan-400">
                      {link.visits_count || 0}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center text-gray-400 text-sm mb-2">
                      <i className="fas fa-receipt mr-2"></i>
                      Transactions
                    </div>
                    <div className="text-3xl font-bold text-violet-400">
                      {link.transactions_count || 0}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center text-gray-400 text-sm mb-2">
                      <i className="fas fa-percentage mr-2"></i>
                      Conv. Rate
                    </div>
                    <div className={`text-3xl font-bold ${
                      Number(link.conversion_rate || 0) >= 50 
                        ? 'text-emerald-400' 
                        : Number(link.conversion_rate || 0) > 0 
                          ? 'text-amber-400' 
                          : 'text-gray-400'
                    }`}>
                      {Number(link.conversion_rate || 0).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Links */}
        {links.length === 0 && (
          <div className="glass-card rounded-lg p-12 text-center">
            <i className="fas fa-link text-6xl text-gray-500 mb-4"></i>
            <h3 className="text-xl font-bold text-gray-300 mb-2">{t("adminConsole.visits.noBrandLinks", { defaultValue: "No Brand Links" })}</h3>
            <p className="text-gray-400">
              {t("adminConsole.visits.noBrandLinksDesc", { defaultValue: "Contact your administrator to set up tracking links for your brand." })}
            </p>
          </div>
        )}
      </div>

      {/* Integration Instructions */}
      <div className="glass-panel p-6 mt-6">
        <h3 className="text-xl font-semibold text-white mb-3">
          <i className="fas fa-info-circle text-cyan-400 mr-2"></i>
          {t("adminConsole.visits.integrationTitle", { defaultValue: "Visit Tracking Integration" })}
        </h3>
        <p className="text-gray-400 mb-3">
          {t("adminConsole.visits.integrationDesc", { defaultValue: "To track visits on your website, add this script to your pages:" })}
        </p>
        <div className="bg-black/30 p-4 rounded-lg font-mono text-sm border border-white/10">
          <code className="text-gray-300">
            {`<script>
  fetch('${window.location.origin}/api/track/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brand_id: YOUR_BRAND_ID,
      page_visited: window.location.pathname
    })
  });
</script>`}
          </code>
        </div>
      </div>
    </div>
  );
}





