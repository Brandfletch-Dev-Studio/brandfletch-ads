import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Lock, LogOut, Save, Camera, Mail, Phone, Building2, Globe, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { COUNTRIES } from '@/lib/constants';
import { toast } from 'sonner';

export default function ProfileSettings() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ full_name: '', country: '', phone: '', business_name: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setForm({
        full_name: u.full_name || '',
        country: u.country || '',
        phone: u.phone || '',
        business_name: u.business_name || '',
      });
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    await base44.auth.updateMe(form);
    toast.success('Profile updated!');
    setSaving(false);
  }

  const initials = form.full_name
    ? form.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold font-heading">Profile & Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account information and preferences</p>
      </div>

      {/* Avatar + name hero */}
      <Card className="shadow-sm overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]" />
        <CardContent className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
            <div className="relative w-20 h-20 rounded-2xl bg-[hsl(var(--primary))] border-4 border-card flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
            </div>
            <div className="sm:pb-1 flex-1 min-w-0">
              <h2 className="text-xl font-bold font-heading truncate">{form.full_name || 'Your Name'}</h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              {user?.role && user.role !== 'user' && (
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  <Shield className="w-3 h-3" />
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile form */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <User className="w-4 h-4 text-muted-foreground" /> Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</Label>
              <Input
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Jane Doe"
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+265 999 000 000"
                  className="pl-9 h-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business / Brand Name</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={form.business_name}
                onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                placeholder="Your business or brand name"
                className="pl-9 h-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Country</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
              <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
                <SelectTrigger className="pl-9 h-10">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={user?.email || ''} disabled className="pl-9 h-10 bg-secondary text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Email address cannot be changed.</p>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Account security */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <Lock className="w-4 h-4 text-muted-foreground" /> Account & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className="text-xs text-muted-foreground">Use "Forgot Password" on the login page to reset.</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/50"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}