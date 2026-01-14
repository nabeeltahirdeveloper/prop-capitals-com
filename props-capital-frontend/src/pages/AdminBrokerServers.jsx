import React, { useState } from "react";
// TODO: Replace with broker servers API when available
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Server,
  Plus,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Trash2,
  TestTube,
} from "lucide-react";

export default function AdminBrokerServers() {
  const { t } = useTranslation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [testingServer, setTestingServer] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    platform: "MT5",
    server_address: "",
    server_port: 443,
    manager_login: "",
    manager_password: "",
    api_key: "",
    api_secret: "",
    is_demo: true,
    timezone: "UTC",
    leverage_options: [100, 200, 500],
  });

  const queryClient = useQueryClient();

  const { data: servers = [], isLoading } = useQuery({
    queryKey: ["broker-servers"],
    queryFn: () => Promise.resolve([]), // TODO: Replace with broker servers API
  });

  const createServerMutation = useMutation({
    mutationFn: (data) => Promise.resolve({ id: "1", ...data }), // TODO: Replace with broker servers API
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-servers"] });
      setShowAddDialog(false);
      resetForm();
    },
  });

  const deleteServerMutation = useMutation({
    mutationFn: (id) => Promise.resolve(), // TODO: Replace with broker servers API
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["broker-servers"] }),
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (server) => {
      // TODO: Replace with broker integration API
      const response = { success: false, message: "Not implemented" };
      return response.data;
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      platform: "MT5",
      server_address: "",
      server_port: 443,
      manager_login: "",
      manager_password: "",
      api_key: "",
      api_secret: "",
      is_demo: true,
      timezone: "UTC",
      leverage_options: [100, 200, 500],
    });
  };

  const handleTestConnection = async (server) => {
    setTestingServer(server.id);
    try {
      const result = await testConnectionMutation.mutateAsync(server);
      // TODO: Update server connection status via API
      queryClient.invalidateQueries({ queryKey: ["broker-servers"] });
    } catch (e) {
      // TODO: Update server connection status via API
    }
    setTestingServer(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "connected":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle className="w-3 h-3 mr-1" />{" "}
            {t("admin.brokerServers.status.connected")}
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />{" "}
            {t("admin.brokerServers.status.error")}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
            <AlertCircle className="w-3 h-3 mr-1" />{" "}
            {t("admin.brokerServers.status.notConnected")}
          </Badge>
        );
    }
  };

  const getPlatformColor = (platform) => {
    switch (platform) {
      case "MT4":
        return "from-blue-500 to-blue-600";
      case "MT5":
        return "from-purple-500 to-purple-600";
      case "cTrader":
        return "from-cyan-500 to-cyan-600";
      case "DXTrade":
        return "from-amber-500 to-amber-600";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {t("admin.brokerServers.title")}
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            {t("admin.brokerServers.subtitle")}
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />{" "}
              {t("admin.brokerServers.addServer")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="
    bg-slate-900 border-slate-800
    w-[95vw] sm:w-full sm:max-w-lg
    p-4 sm:p-6 max-h-[90vh] overflow-y-auto

    [&>button]:text-white
    [&>button:hover]:opacity-100
  "
          >
            <DialogHeader>
              <DialogTitle className="text-white text-base sm:text-lg md:text-xl">
                {t("admin.brokerServers.dialog.title")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">
                    {t("admin.brokerServers.dialog.serverName")}
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-slate-800 border-slate-700 text-white text-sm"
                    placeholder={t(
                      "admin.brokerServers.dialog.serverNamePlaceholder"
                    )}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">
                    {t("admin.brokerServers.dialog.platform")}
                  </Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(v) =>
                      setFormData({ ...formData, platform: v })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                      <SelectItem value="MT4" className="text-white">
                        {t("admin.brokerServers.platforms.mt4")}
                      </SelectItem>
                      <SelectItem value="MT5" className="text-white">
                        {t("admin.brokerServers.platforms.mt5")}
                      </SelectItem>
                      <SelectItem value="cTrader" className="text-white">
                        {t("admin.brokerServers.platforms.ctrader")}
                      </SelectItem>
                      <SelectItem value="DXTrade" className="text-white">
                        {t("admin.brokerServers.platforms.dxtrade")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">
                    {t("admin.brokerServers.dialog.serverAddress")}
                  </Label>
                  <Input
                    value={formData.server_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server_address: e.target.value,
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-white text-sm"
                    placeholder={t(
                      "admin.brokerServers.dialog.serverAddressPlaceholder"
                    )}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-400 text-xs sm:text-sm">
                    {t("admin.brokerServers.dialog.port")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.server_port}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server_port: parseInt(e.target.value),
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-white text-sm"
                  />
                </div>
              </div>

              {(formData.platform === "MT4" || formData.platform === "MT5") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-slate-400 text-xs sm:text-sm">
                      {t("admin.brokerServers.dialog.managerLogin")}
                    </Label>
                    <Input
                      value={formData.manager_login}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          manager_login: e.target.value,
                        })
                      }
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-slate-400 text-xs sm:text-sm">
                      {t("admin.brokerServers.dialog.managerPassword")}
                    </Label>
                    <Input
                      type="password"
                      value={formData.manager_password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          manager_password: e.target.value,
                        })
                      }
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>
              )}

              {(formData.platform === "cTrader" ||
                formData.platform === "DXTrade") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-slate-400 text-xs sm:text-sm">
                      {t("admin.brokerServers.dialog.apiKey")}
                    </Label>
                    <Input
                      value={formData.api_key}
                      onChange={(e) =>
                        setFormData({ ...formData, api_key: e.target.value })
                      }
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-slate-400 text-xs sm:text-sm">
                      {t("admin.brokerServers.dialog.apiSecret")}
                    </Label>
                    <Input
                      type="password"
                      value={formData.api_secret}
                      onChange={(e) =>
                        setFormData({ ...formData, api_secret: e.target.value })
                      }
                      className="bg-slate-800 border-slate-700 text-white text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 py-1">
                <label className="flex items-center gap-2 text-slate-300 text-sm sm:text-base cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_demo}
                    onChange={(e) =>
                      setFormData({ ...formData, is_demo: e.target.checked })
                    }
                    className="rounded border-slate-700 bg-slate-800"
                  />
                  {t("admin.brokerServers.dialog.demoServer")}
                </label>
              </div>

              <Button
                onClick={() => createServerMutation.mutate(formData)}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                disabled={createServerMutation.isPending}
              >
                {createServerMutation.isPending
                  ? t("admin.brokerServers.adding")
                  : t("admin.brokerServers.addServer")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {servers.map((server) => (
          <Card
            key={server.id}
            className="bg-slate-900 border-slate-800 p-4 sm:p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlatformColor(
                  server.platform
                )} flex items-center justify-center`}
              >
                <Server className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-2">
                {server.is_demo && (
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    {t("admin.brokerServers.badges.demo")}
                  </Badge>
                )}
                {getStatusBadge(server.connection_status)}
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-1">
              {server.name}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {server.server_address}:{server.server_port}
            </p>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {t("admin.brokerServers.card.platform")}
                </span>
                <span className="text-white font-medium">
                  {server.platform}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  {t("admin.brokerServers.card.timezone")}
                </span>
                <span className="text-white">{server.timezone}</span>
              </div>
              {server.last_sync && (
                <div className="flex justify-between">
                  <span className="text-slate-400">
                    {t("admin.brokerServers.card.lastSync")}
                  </span>
                  <span className="text-white">
                    {new Date(server.last_sync).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 border-slate-700 text-slate-300"
                onClick={() => handleTestConnection(server)}
                disabled={testingServer === server.id}
              >
                {testingServer === server.id ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <TestTube className="w-4 h-4 mr-1" />
                )}
                {t("admin.brokerServers.actions.test")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-800 text-red-400 hover:bg-red-500/10"
                onClick={() => deleteServerMutation.mutate(server.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}

        {servers.length === 0 && !isLoading && (
          <Card className="bg-slate-900 border-slate-800 p-8 sm:p-12 col-span-full text-center">
            <Server className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">
              {t("admin.brokerServers.empty.title")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mb-4 sm:mb-6">
              {t("admin.brokerServers.empty.description")}
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />{" "}
              {t("admin.brokerServers.addServer")}
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
