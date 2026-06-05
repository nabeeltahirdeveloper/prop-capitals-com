import React, { useEffect, useMemo, useState } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import QuickLinkModal from './QuickLinkModal';

/**
 * QuickLinksSection
 * ─────────────────
 * Admin list of one-shot Quick Links. Card-based layout that auto-themes
 * (light/dark) by leaning on the same `bg-card / text-foreground /
 * border-border / muted-foreground` tokens the rest of the admin panel
 * uses. No hard-coded `bg-white/X` or `text-gray-XXX` that would clash in
 * light mode.
 */
export default function QuickLinksSection() {
  const [links, setLinks] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [copyToast, setCopyToast] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminConsoleApi.quickLinks.list({ page: String(page) });
      setLinks(data.links || []);
      setMeta(data.meta || { total: 0, page: 1, pages: 1 });
    } catch (err) {
      console.error('Failed to load quick links', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url || '');
    setCopyToast('URL copied to clipboard');
    setTimeout(() => setCopyToast(''), 1800);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this Quick Link? This cannot be undone.')) return;
    try {
      await adminConsoleApi.quickLinks.delete(id);
      load();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const stats = useMemo(() => {
    const total = meta.total ?? links.length;
    const active = links.filter((l) => l.is_active).length;
    const used = links.filter((l) => !l.is_active).length;
    return { total, active, used };
  }, [links, meta]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return links;
    return links.filter((l) =>
      [
        l.customer_email,
        l.customer_phone,
        l.brand_name,
        l.challenge_name,
        l.name,
        l.slug,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [links, search]);

  const initialOf = (email) => (email || '?').trim().charAt(0).toUpperCase();
  const formatAmount = (l) =>
    `${l.currency || 'EUR'} ${Number(l.amount || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  const shortUrl = (url) => {
    if (!url) return '';
    const noProto = url.replace(/^https?:\/\//, '');
    return noProto.length > 56 ? noProto.slice(0, 53) + '…' : noProto;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quick Links</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            One-shot admin-assisted payment URLs. Auto-deactivates after the
            first successful payment. No emails are sent to the customer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold shadow-lg shadow-amber-500/30 flex items-center gap-2 whitespace-nowrap"
        >
          <i className="fas fa-plus text-xs" />
          New Quick Link
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard
          icon="fa-bolt"
          iconBg="bg-amber-500/15 text-amber-500"
          label="Total"
          value={stats.total}
        />
        <StatCard
          icon="fa-check-circle"
          iconBg="bg-emerald-500/15 text-emerald-500"
          label="Active"
          value={stats.active}
        />
        <StatCard
          icon="fa-hourglass-end"
          iconBg="bg-muted text-muted-foreground"
          label="Used / closed"
          value={stats.used}
        />
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, brand, challenge or link id…"
            className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </div>

      {/* Copy toast */}
      {copyToast && (
        <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-sm flex items-center gap-2">
          <i className="fas fa-check-circle" />
          {copyToast}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center text-muted-foreground">
          <i className="fas fa-spinner fa-spin text-2xl mb-3 block" />
          Loading quick links…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 mb-4">
            <i className="fas fa-bolt text-2xl" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {search ? 'No matches' : 'No Quick Links yet'}
          </h3>
          <p className="text-sm text-muted-foreground mb-5">
            {search
              ? 'Try a different search term.'
              : 'Create your first one — pick a brand, a challenge, set the customer\'s email + phone + country, and share the URL.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold inline-flex items-center gap-2"
            >
              <i className="fas fa-plus text-xs" />
              New Quick Link
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="group bg-card hover:bg-muted/40 border border-border rounded-2xl p-5 transition-colors"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Customer */}
                <div className="col-span-12 md:col-span-3 flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/40 flex items-center justify-center font-bold text-amber-600 dark:text-amber-200">
                    {initialOf(l.customer_email)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {l.customer_email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      {l.customer_country && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                          {l.customer_country}
                        </span>
                      )}
                      {l.customer_phone && (
                        <span className="truncate">{l.customer_phone}</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Challenge + Brand + Gateway */}
                <div className="col-span-12 md:col-span-3 min-w-0">
                  <p className="text-sm text-foreground truncate">
                    {l.challenge_name || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                    {/* Gateway pill — null = Auto (defaults to Xoala) */}
                    {l.provider === 'WORLDCARD' ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
                        WORLDCARD
                      </span>
                    ) : l.provider === 'XOALA' ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-500 border border-purple-500/30">
                        XOALA
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                        AUTO
                      </span>
                    )}
                    <span className="truncate">
                      {l.brand_name ? `Brand · ${l.brand_name}` : 'No brand'}
                      {l.name ? ` · ${l.name}` : ''}
                    </span>
                  </p>
                </div>

                {/* Amount + Status */}
                <div className="col-span-6 md:col-span-2">
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatAmount(l)}
                  </p>
                  <div className="mt-1">
                    {l.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        Used
                      </span>
                    )}
                  </div>
                </div>

                {/* URL */}
                <div className="col-span-12 md:col-span-3 min-w-0">
                  <div className="bg-muted border border-border rounded-lg px-3 py-2 font-mono text-xs text-amber-600 dark:text-amber-300 truncate">
                    {shortUrl(l.destination_url)}
                  </div>
                </div>

                {/* Actions */}
                <div className="col-span-6 md:col-span-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => copyUrl(l.destination_url)}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-amber-500/15 text-muted-foreground hover:text-amber-500 flex items-center justify-center transition-colors"
                    title="Copy URL"
                  >
                    <i className="fas fa-copy text-xs" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(l.id)}
                    className="w-9 h-9 rounded-lg bg-muted hover:bg-red-500/15 text-muted-foreground hover:text-red-500 flex items-center justify-center transition-colors"
                    title="Delete"
                  >
                    <i className="fas fa-trash text-xs" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="mt-5 flex justify-between items-center text-xs text-muted-foreground">
          <span>
            Page {meta.page} of {meta.pages} · {meta.total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={page >= meta.pages}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed text-foreground"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <QuickLinkModal
          onClose={() => setShowModal(false)}
          onSaved={() => load()}
        />
      )}
    </div>
  );
}

function StatCard({ icon, iconBg, label, value }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
      >
        <i className={`fas ${icon}`} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {label}
        </p>
        <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}
