import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Building2, Bell, Shield } from 'lucide-react';

import ProfileTab from '@/components/settings/ProfileTab';
import BusinessTab from '@/components/settings/BusinessTab';
import NotificationsTab from '@/components/settings/NotificationsTab';
import SecurityTab from '@/components/settings/SecurityTab';

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'business',      label: 'Business',      icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security',      label: 'Security',      icon: Shield },
];

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: '', phone: '', country: '',
    business_name: '', business_type: '', business_website: '',
    business_industry: '', business_description: '', primary_goal: '',
    profile_photo: '', cover_photo: '',
    notify_campaign_approved: true, notify_campaign_rejected: true,
    notify_payment_confirmed: true, notify_campaign_completed: true,
    notify_messages: true,
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({
        full_name:                  u.full_name || '',
        phone:                      u.phone || '',
        country:                    u.country || '',
        business_name:              u.business_name || '',
        business_type:              u.business_type || '',
        business_website:           u.business_website || '',
        business_industry:          u.business_industry || '',
        business_description:       u.business_description || '',
        primary_goal:               u.primary_goal || '',
        profile_photo:              u.profile_photo || '',
        cover_photo:                u.cover_photo || '',
        notify_campaign_approved:   u.notify_campaign_approved !== false,
        notify_campaign_rejected:   u.notify_campaign_rejected !== false,
        notify_payment_confirmed:   u.notify_payment_confirmed !== false,
        notify_campaign_completed:  u.notify_campaign_completed !== false,
        notify_messages:            u.notify_messages !== false,
      });
    });
  }, []);

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your profile, business info, and preferences</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-secondary rounded-xl overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center
              ${activeTab === id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'profile'       && <ProfileTab       user={user} form={form} setForm={setForm} />}
      {activeTab === 'business'      && <BusinessTab      form={form} setForm={setForm} />}
      {activeTab === 'notifications' && <NotificationsTab form={form} setForm={setForm} />}
      {activeTab === 'security'      && <SecurityTab      user={user} />}
    </div>
  );
}