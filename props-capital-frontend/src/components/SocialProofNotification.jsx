import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, TrendingUp, Award, DollarSign, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

// Sample data for notifications
const firstNames = [
  'Michael', 'Sarah', 'James', 'Emma', 'David', 'Sofia', 'Ahmed', 'Maria',
  'John', 'Lisa', 'Carlos', 'Anna', 'Wei', 'Fatima', 'Lucas', 'Priya',
  'Mohammed', 'Elena', 'Raj', 'Olivia', 'Chen', 'Isabella', 'Omar', 'Mia'
];

const locations = [
  { city: 'New York', country: 'USA', code: 'US' },
  { city: 'London', country: 'UK', code: 'GB' },
  { city: 'Dubai', country: 'UAE', code: 'AE' },
  { city: 'Singapore', country: 'Singapore', code: 'SG' },
  { city: 'Sydney', country: 'Australia', code: 'AU' },
  { city: 'Toronto', country: 'Canada', code: 'CA' },
  { city: 'Berlin', country: 'Germany', code: 'DE' },
  { city: 'Paris', country: 'France', code: 'FR' },
  { city: 'Mumbai', country: 'India', code: 'IN' },
  { city: 'São Paulo', country: 'Brazil', code: 'BR' },
  { city: 'Tokyo', country: 'Japan', code: 'JP' },
  { city: 'Lagos', country: 'Nigeria', code: 'NG' },
  { city: 'Cairo', country: 'Egypt', code: 'EG' },
  { city: 'Johannesburg', country: 'South Africa', code: 'ZA' },
  { city: 'Mexico City', country: 'Mexico', code: 'MX' },
  { city: 'Seoul', country: 'South Korea', code: 'KR' },
  { city: 'Amsterdam', country: 'Netherlands', code: 'NL' },
  { city: 'Madrid', country: 'Spain', code: 'ES' },
  { city: 'Karachi', country: 'Pakistan', code: 'PK' },
  { city: 'Warsaw', country: 'Poland', code: 'PL' },
];

// Country flag component using flagcdn.com
const CountryFlag = ({ code, className = "" }) => (
  <img
    src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
    srcSet={`https://flagcdn.com/w80/${code.toLowerCase()}.png 2x`}
    alt={code}
    className={`inline-block rounded-sm ${className}`}
    style={{ width: '20px', height: '14px', objectFit: 'cover' }}
  />
);

const notificationTypes = [
  {
    type: 'challenge_passed',
    getMessage: (name, location) => `${name} from ${location.city} just passed their challenge!`,
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  {
    type: 'got_funded',
    getMessage: (name, location, amount) => `${name} from ${location.city} just got funded $${amount}K!`,
    icon: TrendingUp,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    type: 'payout_received',
    getMessage: (name, location, amount) => `${name} from ${location.city} received a $${amount.toLocaleString()} payout!`,
    icon: DollarSign,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    type: 'challenge_started',
    getMessage: (name, location) => `${name} from ${location.city} just started a challenge!`,
    icon: Award,
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
];

const SocialProofNotification = () => {
  const { isDark } = useTheme();
  const [notification, setNotification] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const generateNotification = useCallback(() => {
    const name = firstNames[Math.floor(Math.random() * firstNames.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];

    // Generate random amounts based on type
    let amount;
    if (type.type === 'got_funded') {
      amount = [25, 50, 100, 200][Math.floor(Math.random() * 4)];
    } else if (type.type === 'payout_received') {
      amount = Math.floor(Math.random() * 45000) + 5000;
    }

    const timeAgo = Math.floor(Math.random() * 5) + 1; // 1-5 minutes ago

    return {
      id: Date.now(),
      name,
      location,
      type,
      amount,
      timeAgo,
      message: type.getMessage(name, location, amount),
    };
  }, []);

  const showNotification = useCallback(() => {
    const newNotification = generateNotification();
    setNotification(newNotification);
    setIsVisible(true);
    setIsExiting(false);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        setNotification(null);
      }, 300);
    }, 5000);
  }, [generateNotification]);

  const hideNotification = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setNotification(null);
    }, 300);
  };

  useEffect(() => {
    // Show first notification after 8 seconds
    const initialTimeout = setTimeout(() => {
      showNotification();
    }, 8000);

    // Then show notifications every 15-25 seconds
    const interval = setInterval(() => {
      const randomDelay = Math.floor(Math.random() * 10000) + 15000;
      setTimeout(showNotification, randomDelay);
    }, 25000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [showNotification]);

  if (!isVisible || !notification) return null;

  const IconComponent = notification.type.icon;

  return (
    <div
      className={`fixed bottom-24 left-4 sm:left-6 z-40 max-w-[320px] sm:max-w-[360px] transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-[-20px]' : 'opacity-100 translate-x-0'
        }`}
      data-testid="social-proof-notification"
    >
      <div
        className={`rounded-xl shadow-2xl border overflow-hidden ${isDark
          ? 'bg-[#12161d] border-white/10'
          : 'bg-white border-slate-200'
          }`}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-600 animate-shrink-width" />

        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type.bgColor}`}>
              <IconComponent className={`w-5 h-5 ${notification.type.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {notification.message}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <CountryFlag code={notification.location.code} />
                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                  {notification.timeAgo} min ago
                </span>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={hideNotification}
              className={`p-1 rounded-full transition-colors flex-shrink-0 ${isDark ? 'hover:bg-white/10 text-gray-500' : 'hover:bg-slate-100 text-slate-400'
                }`}
              data-testid="close-notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink-width {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink-width {
          animation: shrink-width 5s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default SocialProofNotification;
