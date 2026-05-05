import React, { useState } from 'react';

export default function ApiKeyModal({ onClose, onCreate }) {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdKey, setCreatedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);
    try {
      const key = await onCreate({
        project_name: projectName.trim(),
        description: description.trim() || undefined,
      });
      setCreatedKey(key);
    } catch (err) {
      setError(err.message || 'Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (createdKey?.api_key) {
      navigator.clipboard.writeText(createdKey.api_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass-panel max-w-lg w-full mx-4 p-6 rounded-xl" onClick={e => e.stopPropagation()}>

        {!createdKey ? (
          <>
            <h3 className="text-2xl font-bold mb-6 gradient-text">Generate API Key</h3>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 p-3 mb-4 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. My E-Commerce App"
                    className="search-input p-3 rounded-lg w-full"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description <span className="text-gray-500">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this key used for?"
                    className="search-input p-3 rounded-lg w-full"
                    rows="2"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 action-btn btn-primary"
                  >
                    {loading ? (
                      <><i className="fas fa-spinner fa-spin mr-2"></i>Generating...</>
                    ) : (
                      <><i className="fas fa-key mr-2"></i>Generate Key</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 action-btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <i className="fas fa-check text-green-400 text-2xl"></i>
              </div>
              <h3 className="text-2xl font-bold gradient-text">API Key Created</h3>
              <p className="text-gray-400 mt-2">
                For <strong className="text-white">{createdKey.project_name}</strong>
              </p>
            </div>

            <div className="bg-black/40 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-yellow-400 text-xs font-medium">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  Copy this key now — it won't be shown in full again
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-cyan-300 bg-black/30 p-2 rounded break-all">
                  {createdKey.api_key}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors whitespace-nowrap"
                >
                  <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-1`}></i>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-black/20 rounded-lg p-3 mb-6 text-sm text-gray-400">
              <p className="mb-1"><strong>Usage:</strong> Send this key in the <code className="text-cyan-300">X-API-Key</code> header:</p>
              <code className="text-xs text-gray-500 block mt-1">
                curl -H "X-API-Key: {createdKey.api_key.substring(0, 20)}..." ...
              </code>
            </div>

            <button onClick={onClose} className="w-full action-btn btn-primary">
              Done
            </button>
          </>
        )}
      </div>
    </div>
  );
}
