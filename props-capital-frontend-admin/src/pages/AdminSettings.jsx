import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminGetAllSettings, adminUpdateSettingsGroup } from "@/api/admin";
import { useTranslation } from "../contexts/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Palette,
  CreditCard,
  Link,
  Save,
  Loader2,
} from "lucide-react";

export default function AdminSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");

  // Default settings (used as fallback if backend doesn't have values)
  const defaultGeneral = {
    platform_name: "Prop Capitals",
    support_email: "support@prop-capitals.com",
    maintenance_mode: false,
  };

  const defaultBranding = {
    primary_color: "#10b981",
    secondary_color: "#06b6d4",
    logo_url: "",
  };

  const defaultPayment = {
    stripe_enabled: true,
    paypal_enabled: true,
    crypto_enabled: true,
    stripe_key: "",
    paypal_client_id: "",
  };

  const defaultIntegration = {
    mt4_enabled: true,
    mt5_enabled: true,
    ctrader_enabled: true,
    dxtrade_enabled: false,
  };

  // Fetch all settings from backend
  const { data: allSettings = {}, isLoading } = useQuery({
    queryKey: ["admin-settings-all"],
    queryFn: adminGetAllSettings,
  });

  // Map backend settings to frontend state
  const generalSettings = {
    ...defaultGeneral,
    ...(allSettings.general || {}),
  };

  const brandingSettings = {
    ...defaultBranding,
    ...(allSettings.branding || {}),
  };

  const paymentSettings = {
    ...defaultPayment,
    ...(allSettings.payments || {}),
  };

  const integrationSettings = {
    ...defaultIntegration,
    ...(allSettings.integrations || {}),
  };

  // Local state for form inputs
  const [localGeneral, setLocalGeneral] = useState(generalSettings);
  const [localBranding, setLocalBranding] = useState(brandingSettings);
  const [localPayment, setLocalPayment] = useState(paymentSettings);
  const [localIntegration, setLocalIntegration] = useState(integrationSettings);

  // Update local state when backend data loads
  useEffect(() => {
    if (allSettings.general)
      setLocalGeneral({ ...defaultGeneral, ...allSettings.general });
    if (allSettings.branding)
      setLocalBranding({ ...defaultBranding, ...allSettings.branding });
    if (allSettings.payments)
      setLocalPayment({ ...defaultPayment, ...allSettings.payments });
    if (allSettings.integrations)
      setLocalIntegration({
        ...defaultIntegration,
        ...allSettings.integrations,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: ({ group, settings }) =>
      adminUpdateSettingsGroup(group, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings-all"] });
      toast({
        title: t("admin.settings.settingsSaved"),
        description: t("admin.settings.settingsSaveDescription"),
      });
    },
    onError: (error) => {
      toast({
        title: t("common.error"),
        description: error?.message || t("admin.settings.saveError"),
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    // Save the currently active tab's settings
    let group, settings;

    switch (activeTab) {
      case "general":
        group = "general";
        settings = localGeneral;
        break;
      case "branding":
        group = "branding";
        settings = localBranding;
        break;
      case "payments":
        group = "payments";
        settings = localPayment;
        break;
      case "integrations":
        group = "integrations";
        settings = localIntegration;
        break;
      default:
        return;
    }

    saveMutation.mutate({ group, settings });
  };

  // Helper check for fully disabling inputs
  const isPending = isLoading || saveMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("admin.settings.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("admin.settings.subtitle")}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-[#d97706] to-[#d97706] hover:from-amber-600 hover:to-amber-600 w-full sm:w-auto text-white"
            disabled={isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("admin.settings.saveChange", { defaultValue: "Saving..." })}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {t("admin.settings.saveChanges")}
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="overflow-x-auto pb-1 scrollbar-hide">
          <TabsList className="bg-muted border border-border h-auto p-1 flex min-w-max gap-1">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-card text-muted-foreground data-[state=active]:text-foreground text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <Settings className="w-4 h-4 mr-2 flex-shrink-0" />
              {t("admin.settings.tabs.general")}
            </TabsTrigger>
            <TabsTrigger
              value="branding"
              className="data-[state=active]:bg-card text-muted-foreground data-[state=active]:text-foreground text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <Palette className="w-4 h-4 mr-2 flex-shrink-0" />
              {t("admin.settings.tabs.branding")}
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="data-[state=active]:bg-card text-muted-foreground data-[state=active]:text-foreground text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <CreditCard className="w-4 h-4 mr-2 flex-shrink-0" />
              {t("admin.settings.tabs.payments")}
            </TabsTrigger>
            <TabsTrigger
              value="integrations"
              className="data-[state=active]:bg-card text-muted-foreground data-[state=active]:text-foreground text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
              <Link className="w-4 h-4 mr-2 flex-shrink-0" />
              {t("admin.settings.tabs.integrations")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general">
          <Card className="bg-card border-border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("admin.settings.general.title")}
            </h3>
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.settings.general.platformName")}
                  </Label>
                  <Input
                    value={localGeneral.platform_name || ""}
                    onChange={(e) =>
                      setLocalGeneral({
                        ...localGeneral,
                        platform_name: e.target.value,
                      })
                    }
                    className="bg-muted border-border text-foreground"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.settings.general.supportEmail")}
                  </Label>
                  <Input
                    type="email"
                    value={localGeneral.support_email || ""}
                    onChange={(e) =>
                      setLocalGeneral({
                        ...localGeneral,
                        support_email: e.target.value,
                      })
                    }
                    className="bg-muted border-border text-foreground text-sm"
                    disabled={isPending}
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/60 rounded-lg gap-3">
                <div className="min-w-0">
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {t("admin.settings.general.maintenanceMode")}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                    {t("admin.settings.general.maintenanceModeDesc")}
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={!!localGeneral.maintenance_mode}
                  aria-label={t("admin.settings.general.maintenanceMode")}
                  onClick={() => {
                    const v = !localGeneral.maintenance_mode;
                    setLocalGeneral({ ...localGeneral, maintenance_mode: v });
                  }}
                  disabled={isPending}
                  className={`relative inline-flex w-11 sm:w-12 h-5 sm:h-6 rounded-full flex-shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 disabled:cursor-not-allowed ${
                    localGeneral.maintenance_mode
                      ? "bg-amber-500"
                      : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 sm:top-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                      localGeneral.maintenance_mode
                        ? "right-0.5 sm:right-0.5"
                        : "left-0.5 sm:left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="bg-card border-border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("admin.settings.branding.title")}
            </h3>
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.settings.branding.primaryColor")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localBranding.primary_color || "#10b981"}
                      onChange={(e) =>
                        setLocalBranding({
                          ...localBranding,
                          primary_color: e.target.value,
                        })
                      }
                      className="w-10 sm:w-12 h-9 sm:h-10 p-1 bg-muted border-border rounded cursor-pointer"
                      disabled={isPending}
                    />
                    <Input
                      value={localBranding.primary_color || ""}
                      onChange={(e) =>
                        setLocalBranding({
                          ...localBranding,
                          primary_color: e.target.value,
                        })
                      }
                      className="bg-muted border-border text-foreground text-sm"
                      disabled={isPending}
                    />
                  </div>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.settings.branding.secondaryColor")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localBranding.secondary_color || "#06b6d4"}
                      onChange={(e) =>
                        setLocalBranding({
                          ...localBranding,
                          secondary_color: e.target.value,
                        })
                      }
                      className="w-10 sm:w-12 h-9 sm:h-10 p-1 bg-muted border-border rounded cursor-pointer"
                      disabled={isPending}
                    />
                    <Input
                      value={localBranding.secondary_color || ""}
                      onChange={(e) =>
                        setLocalBranding({
                          ...localBranding,
                          secondary_color: e.target.value,
                        })
                      }
                      className="bg-muted border-border text-foreground text-sm"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-muted-foreground text-xs sm:text-sm">
                  {t("admin.settings.branding.logoUrl", {
                    url: t("common.url"),
                  })}
                </Label>
                <Input
                  value={localBranding.logo_url || ""}
                  onChange={(e) =>
                    setLocalBranding({
                      ...localBranding,
                      logo_url: e.target.value,
                    })
                  }
                  placeholder={t("admin.settings.branding.logoUrlPlaceholder")}
                  className="bg-muted border-border text-foreground text-sm"
                  disabled={isPending}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="bg-card border-border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("admin.settings.payments.title")}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {/* Stripe */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/60 rounded-lg gap-3">
                <div className="min-w-0">
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {t("admin.settings.payments.stripe")}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                    {t("admin.settings.payments.stripeDesc")}
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={!!localPayment.striple_enabled}
                  aria-label={t("admin.settings.payments.stripe")}
                  onClick={() => {
                    const v = !localPayment.stripe_enabled;
                    setLocalPayment({ ...localPayment, stripe_enabled: v });
                  }}
                  disabled={isPending}
                  className={`relative inline-flex w-11 sm:w-12 h-5 sm:h-6 rounded-full flex-shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 disabled:cursor-not-allowed ${
                    localPayment.stripe_enabled
                      ? "bg-amber-500"
                      : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 sm:top-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                      localPayment.stripe_enabled
                        ? "right-0.5 sm:right-0.5"
                        : "left-0.5 sm:left-0.5"
                    }`}
                  />
                </button>
              </div>
              {localPayment.stripe_enabled && (
                <div className="space-y-1.5 sm:space-y-2 pl-2 sm:pl-4">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.settings.payments.stripeApiKey")}
                  </Label>
                  <Input
                    type="password"
                    autoComplete="off"
                    value={localPayment.stripe_key || ""}
                    onChange={(e) =>
                      setLocalPayment({
                        ...localPayment,
                        stripe_key: e.target.value,
                      })
                    }
                    placeholder={t(
                      "admin.settings.payments.stripeApiKeyPlaceholder",
                    )}
                    className="bg-muted border-border text-foreground text-sm"
                    disabled={isPending}
                  />
                </div>
              )}

              {/* PayPal */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/60 rounded-lg gap-3">
                <div className="min-w-0">
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {t("admin.settings.payments.paypal")}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                    {t("admin.settings.payments.paypalDesc")}
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={!!localPayment.paypal_enabled}
                  aria-label={t("admin.settings.payments.paypal")}
                  onClick={() => {
                    const v = !localPayment.paypal_enabled;
                    setLocalPayment({ ...localPayment, paypal_enabled: v });
                  }}
                  disabled={isPending}
                  className={`relative inline-flex w-11 sm:w-12 h-5 sm:h-6 rounded-full flex-shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 disabled:cursor-not-allowed ${
                    localPayment.paypal_enabled
                      ? "bg-amber-500"
                      : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 sm:top-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                      localPayment.paypal_enabled
                        ? "right-0.5 sm:right-0.5"
                        : "left-0.5 sm:left-0.5"
                    }`}
                  />
                </button>
              </div>
              {localPayment.paypal_enabled && (
                <div className="space-y-1.5 sm:space-y-2 pl-2 sm:pl-4">
                  <Label className="text-muted-foreground text-xs sm:text-sm">
                    {t("admin.settings.payments.paypalClientId", { defaultValue: "PayPal Client ID" })}
                  </Label>
                  <Input
                    type="password"
                    autoComplete="off"
                    value={localPayment.paypal_client_id || ""}
                    onChange={(e) =>
                      setLocalPayment({
                        ...localPayment,
                        paypal_client_id: e.target.value,
                      })
                    }
                    placeholder="Enter PayPal Client ID"
                    className="bg-muted border-border text-foreground text-sm"
                    disabled={isPending}
                  />
                </div>
              )}

              {/* Crypto */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/60 rounded-lg gap-3">
                <div className="min-w-0">
                  <p className="text-foreground font-medium text-sm sm:text-base">
                    {t("admin.settings.payments.cryptocurrency")}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                    {t("admin.settings.payments.cryptocurrencyDesc")}
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={!!localPayment.crypto_enabled}
                  aria-label={t("admin.settings.payments.cryptocurrency")}
                  onClick={() => {
                    const v = !localPayment.crypto_enabled;
                    setLocalPayment({ ...localPayment, crypto_enabled: v });
                  }}
                  disabled={isPending}
                  className={`relative inline-flex w-11 sm:w-12 h-5 sm:h-6 rounded-full flex-shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 disabled:cursor-not-allowed ${
                    localPayment.crypto_enabled
                      ? "bg-amber-500"
                      : "bg-slate-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 sm:top-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                      localPayment.crypto_enabled
                        ? "right-0.5 sm:right-0.5"
                        : "left-0.5 sm:left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="bg-card border-border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("admin.settings.integrations.title")}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {[
                { key: "mt4_enabled", nameKey: "mt4", descKey: "mt4Desc" },
                { key: "mt5_enabled", nameKey: "mt5", descKey: "mt5Desc" },
                {
                  key: "ctrader_enabled",
                  nameKey: "ctrader",
                  descKey: "ctraderDesc",
                },
                {
                  key: "dxtrade_enabled",
                  nameKey: "dxtrade",
                  descKey: "dxtradeDesc",
                },
              ].map((platform) => (
                <div
                  key={platform.key}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/60 rounded-lg gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-foreground font-medium text-sm sm:text-base">
                      {t(`admin.settings.integrations.${platform.nameKey}`)}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                      {t(`admin.settings.integrations.${platform.descKey}`)}
                    </p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={!!localIntegration[platform.key]}
                    aria-label={t(`admin.settings.integrations.${platform.nameKey}`)}
                    onClick={() => {
                      const v = !localIntegration[platform.key];
                      setLocalIntegration({
                        ...localIntegration,
                        [platform.key]: v,
                      });
                    }}
                    disabled={isPending}
                    className={`relative inline-flex w-11 sm:w-12 h-5 sm:h-6 rounded-full flex-shrink-0 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 disabled:cursor-not-allowed ${
                      localIntegration[platform.key]
                        ? "bg-amber-500"
                        : "bg-slate-600"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 sm:top-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                        localIntegration[platform.key]
                          ? "right-0.5 sm:right-0.5"
                          : "left-0.5 sm:left-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-4 leading-tight">
              {t("admin.settings.integrations.note")}
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
