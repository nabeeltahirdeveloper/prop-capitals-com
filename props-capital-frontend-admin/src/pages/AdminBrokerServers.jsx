import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../../props-capital-frontend/src/contexts/LanguageContext";
import {
  adminGetAllBrokerServers,
  adminCreateBrokerServer,
  adminDeleteBrokerServer,
  adminTestBrokerServerConnection,
} from "../../../props-capital-frontend/src/api/admin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from "sonner";

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
  });

  const queryClient = useQueryClient();

  const {
    data: servers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["broker-servers"],
    queryFn: adminGetAllBrokerServers,
  });

  const createServerMutation = useMutation({
    mutationFn: adminCreateBrokerServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-servers"] });
      setShowAddDialog(false);
      resetForm();
      toast.success(t("admin.brokerServers.toast.createSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("admin.brokerServers.toast.createError"));
    },
  });

  const deleteServerMutation = useMutation({
    mutationFn: adminDeleteBrokerServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broker-servers"] });
      toast.success(t("admin.brokerServers.toast.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(error.message || t("admin.brokerServers.toast.deleteError"));
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: adminTestBrokerServerConnection,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["broker-servers"] });
      if (data.success) {
        toast.success(t("admin.brokerServers.toast.connectionSuccess"));
      } else {
        toast.warning(data.message || t("admin.brokerServers.toast.connectionFailed"));
      }
    },
    onError: (error) => {
      toast.error(error.message || t("admin.brokerServers.toast.connectionError"));
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
    });
  };

  const handleTestConnection = async (server) => {
    setTestingServer(server.id);
    try {
      await testConnectionMutation.mutateAsync(server.id);
    } catch (e) {
      // Error handled by mutation
    }
    setTestingServer(null);
  };

  const handleDeleteServer = (server) => {
    if (window.confirm(t("admin.brokerServers.confirmDelete"))) {
      deleteServerMutation.mutate(server.id);
    }
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
      case "CTRADER":
        return "from-cyan-500 to-cyan-600";
      case "DXTRADE":
        return "from-amber-500 to-amber-600";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  const getPlatformLabel = (platform) => {
    switch (platform) {
      case "MT4":
        return t("admin.brokerServers.platforms.mt4");
      case "MT5":
        return t("admin.brokerServers.platforms.mt5");
      case "CTRADER":
        return t("admin.brokerServers.platforms.ctrader");
      case "DXTRADE":
        return t("admin.brokerServers.platforms.dxtrade");
      default:
        return platform;
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-border p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("admin.brokerServers.error.title")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {error.message || t("admin.brokerServers.error.description")}
          </p>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["broker-servers"] })}
            className="bg-gradient-to-r from-[#d97706] to-[#d97706] text-[#0a0d12] hover:brightness-110"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("admin.brokerServers.error.retry")}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("admin.brokerServers.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("admin.brokerServers.subtitle")}
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-[#d97706] to-[#d97706] text-[#0a0d12] hover:brightness-110 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />{" "}
              {t("admin.brokerServers.addServer")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="
    bg-card border-border
    w-[95vw] sm:w-full sm:max-w-lg
    p-4 sm:p-6 max-h-[90vh] overflow-y-auto

    [&>button]:text-foreground
    [&>button:hover]:opacity-100
  "
          >
            <DialogHeader>
              <DialogTitle className="text-foreground text-base sm:text-lg md:text-xl">
                {t("admin.brokerServers.dialog.title")}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                {t("admin.brokerServers.dialog.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.brokerServers.dialog.serverName")}
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="bg-muted border-border text-foreground text-sm placeholder:text-muted-foreground"
                    placeholder={t(
                      "admin.brokerServers.dialog.serverNamePlaceholder"
                    )}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.brokerServers.dialog.platform")}
                  </Label>
                  <Select
                    value={formData.platform}
                    onValueChange={(v) =>
                      setFormData({ ...formData, platform: v })
                    }
                  >
                    <SelectTrigger className="bg-muted border-border text-foreground text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="MT4" className="text-foreground">
                        {t("admin.brokerServers.platforms.mt4")}
                      </SelectItem>
                      <SelectItem value="MT5" className="text-foreground">
                        {t("admin.brokerServers.platforms.mt5")}
                      </SelectItem>
                      <SelectItem value="CTRADER" className="text-foreground">
                        {t("admin.brokerServers.platforms.ctrader")}
                      </SelectItem>
                      <SelectItem value="DXTRADE" className="text-foreground">
                        {t("admin.brokerServers.platforms.dxtrade")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
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
                    className="bg-muted border-border text-foreground text-sm placeholder:text-muted-foreground"
                    placeholder={t(
                      "admin.brokerServers.dialog.serverAddressPlaceholder"
                    )}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.brokerServers.dialog.port")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.server_port}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        server_port: parseInt(e.target.value) || 443,
                      })
                    }
                    className="bg-muted border-border text-foreground text-sm"
                  />
                </div>
              </div>

              {(formData.platform === "MT4" || formData.platform === "MT5") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-muted-foreground text-xs sm:text-sm">
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
                      className="bg-muted border-border text-foreground text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-muted-foreground text-xs sm:text-sm">
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
                      className="bg-muted border-border text-foreground text-sm"
                    />
                  </div>
                </div>
              )}

              {(formData.platform === "CTRADER" ||
                formData.platform === "DXTRADE") && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-muted-foreground text-xs sm:text-sm">
                      {t("admin.brokerServers.dialog.apiKey")}
                    </Label>
                    <Input
                      value={formData.api_key}
                      onChange={(e) =>
                        setFormData({ ...formData, api_key: e.target.value })
                      }
                      className="bg-muted border-border text-foreground text-sm"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-muted-foreground text-xs sm:text-sm">
                      {t("admin.brokerServers.dialog.apiSecret")}
                    </Label>
                    <Input
                      type="password"
                      value={formData.api_secret}
                      onChange={(e) =>
                        setFormData({ ...formData, api_secret: e.target.value })
                      }
                      className="bg-muted border-border text-foreground text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 py-1">
                <label className="flex items-center gap-2 text-muted-foreground text-sm sm:text-base cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_demo}
                    onChange={(e) =>
                      setFormData({ ...formData, is_demo: e.target.checked })
                    }
                    className="rounded border-border bg-muted"
                  />
                  {t("admin.brokerServers.dialog.demoServer")}
                </label>
              </div>

              <Button
                onClick={() => createServerMutation.mutate(formData)}
                className="w-full bg-gradient-to-r from-[#d97706] to-[#d97706] text-[#0a0d12] hover:brightness-110"
                disabled={createServerMutation.isPending || !formData.name || !formData.server_address}
              >
                {createServerMutation.isPending
                  ? t("admin.brokerServers.adding")
                  : t("admin.brokerServers.addServer")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card border-border p-4 sm:p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted"></div>
                <div className="w-20 h-6 rounded bg-muted"></div>
              </div>
              <div className="h-6 w-32 bg-muted rounded mb-2"></div>
              <div className="h-4 w-48 bg-muted rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {servers.map((server) => (
            <Card
              key={server.id}
              className="bg-card border-border p-4 sm:p-6"
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
                    <Badge className="bg-amber-500/10 text-[#d97706] border border-amber-200">
                      {t("admin.brokerServers.badges.demo")}
                    </Badge>
                  )}
                  {getStatusBadge(server.connection_status)}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-foreground mb-1">
                {server.name}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {server.server_address}:{server.server_port}
              </p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("admin.brokerServers.card.platform")}
                  </span>
                  <span className="text-foreground font-medium">
                    {getPlatformLabel(server.platform)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("admin.brokerServers.card.timezone")}
                  </span>
                  <span className="text-foreground">{server.timezone}</span>
                </div>
                {server.accounts_count > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("admin.brokerServers.card.accounts")}
                    </span>
                    <span className="text-foreground">
                      {server.accounts_count}
                    </span>
                  </div>
                )}
                {server.last_sync && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {t("admin.brokerServers.card.lastSync")}
                    </span>
                    <span className="text-foreground">
                      {new Date(server.last_sync).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-border text-foreground hover:bg-accent"
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
                  className="border-border text-foreground hover:bg-accent"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/60 text-red-500 hover:bg-red-500/10"
                  onClick={() => handleDeleteServer(server)}
                  disabled={deleteServerMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}

          {servers.length === 0 && !isLoading && (
            <Card className="bg-card border-border p-8 sm:p-12 col-span-full text-center">
              <Server className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1.5 sm:mb-2">
                {t("admin.brokerServers.empty.title")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                {t("admin.brokerServers.empty.description")}
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-[#d97706] to-[#d97706] text-[#0a0d12] hover:brightness-110 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />{" "}
                {t("admin.brokerServers.addServer")}
              </Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
