import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
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
  // Bug fix: use AuthContext user as seed — no redundant me() call
  const { user: authUser, checkUserAuth } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    full_name: '', phone: '', country: '',
    business_name: '', business_category: '', business_website: '',
    business_industry: '', business_description: '', primary_goal: '',
    profile_photo: '', cover_photo: '',
    notify_campaign_approved: true, notify_campaign_rejected: true,
    notify_payment_confirmed: true, notify_campaign_completed: true,
    notify_messages: true,
  });

  useEffect(() => {
    if (!authUser) return;
    setUser(authUser);
    setForm({
      full_name:                  authUser.full_name || '',
      phone:                      authUser.phone || '',
      country:                    authUser.country || '',
      business_name:              authUser.business_name || '',
      // Bug fix: was reading business_type — correct field is business_category
      business_category:          authUser.business_category || authUser.business_type || '',
      business_website:           authUser.business_website || '',
      business_industry:          authUser.business_industry || '',
      business_description:       authUser.business_description || '',
      primary_goal:               authUser.primary_goal || '',
      profile_photo:              authUser.profile_photo || '',
      cover_photo:                authUser.cover_photo || '',
      notify_campaign_approved:   authUser.notify_campaign_approved !== false,
      notify_campaign_rejected:   authUser.notify_campaign_rejected !== false,
      notify_payment_confirmed:   authUser.notify_payment_confirmed !== false,
      notify_campaign_completed:  authUser.notify_campaign_completed !== false,
      notify_messages:            authUser.notify_messages !== false,
    });
  }, [authUser?.id]);

  async function saveProfile(updates) {
    await base44.auth.updateMe(updates);
    // Refresh AuthContext so all pages see latest user data
    await checkUserAuth();
    setUser(u => ({ ...u, ...updates }));
  }

  if (!user) {
    return (
      <div className="p-4 lg:p-8 space-y-4 max-w-2xl mx-auto">
        <div className="h-10 w-48 bg-secondary rounded-lg animate-pulse" />
        <div className="h-64 bg-secondary rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and business details</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-border overflow-x-auto pb-0 scrollbar-none">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <ProfileTab user={user} form={form} setForm={setForm} onSave={saveProfile} />
      )}
      {activeTab === 'business' && (
        <BusinessTab user={user} form={form} setForm={setForm} onSave={saveProfile} />
      )}
      {activeTab === 'notifications' && (
        <NotificationsTab user={user} form={form} setForm={setForm} onSave={saveProfile} />
      )}
      {activeTab === 'security' && (
        <SecurityTab user={user} />
      )}
    </div>
  );
}
