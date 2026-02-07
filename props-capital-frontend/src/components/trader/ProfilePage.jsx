import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  Edit3,
  Camera,
  Save,
  X,
  Globe,
  Building
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';

const ProfilePage = () => {
  const { isDark } = useTraderTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    country: 'United States',
    city: 'New York',
    timezone: 'EST (UTC-5)',
    joinDate: 'February 2025',
    tradingExperience: '3+ years',
    preferredPlatform: 'MetaTrader 5'
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });

  const handleSave = () => {
    setProfile({ ...editedProfile });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setIsEditing(false);
  };

  const stats = [
    { label: 'Challenges Completed', value: '3', color: 'emerald' },
    { label: 'Total Payouts', value: '$12,450', color: 'amber' },
    { label: 'Win Rate', value: '67%', color: 'blue' },
    { label: 'Member Since', value: 'Feb 2025', color: 'purple' },
  ];

  return (
    <div className="space-y-6" data-testid="profile-page">
      {/* Header Card */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-[#0a0d12] font-black text-3xl">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            <button className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'
              } transition-all`}>
              <Camera className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {profile.firstName} {profile.lastName}
              </h1>
              <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            </div>
            <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{profile.email}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                <MapPin className="w-4 h-4" />
                {profile.city}, {profile.country}
              </span>
              <span className={`flex items-center gap-1 text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                <Calendar className="w-4 h-4" />
                Joined {profile.joinDate}
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${isEditing
              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
              : isDark
                ? 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
          >
            {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? 'Cancel' : 'Edit Profile'}
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
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Personal Information</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>First Name</label>
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
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.firstName}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Last Name</label>
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
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                <Mail className="w-4 h-4 inline mr-1" /> Email Address
              </label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.email}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                <Phone className="w-4 h-4 inline mr-1" /> Phone Number
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
                <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location & Preferences */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-2 mb-6">
            <Globe className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Location & Preferences</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Country</label>
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
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.country}</p>
                )}
              </div>
              <div>
                <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>City</label>
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
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.city}</p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Timezone</label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.timezone}</p>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Trading Experience</label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.tradingExperience}</p>
            </div>

            <div>
              <label className={`block text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Preferred Platform</label>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{profile.preferredPlatform}</p>
            </div>
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
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] font-bold rounded-xl transition-all"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      )}

      {/* Security Section */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
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
      </div>
    </div>
  );
};

export default ProfilePage;
