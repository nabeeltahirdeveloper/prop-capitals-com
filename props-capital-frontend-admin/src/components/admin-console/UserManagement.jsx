import React, { useState } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { useTranslation } from "../../contexts/LanguageContext";

const Tiers = ["none", "starter", "pro", "expert"];

export default function UserManagement({ users, onUserUpdate }) {
  const { t } = useTranslation();
  const [updatingId, setUpdatingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTierChange = async (userId, currentTier, newTier) => {
    if (currentTier === newTier) return;
    
    setUpdatingId(userId);
    try {
      await adminConsoleApi.users.update(userId, { plan: newTier });
      onUserUpdate(); // Refresh data in parent
    } catch (error) {
      console.error("Failed to update user tier:", error);
      alert(t("adminConsole.users.failedUpdateTier", { defaultValue: "Failed to update user tier" }));
    } finally {
      setUpdatingId(null);
    }
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const getBadgeColor = (role) => {
    if (role === 'admin') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };
  
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (user.full_name || '').toLowerCase().includes(query) ||
           (user.email || '').toLowerCase().includes(query);
  });
  
  // Calculate stats
  const stats = {
    total: users.length,
    starter: users.filter(u => (u.subscription_tier || '').toLowerCase() === 'starter').length,
    pro: users.filter(u => (u.subscription_tier || '').toLowerCase() === 'pro').length,
    expert: users.filter(u => (u.subscription_tier || '').toLowerCase() === 'expert').length
  };
  
  return (
    <div>
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">{t("adminConsole.users.totalUsers", { defaultValue: "Total Users" })}</h3>
          <p className="text-3xl font-bold text-cyan-400">{stats.total}</p>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">{t("adminConsole.users.starterPlan", { defaultValue: "Starter Plan" })}</h3>
          <p className="text-3xl font-bold text-green-400">{stats.starter}</p>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">{t("adminConsole.users.proPlan", { defaultValue: "Pro Plan" })}</h3>
          <p className="text-3xl font-bold text-purple-400">{stats.pro}</p>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2">{t("adminConsole.users.expertPlan", { defaultValue: "Expert Plan" })}</h3>
          <p className="text-3xl font-bold text-yellow-400">{stats.expert}</p>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="glass-panel p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder={t("adminConsole.users.searchPlaceholder", { defaultValue: "Search users by name or email..." })}
            className="search-input p-3 rounded-lg w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div
          className="table-container users-table-scroll overflow-x-auto overflow-y-auto rounded-xl border border-gray-800"
          style={{ maxHeight: '600px' }}
        >
          <table className="w-full min-w-[920px]">
            <thead className="border-b border-gray-700 sticky top-0 z-10 bg-[#161a2d]">
              <tr>
                <th className="text-left p-4">{t("adminConsole.users.colUser", { defaultValue: "User" })}</th>
                <th className="text-left p-4">{t("adminConsole.users.colEmail", { defaultValue: "Email" })}</th>
                <th className="text-left p-4">{t("adminConsole.users.colRole", { defaultValue: "Role" })}</th>
                <th className="text-left p-4">{t("adminConsole.users.colSubscriptionTier", { defaultValue: "Subscription Tier" })}</th>
                <th className="text-left p-4">{t("adminConsole.users.colCredits", { defaultValue: "Credits" })}</th>
                <th className="text-left p-4">{t("adminConsole.users.colCreated", { defaultValue: "Created" })}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const initials = getInitials(user.full_name);
                const roleBadge = getBadgeColor(user.role);
                const tier = user.subscription_tier || 'none';
                const credits = user.credits_unlimited ? t("adminConsole.users.unlimited", { defaultValue: "Unlimited" }) : (user.credits_balance || 0);
                const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : t("adminConsole.users.notAvailable", { defaultValue: "N/A" });
                
                return (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30 align-middle">
                    <td className="p-4" data-label="User">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold">{initials}</span>
                        </div>
                        <span className="truncate max-w-[180px]" title={user.full_name || t("adminConsole.users.notAvailable", { defaultValue: "N/A" })}>{user.full_name || t("adminConsole.users.notAvailable", { defaultValue: "N/A" })}</span>
                      </div>
                    </td>
                    <td className="p-4" data-label="Email">
                      <span className="truncate block max-w-[260px]" title={user.email || t("adminConsole.users.notAvailable", { defaultValue: "N/A" })}>{user.email || t("adminConsole.users.notAvailable", { defaultValue: "N/A" })}</span>
                    </td>
                    <td className="p-4" data-label="Role">
                      <span className={`status-badge ${roleBadge}`}>{t(`adminConsole.users.role_${user.role || 'user'}`, { defaultValue: user.role || 'user' })}</span>
                    </td>
                    <td className="p-4" data-label="Subscription Tier">
                      <select
                        className="search-input p-2 rounded-lg"
                        value={tier}
                        onChange={(e) => handleTierChange(user.id, tier, e.target.value)}
                        disabled={updatingId === user.id}
                      >
                        {Tiers.map(tierOption => (
                          <option key={tierOption} value={tierOption} className="capitalize">
                            {t(`adminConsole.users.tier_${tierOption}`, { defaultValue: tierOption.charAt(0).toUpperCase() + tierOption.slice(1) })}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4" data-label="Credits">
                      <span className={`text-sm ${user.credits_unlimited ? 'text-yellow-400' : 'text-gray-300'}`}>
                        {credits}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400" data-label="Created">{createdDate}</td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    {t("adminConsole.users.noUsersFound", { defaultValue: "No users found" })}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}