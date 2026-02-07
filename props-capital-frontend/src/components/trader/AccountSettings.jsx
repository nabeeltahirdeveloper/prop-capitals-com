import React from 'react';
import { User, Mail, Phone, MapPin, Shield, Bell, Key, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTraderTheme } from './TraderPanelLayout';

const AccountSettings = () => {
  const { isDark } = useTraderTheme();

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <User className="w-5 h-5 text-amber-500" />
            Profile Information
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>First Name</label>
                <input type="text" defaultValue="John" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`} />
              </div>
              <div>
                <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Last Name</label>
                <input type="text" defaultValue="Doe" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                  }`} />
              </div>
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Email</label>
              <input type="email" defaultValue="john.doe@example.com" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`} />
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Phone</label>
              <input type="tel" defaultValue="+1 234 567 8900" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`} />
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Country</label>
              <select className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`}>
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Germany</option>
                <option>France</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <h3 className={`font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Shield className="w-5 h-5 text-amber-500" />
            Security
          </h3>

          <div className="space-y-4">
            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Current Password</label>
              <input type="password" placeholder="••••••••" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`} />
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>New Password</label>
              <input type="password" placeholder="••••••••" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`} />
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Confirm New Password</label>
              <input type="password" placeholder="••••••••" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`} />
            </div>

            <div className={`pt-4 border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>Two-Factor Authentication</p>
                  <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Add an extra layer of security</p>
                </div>
                <button className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-all">
                  Enable
                </button>
              </div>
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
              { label: 'Email Notifications', desc: 'Receive trading alerts via email' },
              { label: 'Push Notifications', desc: 'Browser notifications for trades' },
              { label: 'SMS Alerts', desc: 'Critical alerts via SMS' },
              { label: 'Weekly Reports', desc: 'Receive weekly performance reports' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.label}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={i < 2} className="sr-only peer" />
                  <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 ${isDark ? 'bg-white/10' : 'bg-slate-200'
                    }`}></div>
                </label>
              </div>
            ))}
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
              <input type="text" defaultValue="0.01" className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`} />
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Default Leverage</label>
              <select className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`}>
                <option>1:100</option>
                <option>1:50</option>
                <option>1:30</option>
              </select>
            </div>

            <div>
              <label className={`text-sm block mb-1 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Chart Theme</label>
              <select className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`}>
                <option>Dark</option>
                <option>Light</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-xl px-8 py-3 h-auto font-bold">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default AccountSettings;
