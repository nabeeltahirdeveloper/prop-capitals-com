import React, { useState } from 'react';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Clock,
  Check,
  Trash2,
  Award,
  DollarSign,
  TrendingUp,
  Shield,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/api/notifications';
import { useTraderTheme } from './TraderPanelLayout';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now - d) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};

const NotificationsPage = () => {
  const { isDark } = useTraderTheme();
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
  });

  // Get user notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.userId],
    queryFn: () => getUserNotifications(user?.userId),
    enabled: !!user?.userId,
    refetchInterval: 5000,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['notifications', user?.userId], (oldData = []) => {
        return oldData.map((n) => (n.id === id ? { ...n, read: true } : n));
      });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
    },
  });

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user?.userId || unreadCount === 0) return;
    try {
      await markAllNotificationsAsRead(user.userId);
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Sort: unread first, then by date
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filteredNotifications = sortedNotifications.filter(notification => {
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'challenge') return notification.category === 'CHALLENGE';
    if (activeTab === 'payout') return notification.category === 'PAYOUT';
    if (activeTab === 'account') return notification.category === 'ACCOUNT';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const warningCount = notifications.filter(n => n.type === 'WARNING').length;
  const errorCount = notifications.filter(n => n.type === 'ERROR').length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'ERROR':
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'CHALLENGE':
        return <Award className="w-4 h-4" />;
      case 'PAYOUT':
        return <DollarSign className="w-4 h-4" />;
      case 'ACCOUNT':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Notifications</h2>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              }`}
          >
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Mark All Read</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Total Notifications</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{notifications.length}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Unread</p>
          <p className="text-emerald-500 text-2xl font-bold">{unreadCount}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Warnings</p>
          <p className="text-amber-500 text-2xl font-bold">{warningCount}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Violations</p>
          <p className="text-red-500 text-2xl font-bold">{errorCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border p-4 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className={`flex items-center gap-2 rounded-xl p-1.5 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
          {[
            { key: 'all', label: 'All', count: notifications.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'challenge', label: 'Challenges', count: notifications.filter(n => n.category === 'CHALLENGE').length },
            { key: 'payout', label: 'Payouts', count: notifications.filter(n => n.category === 'PAYOUT').length },
            { key: 'account', label: 'Account', count: notifications.filter(n => n.category === 'ACCOUNT').length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab.key
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12] shadow-lg shadow-amber-500/20'
                : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.key
                ? 'bg-[#0a0d12]/20 text-[#0a0d12]'
                : isDark ? 'bg-white/10 text-gray-400' : 'bg-slate-200 text-slate-500'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className={`rounded-2xl border p-12 text-center ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
              <Bell className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
            </div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>No notifications found</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>You're all caught up</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border p-4 transition-all ${isDark ? 'bg-[#12161d] border-white/5 hover:bg-white/5' : 'bg-white border-slate-200 hover:bg-slate-50'
                } ${!notification.read ? (isDark ? 'ring-1 ring-amber-500/20' : 'ring-1 ring-amber-500/20') : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${notification.type === 'SUCCESS'
                  ? 'bg-emerald-500/10'
                  : notification.type === 'WARNING'
                    ? 'bg-amber-500/10'
                    : notification.type === 'ERROR'
                      ? 'bg-red-500/10'
                      : 'bg-blue-500/10'
                  }`}>
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-amber-500 rounded-full" />
                        )}
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                        {notification.body}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.read && (
                        <button
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                            }`}
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-500' : 'hover:bg-red-50 text-slate-600 hover:text-red-500'
                          }`}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${isDark ? 'bg-white/10 text-gray-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                      {getCategoryIcon(notification.category)}
                      {notification.category || 'SYSTEM'}
                    </span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
