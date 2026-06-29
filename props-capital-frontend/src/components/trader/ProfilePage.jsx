import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  Edit3,
  Camera,
  Save,
  X,
  Globe,
  Loader2
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import {
  updateProfile,
} from '@/api/profile';
import { formatDate } from '@/utils/dateFormating';
import { useToast } from "@/components/ui/use-toast";


const ProfilePage = () => {
  const { isDark } = useTraderTheme();
  const { formatAmount } = useCurrency();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    timezone: '',
    joinDate: '',
    tradingExperience: '',
    preferredPlatform: ''
  });
  const [editedProfile, setEditedProfile] = useState({ ...profile });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const avatarInputRef = useRef(null);
  const [profileImage, setProfileImage] = useState('');

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (user) {
      const userKey = user.id || user.userId || user.email;
      const savedAvatar = userKey ? localStorage.getItem(`profile-avatar-${userKey}`) : null;
      const serverAvatar =
        user.profile?.avatarUrl ||
        user.profile?.profilePicture ||
        user.profile?.profileImage ||
        user.profile?.photoUrl ||
        '';
      const joinDate = user.profile?.joinDate || user.createdAt;
      setProfile({
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        city: user.profile?.city || '',
        country: user.profile?.country || '',
        timezone: user.profile?.timezone || '',
        joinDate: joinDate ? formatDate(joinDate) : '',
        tradingExperience: user.profile?.tradingExperience || '',
        preferredPlatform: user.profile?.preferredPlatform || '',
      });
      setProfileImage(savedAvatar || serverAvatar || '');
    }
  }, [user]);

  useEffect(() => {
    setEditedProfile({ ...profile });
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      setIsEditing(false);
      toast({
        title: t('profilePanel.toastProfileUpdatedTitle'),
        description: t('profilePanel.toastProfileUpdatedDesc'),
      });
    },
    onError: (error) => {
      toast({
        title: t('profilePanel.toastSaveFailedTitle'),
        description: error.message || t('profilePanel.toastSaveFailedTitle'),
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const payload = {};
    const fields = ['firstName', 'lastName', 'phone', 'country', 'city', 'timezone'];
    fields.forEach((key) => {
      const val = (editedProfile[key] || '').trim();
      if (val) payload[key] = val;
    });
    updateProfileMutation.mutate(payload);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const getInitial = (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed || trimmed === '-') return '';
    return trimmed.charAt(0).toUpperCase();
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('profilePanel.toastInvalidFileTitle'),
        description: t('profilePanel.toastInvalidFileDesc'),
        variant: 'destructive',
      });
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast({
        title: t('profilePanel.toastFileTooLargeTitle'),
        description: t('profilePanel.toastFileTooLargeDesc'),
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = typeof reader.result === 'string' ? reader.result : '';
      if (!imageData) return;

      setProfileImage(imageData);

      const userKey = user?.id || user?.userId || user?.email;
      if (userKey) {
        localStorage.setItem(`profile-avatar-${userKey}`, imageData);
      }

      toast({
        title: t('profilePanel.toastAvatarUpdatedTitle'),
        description: t('profilePanel.toastAvatarUpdatedDesc'),
        variant: 'success',
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const isVerified = user?.verificationDocuments?.some((doc) => doc.status === 'APPROVED') ?? false;

  const stats = [
    { label: t('profilePanel.statChallengesCompleted'), value: user?.totalCompletedChallenges ?? 0, color: 'emerald' },
    { label: t('profilePanel.statTotalPayouts'), value: formatAmount(Number(user?.totalPayouts) || 0), color: 'amber' },
    { label: t('profilePanel.statWinRate'), value: `${user?.winRate ?? 0}%`, color: 'blue' },
    { label: t('profilePanel.statMemberSince'), value: user?.createdAt ? formatDate(user.createdAt) : '-', color: 'purple' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-2xl border p-6 text-center ${isDark ? 'bg-[#12161d] border-white/5 text-gray-400' : 'bg-white border-slate-200 text-slate-500'}`}>
        {t('profilePanel.errorLoadProfile')}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="profile-page">
      {/* Header Card */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-[#0a0d12] font-black text-3xl overflow-hidden">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={t('profilePanel.avatarAlt')}
                  className="w-full h-full object-cover"
                />
              ) : (
                `${getInitial(profile.firstName)}${getInitial(profile.lastName)}` || 'U'
              )}
            </div>
            <button
              type="button"
              onClick={handleAvatarClick}
              className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
              } transition-all`}>
              <Camera className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {[profile.firstName, profile.lastName].filter(Boolean).join(' ') || t('profilePanel.unknownUser')}
              </h1>
              {isVerified && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded">
                  <CheckCircle className="w-3 h-3" />
                  {t('profilePanel.verifiedBadge')}
                </span>
              )}
            </div>
            <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{profile.email}</p>
            <div className="flex items-center gap-4 mt-3">
              {(profile.city || profile.country) && (
                <span className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  <MapPin className="w-4 h-4" />
                  {[profile.city, profile.country].filter(Boolean).join(', ')}
                </span>
              )}
              {profile.joinDate && (
                <span className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  <Calendar className="w-4 h-4" />
                  {t('profilePanel.joinedLabel', { date: profile.joinDate })}
                </span>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${isEditing
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              : isDark
                ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? t('profilePanel.cancelButton') : t('profilePanel.editProfileButton')}
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-4 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}
          >
            <p className={`text-sm mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color === 'emerald' ? 'text-emerald-500' :
              stat.color === 'amber' ? 'text-amber-500' :
                stat.color === 'blue' ? 'text-blue-500' : 'text-purple-500'
              }`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-6">
            <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('profilePanel.personalInformation')}</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{t('profilePanel.firstNameLabel')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.firstName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border ${isDark
                      ? 'bg-white/5 border-white/10 text-white focus:border-amber-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                  />
                ) : (
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.firstName || '-'}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{t('profilePanel.lastNameLabel')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.lastName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border ${isDark
                      ? 'bg-white/5 border-white/10 text-white focus:border-amber-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                  />
                ) : (
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.lastName || '-'}</p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                <Mail className="w-4 h-4 inline mr-1" /> {t('profilePanel.emailAddressLabel')}
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.email || '-'}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                {t('profilePanel.emailHelperText')}
              </p>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                <Phone className="w-4 h-4 inline mr-1" /> {t('profilePanel.phoneNumberLabel')}
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedProfile.phone}
                  onChange={(e) => setEditedProfile({ ...editedProfile, phone: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${isDark
                    ? 'bg-white/5 border-white/10 text-white focus:border-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
              ) : (
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.phone || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location & Preferences */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-6">
            <Globe className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('profilePanel.locationPreferences')}</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{t('profilePanel.countryLabel')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.country}
                    onChange={(e) => setEditedProfile({ ...editedProfile, country: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border ${isDark
                      ? 'bg-white/5 border-white/10 text-white focus:border-amber-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                  />
                ) : (
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.country || '-'}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{t('profilePanel.cityLabel')}</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.city}
                    onChange={(e) => setEditedProfile({ ...editedProfile, city: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-xl border ${isDark
                      ? 'bg-white/5 border-white/10 text-white focus:border-amber-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                      } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                  />
                ) : (
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.city || '-'}</p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{t('profilePanel.timezoneLabel')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.timezone}
                  placeholder={t('profilePanel.timezonePlaceholder')}
                  onChange={(e) => setEditedProfile({ ...editedProfile, timezone: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border ${isDark
                    ? 'bg-white/5 border-white/10 text-white focus:border-amber-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                />
              ) : (
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.timezone || '-'}</p>
              )}
            </div>

            {/* Trading Experience — not yet supported by backend schema */}
            {/* <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Trading Experience</label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.tradingExperience || '-'}</p>
            </div> */}

            {/* Preferred Platform — not yet supported by backend schema */}
            {/* <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Preferred Platform</label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.preferredPlatform || '-'}</p>
            </div> */}
          </div>
        </div>
      </div>

      {/* Save Button (when editing) */}
      {isEditing && (
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${isDark
              ? 'bg-white/5 text-gray-400 hover:bg-white/10'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            {t('profilePanel.cancelButton')}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={updateProfileMutation.isPending}
          >
            {updateProfileMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('profilePanel.savingButton')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('profilePanel.saveChangesButton')}
              </>
            )}
          </button>
        </div>
      )}

      {/* Security Section */}
      {/* <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <Shield className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Security</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Two-Factor Authentication</p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
              Add an extra layer of security to your account
            </p>
          </div>
          <button className={`px-4 py-2 rounded-xl font-medium transition-all ${isDark
            ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}>
            Enabled
          </button>
        </div>
      </div> */}
    </div>
  );
};

export default ProfilePage;
