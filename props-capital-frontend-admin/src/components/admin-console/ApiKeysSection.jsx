import React, { useState, useEffect } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import ApiKeyModal from './ApiKeyModal';
import { useTranslation } from "../../contexts/LanguageContext";

export default function ApiKeysSection() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ show: false, mode: null, item: null });
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await adminConsoleApi.apiKeys.list();
      setKeys(res.data?.keys || []);
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (formData) => {
    const res = await adminConsoleApi.apiKeys.create(formData);
    loadKeys();
    return res.data?.key;
  };

  const handleToggleStatus = async (key) => {
    const newStatus = key.status === 'active' ? 'revoked' : 'active';
    if (newStatus === 'revoked' && !confirm(t("adminConsole.apiKeys.revokeConfirm", { defaultValue: 'Revoke API key for "{{name}}"? This will block all requests from this project.', name: key.project_name }))) return;
    try {
      await adminConsoleApi.apiKeys.update(key.id, { status: newStatus });
      loadKeys();
    } catch (error) {
      alert(t("adminConsole.apiKeys.failedUpdate", { defaultValue: "Failed to update: {{error}}", error: error.message }));
    }
  };

  const handleDelete = async (key) => {
    if (!confirm(t("adminConsole.apiKeys.deleteConfirm", { defaultValue: 'Permanently delete API key for "{{name}}"? This cannot be undone.', name: key.project_name }))) return;
    try {
      await adminConsoleApi.apiKeys.delete(key.id);
      loadKeys();
    } catch (error) {
      alert(t("adminConsole.apiKeys.failedDelete", { defaultValue: "Failed to delete: {{error}}", error: error.message }));
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const maskKey = (key) => {
    if (!key) return '';
    return key.substring(0, 12) + '...' + key.substring(key.length - 4);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t("adminConsole.apiKeys.never", { defaultValue: "Never" });
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold gradient-text">{t("adminConsole.apiKeys.title", { defaultValue: "API Keys" })}</h2>
          <p className="text-gray-400 mt-1">{t("adminConsole.apiKeys.subtitle", { defaultValue: "Manage API keys for external projects using the Checkout API" })}</p>
        </div>
        <button
          className="action-btn btn-primary"
          onClick={() => setModalState({ show: true, mode: 'create', item: null })}
        >
          <i className="fas fa-plus mr-2"></i>{t("adminConsole.apiKeys.generateKey", { defaultValue: "Generate Key" })}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-spinner fa-spin text-2xl mb-3"></i>
          <p>{t("adminConsole.apiKeys.loading", { defaultValue: "Loading API keys..." })}</p>
        </div>
      ) : keys.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <i className="fas fa-key text-4xl text-gray-600 mb-4"></i>
          <p className="text-gray-400 text-lg">{t("adminConsole.apiKeys.noKeysYet", { defaultValue: "No API keys yet" })}</p>
          <p className="text-gray-500 mt-2">{t("adminConsole.apiKeys.noKeysHint", { defaultValue: "Generate a key to allow external projects to use the Checkout API" })}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {keys.map(key => (
            <div key={key.id} className="glass-panel p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{key.project_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      key.status === 'active'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {t(`adminConsole.apiKeys.status_${key.status}`, { defaultValue: key.status })}
                    </span>
                  </div>

                  {key.description && (
                    <p className="text-gray-400 text-sm mb-2">{key.description}</p>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm bg-black/30 px-3 py-1 rounded font-mono text-cyan-300">
                      {maskKey(key.api_key)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(key.api_key, key.id)}
                      className="text-gray-400 hover:text-cyan-400 transition-colors text-sm"
                      title={t("adminConsole.apiKeys.copyFullKey", { defaultValue: "Copy full key" })}
                    >
                      <i className={`fas ${copiedId === key.id ? 'fa-check text-green-400' : 'fa-copy'}`}></i>
                    </button>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-500">
                    <span><i className="fas fa-calendar mr-1"></i>{t("adminConsole.apiKeys.created", { defaultValue: "Created: {{date}}", date: formatDate(key.created_at) })}</span>
                    <span><i className="fas fa-clock mr-1"></i>{t("adminConsole.apiKeys.lastUsed", { defaultValue: "Last used: {{date}}", date: formatDate(key.last_used_at) })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleToggleStatus(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      key.status === 'active'
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    {key.status === 'active' ? t("adminConsole.apiKeys.revoke", { defaultValue: "Revoke" }) : t("adminConsole.apiKeys.activate", { defaultValue: "Activate" })}
                  </button>
                  <button
                    onClick={() => handleDelete(key)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    {t("adminConsole.apiKeys.delete", { defaultValue: "Delete" })}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalState.show && (
        <ApiKeyModal
          onClose={() => setModalState({ show: false, mode: null, item: null })}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
