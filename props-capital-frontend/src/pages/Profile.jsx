import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import {
  getProfile,
  updateProfile,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
  getVerificationDocuments,
  uploadVerificationDocument,
} from '@/api/profile';
import { useTranslation } from '../contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Key,
  Upload,
  CheckCircle,
  AlertCircle,
  Save,
  Loader2,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function Profile() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState({ govId: false, address: false });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // File upload state
  const [uploadingFile, setUploadingFile] = useState(null);

  // Fetch user data from /auth/me (includes profile, verification docs, notification prefs)
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Profile form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    country: '',
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
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || '',
        phone: user.profile?.phone || '',
        address: user.profile?.address || '',
        city: user.profile?.city || '',
        country: user.profile?.country || '',
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
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (error) => {
      console.error('Failed to save profile:', error);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) => changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert(t('profile.passwordChanged') || 'Password changed successfully');
    },
    onError: (error) => {
      console.error('Failed to change password:', error);
      alert(error.response?.data?.message || 'Failed to change password');
    },
  });

  // Update notification preferences mutation
  const updateNotificationPrefsMutation = useMutation({
    mutationFn: updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    },
  });

  // Upload verification document mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: ({ documentType, fileUrl }) => uploadVerificationDocument(documentType, fileUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      setIsUploadDialogOpen({ govId: false, address: false });
      setUploadingFile(null);
      alert(t('profile.documentUploaded') || 'Document uploaded successfully');
    },
    onError: (error) => {
      console.error('Failed to upload document:', error);
      setUploadingFile(null);
      alert('Failed to upload document');
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordChange = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(t('profile.passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      alert(t('profile.passwordTooShort') || 'Password must be at least 8 characters');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleFileUpload = async (documentType, file) => {
    if (!file) return;

    setUploadingFile(documentType);

    // In a real implementation, you would upload the file to S3/cloud storage first
    // For now, we'll use a data URL as a placeholder
    const reader = new FileReader();
    reader.onloadend = () => {
      uploadDocumentMutation.mutate({
        documentType,
        fileUrl: reader.result, // In production, this should be the cloud storage URL
      });
    };
    reader.readAsDataURL(file);
  };

  const handleNotificationToggle = (key) => {
    const updated = { ...notificationPrefs, [key]: !notificationPrefs[key] };
    setNotificationPrefs(updated);
    updateNotificationPrefsMutation.mutate({ [key]: updated[key] });
  };

  // Get verification document status
  const getDocumentStatus = (docType) => {
    if (!user?.verificationDocuments) return 'NOT_UPLOADED';
    const doc = user.verificationDocuments.find(d => d.documentType === docType);
    return doc?.status || 'NOT_UPLOADED';
  };

  const getDocumentStatusText = (status) => {
    switch (status) {
      case 'APPROVED': return t('profile.approved') || 'Approved';
      case 'PENDING': return t('profile.pending') || 'Pending';
      case 'REJECTED': return t('profile.rejected') || 'Rejected';
      default: return t('profile.notUploaded') || 'Not uploaded';
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {t('profile.loadError')}
        </div>
      </div>
    );
  }

  const displayName = user?.profile
    ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() || user?.email || t('profile.user')
    : user?.email || t('profile.user');
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U';

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">{t('profile.title')}</h1>
        <p className="text-slate-400">{t('profile.subtitle')}</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold">
            {initials}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">{displayName}</h2>
            <p className="text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
              <span className={`px-2 py-1  rounded text-xs font-medium ${user?.role === 'ADMIN'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                {user?.role === 'ADMIN' ? t('profile.admin') : t('profile.trader')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
          <TabsTrigger value="personal" className="flex items-center justify-center py-2 data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white text-xs sm:text-sm">
            <User className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('profile.personalInfo')}</span>
            <span className="sm:hidden">{t('profile.personal')}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center justify-center py-2 data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white text-xs sm:text-sm">
            <Shield className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('profile.security')}</span>
            <span className="sm:hidden">{t('profile.sec')}</span>
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center justify-center py-2 data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white text-xs sm:text-sm">
            <CheckCircle className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('profile.verification')}</span>
            <span className="sm:hidden">{t('profile.verify')}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center justify-center py-2 data-[state=active]:bg-slate-800 text-slate-400 data-[state=active]:text-white text-xs sm:text-sm">
            <Bell className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">{t('profile.notifications')}</span>
            <span className="sm:hidden">{t('profile.notif')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-white mb-6">{t('profile.personalInformation')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label className="text-slate-300">{t('profile.firstName')}</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder={t('profile.firstNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('profile.lastName')}</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder={t('profile.lastNamePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('profile.email')}</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-800 border-slate-700 text-white opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('profile.phoneNumber')}</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('profile.phonePlaceholder')}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('profile.country')}</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder={t('profile.countryPlaceholder')}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('profile.city')}</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={t('profile.cityPlaceholder')}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">{t('profile.address')}</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('profile.addressPlaceholder')}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-emerald-500 to-cyan-500"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('profile.saving')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t('profile.saveChanges')}
                  </>
                )}
              </Button>
              {saved && (
                <span className="text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {t('profile.changesSaved')}
                </span>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-white mb-6">{t('profile.securitySettings')}</h3>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-800/50 rounded-lg gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{t('profile.password')}</p>
                    <p className="text-sm text-slate-400">{t('profile.changePasswordDesc') || 'Update your password to keep your account secure'}</p>
                  </div>
                </div>
                <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white w-full sm:w-auto">
                      {t('profile.changePassword')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">{t('profile.changePassword')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t('profile.currentPassword')}</Label>
                        <div className="relative">
                          <Input
                            type={showPassword.current ? 'text' : 'password'}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                            className="absolute right-2 top-2.5 text-slate-400"
                          >
                            {showPassword.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t('profile.newPassword')}</Label>
                        <div className="relative">
                          <Input
                            type={showPassword.new ? 'text' : 'password'}
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                            className="absolute right-2 top-2.5 text-slate-400"
                          >
                            {showPassword.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">{t('profile.confirmPassword')}</Label>
                        <div className="relative">
                          <Input
                            type={showPassword.confirm ? 'text' : 'password'}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="bg-slate-800 border-slate-700 text-white pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                            className="absolute right-2 top-2.5 text-slate-400"
                          >
                            {showPassword.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <Button
                        onClick={handlePasswordChange}
                        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t('profile.changing') || 'Changing...'}
                          </>
                        ) : (
                          t('profile.changePassword')
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-slate-800/50 rounded-lg gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{t('profile.twoFactorAuth')}</p>
                    <p className="text-sm text-slate-400">{t('profile.twoFactorDesc')}</p>
                  </div>
                </div>
                <Button variant="outline" className="border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700" disabled>
                  {t('profile.comingSoon') || 'Coming Soon'}
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{t('profile.emailNotifications')}</p>
                    <p className="text-sm text-slate-400">{t('profile.emailNotificationsDesc')}</p>
                  </div>
                </div>
                <div
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${notificationPrefs.emailNotifications ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  onClick={() => handleNotificationToggle('emailNotifications')}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notificationPrefs.emailNotifications ? 'right-1' : 'left-1'
                    }`} />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="verification">
          <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-white mb-6">{t('profile.identityVerification')}</h3>
            <p className="text-slate-400 mb-6">
              {t('profile.verificationDesc')}
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{t('profile.governmentID')}</p>
                      <p className="text-sm text-slate-400">{t('profile.governmentIDDesc')}</p>
                    </div>
                  </div>
                  <span className={`min-w-[88px] px-1 sm:px-3 py-1 rounded text-xs sm:text-sm ${getDocumentStatus('GOVERNMENT_ID') === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                    getDocumentStatus('GOVERNMENT_ID') === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                      getDocumentStatus('GOVERNMENT_ID') === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-700 text-slate-400'
                    }`}>
                    {getDocumentStatusText(getDocumentStatus('GOVERNMENT_ID'))}
                  </span>
                </div>
                <Dialog open={isUploadDialogOpen.govId} onOpenChange={(open) => setIsUploadDialogOpen({ ...isUploadDialogOpen, govId: open })}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white" disabled={uploadingFile === 'GOVERNMENT_ID'}>
                      {uploadingFile === 'GOVERNMENT_ID' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('profile.uploading') || 'Uploading...'}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {t('profile.uploadDocument')}
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">{t('profile.uploadGovernmentID')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('GOVERNMENT_ID', file);
                        }}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{t('profile.proofOfAddress')}</p>
                      <p className="text-sm text-slate-400">{t('profile.proofOfAddressDesc')}</p>
                    </div>
                  </div>
                  <span className={`min-w-[88px] px-1 sm:px-3 py-1 rounded text-xs sm:text-sm ${getDocumentStatus('PROOF_OF_ADDRESS') === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                    getDocumentStatus('PROOF_OF_ADDRESS') === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                      getDocumentStatus('PROOF_OF_ADDRESS') === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                        'bg-slate-700 text-slate-400'
                    }`}>
                    {getDocumentStatusText(getDocumentStatus('PROOF_OF_ADDRESS'))}
                  </span>
                </div>
                <Dialog open={isUploadDialogOpen.address} onOpenChange={(open) => setIsUploadDialogOpen({ ...isUploadDialogOpen, address: open })}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white" disabled={uploadingFile === 'PROOF_OF_ADDRESS'}>
                      {uploadingFile === 'PROOF_OF_ADDRESS' ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('profile.uploading') || 'Uploading...'}
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          {t('profile.uploadDocument')}
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">{t('profile.uploadProofOfAddress')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('PROOF_OF_ADDRESS', file);
                        }}
                        className="bg-slate-800 border-slate-700 text-white"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
            <h3 className="text-lg font-semibold text-white mb-6">{t('profile.notificationPreferences')}</h3>
            <div className="space-y-4">
              {[
                { key: 'tradeNotifications', title: t('profile.tradeNotifications'), desc: t('profile.tradeNotificationsDesc') },
                { key: 'accountAlerts', title: t('profile.accountAlerts'), desc: t('profile.accountAlertsDesc') },
                { key: 'payoutUpdates', title: t('profile.payoutUpdates'), desc: t('profile.payoutUpdatesDesc') },
                { key: 'challengeUpdates', title: t('profile.challengeUpdates'), desc: t('profile.challengeUpdatesDesc') },
                { key: 'marketingEmails', title: t('profile.marketingEmails'), desc: t('profile.marketingEmailsDesc') },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-sm text-slate-400">{item.desc}</p>
                  </div>
                  <div
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${notificationPrefs[item.key] ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                    onClick={() => handleNotificationToggle(item.key)}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${notificationPrefs[item.key] ? 'right-1' : 'left-1'
                      }`} />
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
