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
} from '@/api/profile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (user) {
      setProfile({
        isEdit: false,
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        email: user?.email || '',
        phone: user?.profile?.phone || '',
        country: user?.profile?.country || '',
        lotSize: user?.profile?.lotSize ?? '',
        leverage: user?.profile?.leverage || '1:100',
        theme: user?.profile?.theme || 'dark',
      });

      if (user.notificationPreference) {
        setNotificationPrefs({ ...user.notificationPreference, isEdit: false });
      }
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value, isEdit: true }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPassword(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationPrefChange = (key) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key], isEdit: true }));
  };

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast({ title: "Profile updated successfully", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "Failed to save profile", description: error.message || 'Failed to save profile', variant: "destructive" });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setPassword({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      toast({ title: "Password changed successfully", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "Failed to change password", description: error.message || 'Failed to change password', variant: "destructive" });
    },
  });

  const updateNotificationPrefsMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      toast({ title: "Notification preferences updated", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "Failed to update notifications", description: error.message || 'Failed to update notification preferences', variant: "destructive" });
    },
  });

  const onSaveHandler = () => {
    if (profile.isEdit) {
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

    if (password.currentPassword && password.newPassword && password.confirmNewPassword) {
      if (password.newPassword !== password.confirmNewPassword) {
        toast({ title: "Passwords do not match", description: "Your new password and confirmation do not match.", variant: "destructive" });
        return;
      }
      changePasswordMutation.mutate(password);
    }

    if (notificationPrefs.isEdit) {
      updateNotificationPrefsMutation.mutate({
        tradeNotifications: notificationPrefs.tradeNotifications,
        accountAlerts: notificationPrefs.accountAlerts,
        payoutUpdates: notificationPrefs.payoutUpdates,
        challengeUpdates: notificationPrefs.challengeUpdates,
        marketingEmails: notificationPrefs.marketingEmails,
        emailNotifications: notificationPrefs.emailNotifications,
      });
    }
  };

  const isSaving = updateProfileMutation.isPending || changePasswordMutation.isPending || updateNotificationPrefsMutation.isPending;

  // Reusable styled input class
  const inputCls = `w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 border ${
    isDark
      ? 'bg-[#0d1117] border-white/10 text-white placeholder-white/30'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
  }`;

  // Reusable styled select wrapper using Radix Select
  const SelectField = ({ value, onValueChange, options }) => (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={`w-full px-4 py-3 h-auto rounded-xl border pr-3 focus:outline-none focus:border-amber-500/50 focus:ring-0 ${
          isDark
            ? 'bg-[#0d1117] border-white/10 text-white data-[state=open]:border-amber-500/50'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        className={isDark ? 'bg-[#1a1f2a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}
      >
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className={isDark ? 'text-white focus:bg-amber-500/20 focus:text-amber-400' : 'text-slate-900 focus:bg-amber-50 focus:text-amber-700'}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const labelCls = `text-sm block mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`;

  const cardCls = `rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal Information */}
        <div className={cardCls}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <User className="w-5 h-5 text-amber-500" />
            Personal Information
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className={`w-full rounded-xl pl-9 pr-4 py-3 border opacity-60 cursor-not-allowed ${
                    isDark
                      ? 'bg-white/5 border-white/10 text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Email cannot be changed</p>
            </div>

            <div>
              <label className={labelCls}>Phone Number</label>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleInputChange}
                  placeholder="+1 234 567 8900"
                  className={`w-full rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-amber-500/50 border ${
                    isDark
                      ? 'bg-[#0d1117] border-white/10 text-white placeholder-white/30'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Country</label>
              <div className="relative">
                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  name="country"
                  value={profile.country}
                  onChange={handleInputChange}
                  placeholder="e.g. United States"
                  className={`w-full rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:border-amber-500/50 border ${
                    isDark
                      ? 'bg-[#0d1117] border-white/10 text-white placeholder-white/30'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className={cardCls}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Shield className="w-5 h-5 text-amber-500" />
            Security
          </h3>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={password.currentPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={password.newPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Confirm New Password</label>
              <input
                type="password"
                name="confirmNewPassword"
                value={password.confirmNewPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Trading Preferences */}
        <div className={cardCls}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Key className="w-5 h-5 text-amber-500" />
            Trading Preferences
          </h3>

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Default Lot Size</label>
              <input
                type="number"
                name="lotSize"
                value={profile.lotSize}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                placeholder="0.01"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Default Leverage</label>
              <SelectField
                value={profile.leverage}
                onValueChange={(val) => setProfile(prev => ({ ...prev, leverage: val, isEdit: true }))}
                options={[
                  { value: '1:100', label: '1:100' },
                  { value: '1:50', label: '1:50' },
                  { value: '1:30', label: '1:30' },
                ]}
              />
            </div>

            <div>
              <label className={labelCls}>Chart Theme</label>
              <SelectField
                value={profile.theme}
                onValueChange={(val) => setProfile(prev => ({ ...prev, theme: val, isEdit: true }))}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className={cardCls}>
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
              { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive marketing emails' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.label}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={notificationPrefs[item.key] || false}
                    onChange={() => handleNotificationPrefChange(item.key)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
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
