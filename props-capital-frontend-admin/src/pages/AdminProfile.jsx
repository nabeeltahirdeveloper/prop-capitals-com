import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth";
import {
  updateProfile,
  changePassword,
  updateNotificationPreferences,
} from "@/api/profile";
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
import { useToast } from "@/components/ui/use-toast";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Shield,
  Bell,
  Key,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

export default function AdminProfile() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch user data from /auth/me
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
    retry: false,
    refetchInterval: 30000,
  });

  // Profile form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    country: "",
  });

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    tradeNotifications: true,
    accountAlerts: true,
    payoutUpdates: true,
    challengeUpdates: true,
    marketingEmails: false,
    emailNotifications: true,
  });

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.profile?.firstName || "",
        lastName: user.profile?.lastName || "",
        phone: user.profile?.phone || "",
        address: user.profile?.address || "",
        city: user.profile?.city || "",
        country: user.profile?.country || "",
      });

      if (user.notificationPreference) {
        setNotificationPrefs(user.notificationPreference);
      }
    }
  }, [user]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: t("common.success"),
        description: t("profile.changesSaved"),
      });
    },
    onError: (error) => {
      console.error("Failed to save profile:", error);
      toast({
        title: t("common.error"),
        description: error?.response?.data?.message || t("profile.loadError"),
        variant: "destructive",
      });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast({
        title: t("profile.passwordChanged"),
        description: t("profile.passwordChangedDesc"),
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to change password:", error);
      toast({
        title: t("profile.passwordChangeFailed"),
        description: error.response?.data?.message || t("profile.passwordChangeError"),
        variant: "destructive",
      });
    },
  });

  // Update notification preferences mutation
  const updateNotificationPrefsMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      toast({
        title: t("profile.notificationsUpdated"),
        description: t("profile.notificationsUpdatedDesc"),
        variant: "default",
      });
    },
    onError: (error) => {
      console.error("Failed to update notification preferences:", error);
      toast({
        title: t("common.error"),
        description: t("profile.notificationUpdateError"),
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: t("profile.validationError"),
        description: t("profile.passwordsDoNotMatch"),
        variant: "destructive",
      });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: t("profile.validationError"),
        description: t("profile.passwordTooShort"),
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleNotificationToggle = (key) => {
    const updated = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(updated);
    updateNotificationPrefsMutation.mutate({ [key]: updated[key] });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
          {t("profile.loadError")}
        </div>
      </div>
    );
  }

  const displayName = user?.profile
    ? `${user.profile.firstName || ""} ${user.profile.lastName || ""}`.trim() ||
      user?.email ||
      t("profile.user")
    : user?.email || t("profile.user");
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2) || "U";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("profile.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("profile.subtitle")}
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="bg-card border-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-3xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
              {displayName}
            </h2>
            <p className="text-sm text-muted-foreground truncate">
              {user?.email}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span className="px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium text-primary border border-primary/20">
                {t("profile.admin")}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="personal" className="space-y-4 sm:space-y-6">
        <TabsList className="bg-muted border border-border h-auto p-1 grid grid-cols-1 sm:grid-cols-3 gap-1">
          <TabsTrigger
            value="personal"
            className="flex items-center justify-center py-2 sm:py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground transition-all text-xs sm:text-sm"
          >
            <User className="w-4 h-4 mr-2 flex-shrink-0" />
            {t("profile.personalInfo")}
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="flex items-center justify-center py-2 sm:py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground transition-all text-xs sm:text-sm"
          >
            <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
            {t("profile.security")}
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center justify-center py-2 sm:py-2.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground transition-all text-xs sm:text-sm"
          >
            <Bell className="w-4 h-4 mr-2 flex-shrink-0" />
            {t("profile.notifications")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="bg-card border-border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("profile.personalInformation")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-muted-foreground text-xs sm:text-sm">
                  {t("profile.firstName")}
                </Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className="bg-muted border-border text-foreground text-sm"
                  placeholder={t("profile.firstNamePlaceholder")}
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-muted-foreground text-xs sm:text-sm">
                  {t("profile.lastName")}
                </Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className="bg-muted border-border text-foreground text-sm"
                  placeholder={t("profile.lastNamePlaceholder")}
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-muted-foreground text-xs sm:text-sm">
                  {t("profile.email")}
                </Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-muted border-border text-muted-foreground opacity-70 text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-muted-foreground text-xs sm:text-sm">
                  {t("profile.phoneNumber")}
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder={t("profile.phonePlaceholder")}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-muted-foreground text-xs sm:text-sm">
                  {t("profile.country")}
                </Label>
                <Input
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  placeholder={t("profile.countryPlaceholder")}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-muted-foreground text-xs sm:text-sm">
                  {t("profile.city")}
                </Label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder={t("profile.cityPlaceholder")}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                <Label className="text-muted-foreground text-xs sm:text-sm">
                  {t("profile.address")}
                </Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder={t("profile.addressPlaceholder")}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/90 h-10 sm:h-11 text-sm text-primary-foreground"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("profile.saving")}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t("profile.saveChanges")}
                  </>
                )}
              </Button>
              {saved && (
                <span className="text-primary flex items-center justify-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {t("profile.changesSaved")}
                </span>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-card border-border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("profile.securitySettings")}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/60 rounded-lg gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Key className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground font-medium text-sm sm:text-base">
                      {t("profile.password")}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                      {t("profile.changePasswordDesc")}
                    </p>
                  </div>
                </div>
                <Dialog
                  open={isPasswordDialogOpen}
                  onOpenChange={setIsPasswordDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-border bg-card text-foreground hover:bg-accent text-xs sm:text-sm h-9"
                    >
                      {t("profile.changePassword")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border w-[95vw] sm:w-full sm:max-w-md p-4 sm:p-6">
                    <DialogHeader>
                      <DialogTitle className="text-foreground text-base sm:text-lg">
                        {t("profile.changePassword")}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-muted-foreground text-xs sm:text-sm">
                          {t("profile.currentPassword")}
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword.current ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                currentPassword: e.target.value,
                              })
                            }
                            className="bg-muted border-border text-foreground pr-10 text-sm h-9 sm:h-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword({
                                ...showPassword,
                                current: !showPassword.current,
                              })
                            }
                            className="absolute right-2 top-2.5 sm:top-3 text-muted-foreground"
                          >
                            {showPassword.current ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-muted-foreground text-xs sm:text-sm">
                          {t("profile.newPassword")}
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword.new ? "text" : "password"}
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                newPassword: e.target.value,
                              })
                            }
                            className="bg-muted border-border text-foreground pr-10 text-sm h-9 sm:h-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword({
                                ...showPassword,
                                new: !showPassword.new,
                              })
                            }
                            className="absolute right-2 top-2.5 sm:top-3 text-muted-foreground"
                          >
                            {showPassword.new ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label className="text-muted-foreground text-xs sm:text-sm">
                          {t("profile.confirmPassword")}
                        </Label>
                        <div className="relative">
                          <Input
                            type={showPassword.confirm ? "text" : "password"}
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="bg-muted border-border text-foreground pr-10 text-sm h-9 sm:h-10"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword({
                                ...showPassword,
                                confirm: !showPassword.confirm,
                              })
                            }
                            className="absolute right-2 top-2.5 sm:top-3 text-muted-foreground"
                          >
                            {showPassword.confirm ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={handlePasswordChange}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/90 text-primary-foreground"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t("profile.changing")}
                          </>
                        ) : (
                          t("profile.changePassword")
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-card border-border p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
              {t("profile.notificationPreferences")}
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {[
                {
                  key: "tradeNotifications",
                  title: t("profile.tradeNotifications"),
                  desc: t("profile.tradeNotificationsDesc"),
                },
                {
                  key: "accountAlerts",
                  title: t("profile.accountAlerts"),
                  desc: t("profile.accountAlertsDesc"),
                },
                {
                  key: "payoutUpdates",
                  title: t("profile.payoutUpdates"),
                  desc: t("profile.payoutUpdatesDesc"),
                },
                {
                  key: "challengeUpdates",
                  title: t("profile.challengeUpdates"),
                  desc: t("profile.challengeUpdatesDesc"),
                },
                {
                  key: "marketingEmails",
                  title: t("profile.marketingEmails"),
                  desc: t("profile.marketingEmailsDesc"),
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-muted/60 rounded-lg gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-foreground font-medium text-sm sm:text-base">
                      {item.title}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-tight">
                      {item.desc}
                    </p>
                  </div>
                  <div
                    className={`w-11 sm:w-12 h-5 sm:h-6 rounded-full relative cursor-pointer transition-colors flex-shrink-0 ${
                      notificationPrefs[item.key]
                        ? "bg-primary"
                        : "bg-muted-foreground/30"
                    }`}
                    onClick={() => handleNotificationToggle(item.key)}
                  >
                    <div
                      className={`absolute top-0.5 sm:top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        notificationPrefs[item.key]
                          ? "right-0.5 sm:right-1"
                          : "left-0.5 sm:left-1"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
