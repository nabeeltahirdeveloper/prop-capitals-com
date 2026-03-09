import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useTranslation } from "../contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DataTable from "@/components/shared/DataTable";
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export default function CRMApiKeys() {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [keyName, setKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const baseUrl =
    import.meta.env.VITE_API_URL || "http://api.prop-capitals.com";

  const { data: apiKeys = [], isLoading } = useQuery({
    queryKey: ["crm-api-keys"],
    queryFn: async () => {
      const data = await apiGet("/crm/leads/api-keys");
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (name) => apiPost("/crm/leads/api-keys", { name }),
    onSuccess: (data) => {
      setGeneratedKey(data);
      setKeyName("");
      queryClient.invalidateQueries({ queryKey: ["crm-api-keys"] });
      toast({
        title: "API key created",
        description: "Store the key securely. It won't be shown again.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id) => apiDelete(`/crm/leads/api-keys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-api-keys"] });
      setSelectedKey((prev) => (prev ? { ...prev, isActive: false } : null));
      toast({
        title: "API key revoked",
        description: "The key has been deactivated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!keyName.trim()) return;
    createMutation.mutate(keyName.trim());
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    if (label) {
      setCopiedSnippet(label);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleCloseCreate = (open) => {
    if (!open) {
      setGeneratedKey(null);
      setKeyName("");
      setShowKey(false);
      setCopiedKey(false);
    }
    setIsCreateOpen(open);
  };

  const activeKeys = apiKeys.filter((k) => k.isActive);
  const revokedKeys = apiKeys.filter((k) => !k.isActive);

  const curlSnippet = `curl -X POST ${baseUrl}/api/v1/leads \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "personName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "country": "United Kingdom",
    "source": "Partner Name"
  }'`;

  const bulkSnippet = `curl -X POST ${baseUrl}/api/v1/leads/bulk \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "leads": [
      { "personName": "John Doe", "email": "john@example.com", "country": "US" },
      { "personName": "Jane Smith", "email": "jane@example.com", "country": "UK" }
    ]
  }'`;

  const columns = [
    {
      header: "Name",
      accessorKey: "name",
      cell: (row) => (
        <span className="text-foreground font-medium">{row.name}</span>
      ),
    },
    {
      header: "Status",
      accessorKey: "isActive",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            row.isActive
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {row.isActive ? "Active" : "Revoked"}
        </span>
      ),
    },
    {
      header: "Created",
      accessorKey: "createdAt",
      cell: (row) =>
        row.createdAt
          ? format(new Date(row.createdAt), "MMM d, yyyy HH:mm")
          : "—",
    },
    {
      header: "Last Used",
      accessorKey: "lastUsedAt",
      cell: (row) =>
        row.lastUsedAt
          ? format(new Date(row.lastUsedAt), "MMM d, yyyy HH:mm")
          : "Never",
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (row) => (
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSelectedKey(row)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          {row.isActive && (
            <Button
              size="sm"
              variant="ghost"
              className="text-red-400 hover:text-red-300"
              onClick={() => revokeMutation.mutate(row.id)}
              disabled={revokeMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Revoke
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("admin.apiKeys.title", { defaultValue: "API Keys" })}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("admin.apiKeys.subtitle", {
              defaultValue: "Manage API keys for third-party lead ingestion",
            })}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={handleCloseCreate}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#d97706] to-[#d97706] text-[#0a0d12] hover:brightness-110 w-full sm:w-auto h-10 sm:h-11">
              <Plus className="w-4 h-4 mr-2" />
              {t("admin.apiKeys.generate", {
                defaultValue: "Generate API Key",
              })}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border w-[95vw] sm:w-full sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto [&>button]:text-foreground [&>button:hover]:opacity-100">
            <DialogHeader>
              <DialogTitle className="text-foreground text-base sm:text-lg">
                {generatedKey
                  ? t("admin.apiKeys.keyGenerated", {
                      defaultValue: "API Key Generated",
                    })
                  : t("admin.apiKeys.generateNew", {
                      defaultValue: "Generate New API Key",
                    })}
              </DialogTitle>
            </DialogHeader>

            {!generatedKey ? (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">
                    {t("admin.apiKeys.keyName", { defaultValue: "Key Name" })}
                  </Label>
                  <Input
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder={t("admin.apiKeys.keyNamePlaceholder", {
                      defaultValue: "e.g. Partner Integration",
                    })}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm h-10"
                    maxLength={100}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("admin.apiKeys.keyNameHint", {
                      defaultValue:
                        "A label to identify this key (e.g. the partner name)",
                    })}
                  </p>
                </div>
                <Button
                  onClick={handleCreate}
                  className="w-full bg-gradient-to-r from-[#d97706] to-[#d97706] text-[#0a0d12] hover:brightness-110 h-10 sm:h-11 text-sm font-semibold"
                  disabled={createMutation.isPending || !keyName.trim()}
                >
                  {createMutation.isPending
                    ? t("admin.apiKeys.generating", {
                        defaultValue: "Generating...",
                      })
                    : t("admin.apiKeys.generateKey", {
                        defaultValue: "Generate Key",
                      })}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-amber-400 text-xs font-medium">
                    {t("admin.apiKeys.copyWarning", {
                      defaultValue:
                        "Copy this key now. It will not be shown again.",
                    })}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">
                    {t("admin.apiKeys.yourKey", {
                      defaultValue: "Your API Key",
                    })}
                  </Label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted border border-border rounded-md px-3 py-2 font-mono text-sm text-emerald-400 break-all">
                      {showKey
                        ? generatedKey.key
                        : generatedKey.key.substring(0, 8) + "••••••••••••••••"}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border text-muted-foreground hover:text-foreground hover:bg-muted h-auto"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => copyToClipboard(generatedKey.key)}
                  variant="outline"
                  className="w-full border-border text-muted-foreground hover:text-foreground hover:bg-muted h-10"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      <span className="text-emerald-400">
                        {t("admin.apiKeys.copied", { defaultValue: "Copied!" })}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      {t("admin.apiKeys.copyToClipboard", {
                        defaultValue: "Copy to Clipboard",
                      })}
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleCloseCreate(false)}
                  className="w-full bg-gradient-to-r from-[#d97706] to-[#d97706] text-[#0a0d12] hover:brightness-110 h-10 sm:h-11 text-sm font-semibold"
                >
                  {t("admin.apiKeys.done", { defaultValue: "Done" })}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {t("admin.apiKeys.totalKeys", { defaultValue: "Total Keys" })}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-foreground truncate">
            {apiKeys.length}
          </p>
        </Card>
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {t("admin.apiKeys.active", { defaultValue: "Active" })}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 truncate">
            {activeKeys.length}
          </p>
        </Card>
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {t("admin.apiKeys.revoked", { defaultValue: "Revoked" })}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-red-400 truncate">
            {revokedKeys.length}
          </p>
        </Card>
      </div>

      {/* API Keys Table */}
      <Card className="bg-card border-border p-3 sm:p-4 md:p-6 overflow-hidden">
        <DataTable
          columns={columns}
          data={apiKeys}
          isLoading={isLoading}
          emptyMessage={t("admin.apiKeys.emptyMessage", {
            defaultValue: "No API keys yet. Generate one to get started.",
          })}
          onRowClick={(row) => setSelectedKey(row)}
        />
      </Card>

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedKey}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedKey(null);
            setCopiedSnippet(null);
          }
        }}
      >
        <DialogContent className="bg-card border-border w-[95vw] sm:w-full sm:max-w-2xl p-0 max-h-[90vh] overflow-y-auto [&>button]:text-foreground [&>button:hover]:opacity-100">
          {selectedKey && (
            <>
              {/* Header section */}
              <div className="p-4 sm:p-6 pb-0">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-foreground text-lg sm:text-xl font-bold">
                      {selectedKey.name}
                    </DialogTitle>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        selectedKey.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {selectedKey.isActive
                        ? t("admin.apiKeys.active", { defaultValue: "Active" })
                        : t("admin.apiKeys.revoked", {
                            defaultValue: "Revoked",
                          })}
                    </span>
                  </div>
                </DialogHeader>

                {/* Key metadata */}
                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("admin.apiKeys.created", { defaultValue: "Created" })}
                    </p>
                    <p className="text-sm text-foreground">
                      {selectedKey.createdAt
                        ? format(
                            new Date(selectedKey.createdAt),
                            "MMM d, yyyy 'at' HH:mm",
                          )
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("admin.apiKeys.lastUsed", {
                        defaultValue: "Last Used",
                      })}
                    </p>
                    <p className="text-sm text-foreground">
                      {selectedKey.lastUsedAt
                        ? format(
                            new Date(selectedKey.lastUsedAt),
                            "MMM d, yyyy 'at' HH:mm",
                          )
                        : t("admin.apiKeys.never", { defaultValue: "Never" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Endpoints section */}
              <div className="p-4 sm:p-6 pt-4 space-y-4">
                <h3 className="text-foreground font-semibold text-sm">
                  {t("admin.apiKeys.endpoints", { defaultValue: "Endpoints" })}
                </h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      POST
                    </span>
                    <code className="text-sm text-foreground flex-1 font-mono">
                      /api/v1/leads
                    </code>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {t("admin.apiKeys.singleLead", {
                        defaultValue: "Single lead",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      POST
                    </span>
                    <code className="text-sm text-foreground flex-1 font-mono">
                      /api/v1/leads/bulk
                    </code>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {t("admin.apiKeys.upTo100", {
                        defaultValue: "Up to 100 leads",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400">
                      GET
                    </span>
                    <code className="text-sm text-foreground flex-1 font-mono">
                      /api/v1/leads/:id
                    </code>
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {t("admin.apiKeys.checkStatus", {
                        defaultValue: "Check status",
                      })}
                    </span>
                  </div>
                </div>

                {/* cURL examples */}
                <h3 className="text-foreground font-semibold text-sm pt-2">
                  {t("admin.apiKeys.singleExample", {
                    defaultValue: "Single Lead Example",
                  })}
                </h3>
                <div className="relative">
                  <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto border border-border">
                    <code className="text-foreground">{curlSnippet}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(curlSnippet, "curl")}
                  >
                    {copiedSnippet === "curl" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>

                <h3 className="text-foreground font-semibold text-sm pt-2">
                  {t("admin.apiKeys.bulkExample", {
                    defaultValue: "Bulk Example",
                  })}
                </h3>
                <div className="relative">
                  <pre className="bg-muted/50 rounded-lg p-3 text-xs overflow-x-auto border border-border">
                    <code className="text-foreground">{bulkSnippet}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => copyToClipboard(bulkSnippet, "bulk")}
                  >
                    {copiedSnippet === "bulk" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>

                {/* Required fields */}
                <h3 className="text-foreground font-semibold text-sm pt-2">
                  {t("admin.apiKeys.fieldsReference", {
                    defaultValue: "Fields Reference",
                  })}
                </h3>
                <div className="bg-muted/50 rounded-lg overflow-hidden">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-muted-foreground font-medium p-2 px-3">
                          {t("admin.apiKeys.field", { defaultValue: "Field" })}
                        </th>
                        <th className="text-left text-muted-foreground font-medium p-2 px-3">
                          {t("admin.apiKeys.type", { defaultValue: "Type" })}
                        </th>
                        <th className="text-left text-muted-foreground font-medium p-2 px-3">
                          {t("admin.apiKeys.required", {
                            defaultValue: "Required",
                          })}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-foreground">
                      <tr className="border-b border-border/50">
                        <td className="p-2 px-3 font-mono text-emerald-400">
                          personName
                        </td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-amber-400">
                          {t("admin.apiKeys.yes", { defaultValue: "Yes" })}
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-2 px-3 font-mono text-emerald-400">
                          email
                        </td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-amber-400">
                          {t("admin.apiKeys.yes", { defaultValue: "Yes" })}
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-2 px-3 font-mono">phoneNumber</td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-muted-foreground">
                          {t("admin.apiKeys.no", { defaultValue: "No" })}
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-2 px-3 font-mono">country</td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-muted-foreground">
                          {t("admin.apiKeys.no", { defaultValue: "No" })}
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-2 px-3 font-mono">source</td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-muted-foreground">
                          {t("admin.apiKeys.no", { defaultValue: "No" })}
                        </td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-2 px-3 font-mono">priority</td>
                        <td className="p-2 px-3">
                          LOW | MEDIUM | HIGH | URGENT
                        </td>
                        <td className="p-2 px-3 text-muted-foreground">
                          {t("admin.apiKeys.no", { defaultValue: "No" })}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 px-3 font-mono">affiliateId</td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-muted-foreground">
                          {t("admin.apiKeys.no", { defaultValue: "No" })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {selectedKey.isActive && (
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-10"
                      onClick={() => revokeMutation.mutate(selectedKey.id)}
                      disabled={revokeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {revokeMutation.isPending
                        ? t("admin.apiKeys.revoking", {
                            defaultValue: "Revoking...",
                          })
                        : t("admin.apiKeys.revokeThisKey", {
                            defaultValue: "Revoke This Key",
                          })}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setSelectedKey(null);
                      setCopiedSnippet(null);
                    }}
                    className={`${selectedKey.isActive ? "flex-1" : "w-full"} bg-gradient-to-r from-[#d97706] to-[#d97706] text-[#0a0d12] hover:brightness-110 h-10 text-sm font-semibold`}
                  >
                    {t("admin.apiKeys.close", { defaultValue: "Close" })}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Integration Guide (bottom of page) */}
      <Card className="bg-card border-border p-4 sm:p-6">
        <h3 className="text-foreground font-semibold text-sm sm:text-base mb-3">
          {t("admin.apiKeys.quickGuide", {
            defaultValue: "Quick Integration Guide",
          })}
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            {t("admin.apiKeys.guideText", {
              defaultValue: "Third parties send leads to your API using the",
            })}{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-emerald-400 text-xs">
              x-api-key
            </code>{" "}
            {t("admin.apiKeys.header", { defaultValue: "header:" })}
          </p>
          <pre className="bg-muted rounded-lg p-3 text-xs sm:text-sm overflow-x-auto">
            <code className="text-foreground">{`POST /api/v1/leads
Content-Type: application/json
x-api-key: pc_your_key_here

{
  "personName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "country": "United Kingdom",
  "source": "Partner Name"
}`}</code>
          </pre>
          <p className="text-xs text-muted-foreground">
            {t("admin.apiKeys.guideNote", {
              defaultValue:
                "Leads will appear automatically in the CRM Leads page with status NEW.",
            })}
          </p>
        </div>
      </Card>
    </div>
  );
}
