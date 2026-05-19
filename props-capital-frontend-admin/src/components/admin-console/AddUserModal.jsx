import React, { useState } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { useTranslation } from "../../contexts/LanguageContext";

export default function AddUserModal({ onClose, onUserCreated }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'user',
    tier: 'none',
    credits: 0,
    unlimited: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.password) {
      alert(t("adminConsole.addUserModal.fillRequired", { defaultValue: "Please fill in all required fields" }));
      return;
    }

    if (formData.password.length < 6) {
      alert(t("adminConsole.addUserModal.passwordMin", { defaultValue: "Password must be at least 6 characters" }));
      return;
    }
    
    setLoading(true);
    
    try {
      const userData = {
        full_name: formData.fullName,
        email: formData.email.toLowerCase(),
        password: formData.password,
        user_type: formData.role,
        plan: formData.tier,
        credits_balance: formData.unlimited ? 0 : formData.credits,
        credits_unlimited: formData.unlimited
      };
      
      await adminConsoleApi.users.create(userData);
      
      alert(t("adminConsole.addUserModal.createSuccess", { defaultValue: '✅ User "{{name}}" created successfully!', name: formData.fullName }));
      onUserCreated();
    } catch (error) {
      alert(t("adminConsole.addUserModal.createFailed", { defaultValue: "❌ Failed to create user: {{error}}", error: error.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="glass-card w-full max-w-lg p-6 rounded-xl relative z-10">
        <h3 className="text-xl font-semibold mb-4">{t("adminConsole.addUserModal.title", { defaultValue: "Add New User" })}</h3>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm text-gray-300 block mb-2">
                {t("adminConsole.addUserModal.fullName", { defaultValue: "Full Name" })} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className="search-input p-3 rounded-lg w-full"
                placeholder={t("adminConsole.addUserModal.fullNamePlaceholder", { defaultValue: "John Doe" })}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 block mb-2">
                {t("adminConsole.addUserModal.email", { defaultValue: "Email" })} <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                className="search-input p-3 rounded-lg w-full"
                placeholder={t("adminConsole.addUserModal.emailPlaceholder", { defaultValue: "user@example.com" })}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm text-gray-300 block mb-2">
                {t("adminConsole.addUserModal.password", { defaultValue: "Password" })} <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                className="search-input p-3 rounded-lg w-full"
                placeholder={t("adminConsole.addUserModal.passwordPlaceholder", { defaultValue: "Min 6 characters" })}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 block mb-2">{t("adminConsole.addUserModal.role", { defaultValue: "Role" })}</label>
                <select
                  className="search-input p-3 rounded-lg w-full"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">{t("adminConsole.addUserModal.roleUser", { defaultValue: "User" })}</option>
                  <option value="admin">{t("adminConsole.addUserModal.roleAdmin", { defaultValue: "Admin" })}</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-300 block mb-2">{t("adminConsole.addUserModal.subscriptionTier", { defaultValue: "Subscription Tier" })}</label>
                <select
                  className="search-input p-3 rounded-lg w-full"
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                >
                  <option value="none">{t("adminConsole.addUserModal.tierNone", { defaultValue: "None" })}</option>
                  <option value="starter">{t("adminConsole.addUserModal.tierStarter", { defaultValue: "Starter" })}</option>
                  <option value="pro">{t("adminConsole.addUserModal.tierPro", { defaultValue: "Pro" })}</option>
                  <option value="expert">{t("adminConsole.addUserModal.tierExpert", { defaultValue: "Expert" })}</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-300 block mb-2">{t("adminConsole.addUserModal.initialCredits", { defaultValue: "Initial Credits" })}</label>
                <input
                  type="number"
                  min="0"
                  className="search-input p-3 rounded-lg w-full"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                  disabled={formData.unlimited}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer p-3">
                  <input
                    type="checkbox"
                    className="w-4 h-4"
                    checked={formData.unlimited}
                    onChange={(e) => setFormData({ ...formData, unlimited: e.target.checked, credits: 0 })}
                  />
                  <span>{t("adminConsole.addUserModal.unlimitedCredits", { defaultValue: "Unlimited Credits" })}</span>
                </label>
              </div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-sm text-blue-300">
              <i className="fas fa-info-circle mr-2"></i>
              {t("adminConsole.addUserModal.welcomeEmailNotice", { defaultValue: "User will receive a welcome email with their credentials." })}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="action-btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t("adminConsole.addUserModal.cancel", { defaultValue: "Cancel" })}
            </button>
            <button
              type="submit"
              className="action-btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>{t("adminConsole.addUserModal.creating", { defaultValue: "Creating..." })}
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus mr-2"></i>{t("adminConsole.addUserModal.createUser", { defaultValue: "Create User" })}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
