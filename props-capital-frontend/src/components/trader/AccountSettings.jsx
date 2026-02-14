import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Shield, Bell, Key, Save, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from '@/components/ui/button';
import { useTraderTheme } from './TraderPanelLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import {
  updateProfile,
  changePassword,
  updateNotificationPreferences,
  uploadVerificationDocument,
} from '@/api/profile';

const AccountSettings = () => {
  const { toast } = useToast();
  const { isDark } = useTraderTheme();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({
    isEdit: false,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    lotSize: '',
    leverage: '',
    theme: '',
  });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    isEdit: false,
    tradeNotifications: true,
    accountAlerts: true,
    payoutUpdates: true,
    challengeUpdates: true,
    marketingEmails: false,
    emailNotifications: true,
  });

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (user) {
      setProfile({
        ...profile,
        firstName: user?.profile?.firstName || '-',
        lastName: user?.profile?.lastName || '-',
        email: user?.email || '-',
        phone: user?.profile?.phone || '-',
        country: user?.profile?.country || '-',
        lotSize: user?.profile?.lotSize,
        leverage: user?.profile?.leverage,
        theme: user?.profile?.theme,
      });

      if (user.notificationPreference) {
        setNotificationPrefs(user.notificationPreference);
      }
    }
  }, [user]);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value,
      isEdit: true
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationPrefChange = (key) => {
    setNotificationPrefs(prev => ({
      ...prev,
      [key]: !prev[key],
      isEdit: true
    }));
  };

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast({
        title: "Profile updated successfully",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save profile",
        description: error.message || 'Failed to save profile',
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setPassword({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      toast({
        title: "Password changed successfully",
        description: "Your password has been changed successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to change password",
        description: error.message || 'Failed to change password',
        variant: "destructive",
      });
    },
  });

  const updateNotificationPrefsMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast({
        title: "Notification preferences updated successfully",
        description: "Your notification preferences have been updated successfully.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update notification preferences",
        description: error.message || 'Failed to update notification preferences',
        variant: "destructive",
      });
    },
  });


  const updateProfileMutationHandler = () => {
    updateProfileMutation.mutate({
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      country: profile.country,
      lotSize: profile.lotSize,
      leverage: profile.leverage,
      theme: profile.theme,
    });
  }

  const changePasswordMutationHandler = () => {
    if (password.newPassword !== password.confirmNewPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your new password and confirmation match.",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate(password);
  }

  const updateNotificationPrefsMutationHandler = () => {
    updateNotificationPrefsMutation.mutate({
      tradeNotifications: notificationPrefs.tradeNotifications,
      accountAlerts: notificationPrefs.accountAlerts,
      payoutUpdates: notificationPrefs.payoutUpdates,
      challengeUpdates: notificationPrefs.challengeUpdates,
      marketingEmails: notificationPrefs.marketingEmails,
      emailNotifications: notificationPrefs.emailNotifications,
    });
  }



  const onSaveHandler = () => {
    if (profile.isEdit) {
      updateProfileMutationHandler();
    }

    if (password.currentPassword && password.newPassword && password.confirmNewPassword) {
      changePasswordMutationHandler();
    }

    if (notificationPrefs.isEdit) {
      updateNotificationPrefsMutationHandler();
    }

  }



  const isSaving = updateProfileMutation.isPending || changePasswordMutation.isPending || updateNotificationPrefsMutation.isPending;

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Security Settings */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Shield className="w-5 h-5 text-amber-500" />
            Security
          </h3>

          <div className="space-y-4">
            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Current Password</label>
              <input type="password" name="currentPassword" value={password.currentPassword} onChange={handlePasswordChange} placeholder="••••••••" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`} />
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>New Password</label>
              <input type="password" name="newPassword" value={password.newPassword} onChange={handlePasswordChange} placeholder="••••••••" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`} />
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Confirm New Password</label>
              <input type="password" name="confirmNewPassword" value={password.confirmNewPassword} onChange={handlePasswordChange} placeholder="••••••••" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`} />
            </div>

            {/* <div className={`pt-4 border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Two-Factor Authentication</p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Add an extra layer of security</p>
                </div>
                <button className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-all">
                  Enable
                </button>
              </div>
            </div>*/}
          </div>
        </div>

        {/* Trading Preferences */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Key className="w-5 h-5 text-amber-500" />
            Trading Preferences
          </h3>

          <div className="space-y-4">
            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Default Lot Size</label>
              <input
                type="text"
                name="lotSize"
                value={profile.lotSize}
                onChange={handleInputChange}
                className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'}`}
              />
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Default Leverage</label>
              <select
                name="leverage"
                value={profile.leverage}
                onChange={handleInputChange}
                className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'}`}
              >
                <option value="1:100">1:100</option>
                <option value="1:50">1:50</option>
                <option value="1:30">1:30</option>
              </select>
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Chart Theme</label>
              <select
                name="theme"
                value={profile.theme}
                onChange={handleInputChange}
                className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'}`}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Bell className="w-5 h-5 text-amber-500" />
            Notifications
          </h3>

          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive trading alerts via email' },
              { key: 'tradeNotifications', label: 'Trade Notifications', desc: 'Browser notifications for trades' },
              { key: 'accountAlerts', label: 'Account Alerts', desc: 'Critical alerts via SMS' },
              { key: 'payoutUpdates', label: 'Payout Updates', desc: 'Receive weekly performance reports' },
              { key: 'challengeUpdates', label: 'Challenge Updates', desc: 'Receive updates about your challenges' },
              { key: "marketingEmails", label: "Marketing Emails", desc: "Receive marketing emails" }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.label}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs[item.key] || false}
                    onChange={() => handleNotificationPrefChange(item.key)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 ${isDark ? 'bg-white/10' : 'bg-slate-200'
                    }`}></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={onSaveHandler}
          disabled={isSaving}
          className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl px-8 py-3 h-auto font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AccountSettings;
