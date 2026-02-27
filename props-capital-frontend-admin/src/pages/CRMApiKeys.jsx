import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
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
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [keyName, setKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(null);
  const [showKey, setShowKey] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";

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
    "country": "United States",
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
      cell: (row) => <span className="text-white font-medium">{row.name}</span>,
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
            className="text-slate-400 hover:text-white"
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
          <h1 className="text-xl sm:text-2xl font-bold text-white">API Keys</h1>
          <p className="text-sm sm:text-base text-slate-400">
            Manage API keys for third-party lead ingestion
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={handleCloseCreate}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 w-full sm:w-auto h-10 sm:h-11">
              <Plus className="w-4 h-4 mr-2" />
              Generate API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 w-[95vw] sm:w-full sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:hover:text-white">
            <DialogHeader>
              <DialogTitle className="text-white text-base sm:text-lg">
                {generatedKey ? "API Key Generated" : "Generate New API Key"}
              </DialogTitle>
            </DialogHeader>

            {!generatedKey ? (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Key Name</Label>
                  <Input
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. Partner Integration"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm h-10"
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                  <p className="text-xs text-slate-500">
                    A label to identify this key (e.g. the partner name)
                  </p>
                </div>
                <Button
                  onClick={handleCreate}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 h-10 sm:h-11 text-sm font-semibold"
                  disabled={createMutation.isPending || !keyName.trim()}
                >
                  {createMutation.isPending ? "Generating..." : "Generate Key"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                  <p className="text-amber-400 text-xs font-medium">
                    Copy this key now. It will not be shown again.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Your API Key</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-2 font-mono text-sm text-emerald-400 break-all">
                      {showKey
                        ? generatedKey.key
                        : generatedKey.key.substring(0, 8) + "••••••••••••••••"}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-auto"
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
                  className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 h-10"
                >
                  {copiedKey ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => handleCloseCreate(false)}
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 h-10 sm:h-11 text-sm font-semibold"
                >
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400 truncate">
            Total Keys
          </p>
          <p className="text-xl sm:text-2xl font-bold text-white truncate">
            {apiKeys.length}
          </p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400 truncate">Active</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 truncate">
            {activeKeys.length}
          </p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-slate-400 truncate">Revoked</p>
          <p className="text-xl sm:text-2xl font-bold text-red-400 truncate">
            {revokedKeys.length}
          </p>
        </Card>
      </div>

      {/* API Keys Table */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 md:p-6 overflow-hidden">
        <DataTable
          columns={columns}
          data={apiKeys}
          isLoading={isLoading}
          emptyMessage="No API keys yet. Generate one to get started."
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
        <DialogContent className="bg-slate-900 border-slate-800 w-[95vw] sm:w-full sm:max-w-2xl p-0 max-h-[90vh] overflow-y-auto [&>button]:text-white [&>button]:hover:text-white">
          {selectedKey && (
            <>
              {/* Header section */}
              <div className="p-4 sm:p-6 pb-0">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-white text-lg sm:text-xl font-bold">
                      {selectedKey.name}
                    </DialogTitle>
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-medium ${
                        selectedKey.isActive
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {selectedKey.isActive ? "Active" : "Revoked"}
                    </span>
                  </div>
                </DialogHeader>

                {/* Key metadata */}
                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Created</p>
                    <p className="text-sm text-white">
                      {selectedKey.createdAt
                        ? format(
                            new Date(selectedKey.createdAt),
                            "MMM d, yyyy 'at' HH:mm",
                          )
                        : "—"}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Last Used</p>
                    <p className="text-sm text-white">
                      {selectedKey.lastUsedAt
                        ? format(
                            new Date(selectedKey.lastUsedAt),
                            "MMM d, yyyy 'at' HH:mm",
                          )
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Endpoints section */}
              <div className="p-4 sm:p-6 pt-4 space-y-4">
                <h3 className="text-white font-semibold text-sm">Endpoints</h3>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      POST
                    </span>
                    <code className="text-sm text-slate-300 flex-1 font-mono">
                      /api/v1/leads
                    </code>
                    <span className="text-xs text-slate-500 hidden sm:block">
                      Single lead
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      POST
                    </span>
                    <code className="text-sm text-slate-300 flex-1 font-mono">
                      /api/v1/leads/bulk
                    </code>
                    <span className="text-xs text-slate-500 hidden sm:block">
                      Up to 100 leads
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400">
                      GET
                    </span>
                    <code className="text-sm text-slate-300 flex-1 font-mono">
                      /api/v1/leads/:id
                    </code>
                    <span className="text-xs text-slate-500 hidden sm:block">
                      Check status
                    </span>
                  </div>
                </div>

                {/* cURL examples */}
                <h3 className="text-white font-semibold text-sm pt-2">
                  Single Lead Example
                </h3>
                <div className="relative">
                  <pre className="bg-slate-950 rounded-lg p-3 text-xs overflow-x-auto border border-slate-800">
                    <code className="text-slate-300">{curlSnippet}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 px-2 text-slate-400 hover:text-white"
                    onClick={() => copyToClipboard(curlSnippet, "curl")}
                  >
                    {copiedSnippet === "curl" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>

                <h3 className="text-white font-semibold text-sm pt-2">
                  Bulk Example
                </h3>
                <div className="relative">
                  <pre className="bg-slate-950 rounded-lg p-3 text-xs overflow-x-auto border border-slate-800">
                    <code className="text-slate-300">{bulkSnippet}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 h-7 px-2 text-slate-400 hover:text-white"
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
                <h3 className="text-white font-semibold text-sm pt-2">
                  Fields Reference
                </h3>
                <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left text-slate-400 font-medium p-2 px-3">
                          Field
                        </th>
                        <th className="text-left text-slate-400 font-medium p-2 px-3">
                          Type
                        </th>
                        <th className="text-left text-slate-400 font-medium p-2 px-3">
                          Required
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      <tr className="border-b border-slate-700/50">
                        <td className="p-2 px-3 font-mono text-emerald-400">
                          personName
                        </td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-amber-400">Yes</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="p-2 px-3 font-mono text-emerald-400">
                          email
                        </td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-amber-400">Yes</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="p-2 px-3 font-mono">phoneNumber</td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-slate-500">No</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="p-2 px-3 font-mono">country</td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-slate-500">No</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="p-2 px-3 font-mono">source</td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-slate-500">No</td>
                      </tr>
                      <tr className="border-b border-slate-700/50">
                        <td className="p-2 px-3 font-mono">priority</td>
                        <td className="p-2 px-3">
                          LOW | MEDIUM | HIGH | URGENT
                        </td>
                        <td className="p-2 px-3 text-slate-500">No</td>
                      </tr>
                      <tr>
                        <td className="p-2 px-3 font-mono">affiliateId</td>
                        <td className="p-2 px-3">string</td>
                        <td className="p-2 px-3 text-slate-500">No</td>
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
                        ? "Revoking..."
                        : "Revoke This Key"}
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setSelectedKey(null);
                      setCopiedSnippet(null);
                    }}
                    className={`${selectedKey.isActive ? "flex-1" : "w-full"} bg-gradient-to-r from-emerald-500 to-cyan-500 h-10 text-sm font-semibold`}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Integration Guide (bottom of page) */}
      <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6">
        <h3 className="text-white font-semibold text-sm sm:text-base mb-3">
          Quick Integration Guide
        </h3>
        <div className="space-y-3 text-sm text-slate-400">
          <p>
            Third parties send leads to your API using the{" "}
            <code className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 text-xs">
              x-api-key
            </code>{" "}
            header:
          </p>
          <pre className="bg-slate-800 rounded-lg p-3 text-xs sm:text-sm overflow-x-auto">
            <code className="text-slate-300">{`POST /api/v1/leads
Content-Type: application/json
x-api-key: pc_your_key_here

{
  "personName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "+1234567890",
  "country": "United States",
  "source": "Partner Name"
}`}</code>
          </pre>
          <p className="text-xs text-slate-500">
            Leads will appear automatically in the CRM Leads page with status
            NEW.
          </p>
        </div>
      </Card>
    </div>
  );
}
