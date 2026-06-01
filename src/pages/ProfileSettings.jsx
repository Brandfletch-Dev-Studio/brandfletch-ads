import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Mail, Lock, LogOut, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Full Name</Label>
            <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
          </div>
          <div>
            <Label className="mb-1.5 block">Business Name</Label>
            <Input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} placeholder="Your business or brand name" />
          </div>
          <div>
            <Label className="mb-1.5 block">Phone Number</Label>
            <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+265 999 000 000" />
          </div>
          <div>
            <Label className="mb-1.5 block">Country</Label>
            <Select value={form.country} onValueChange={v => setForm(f => ({ ...f, country: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block text-muted-foreground">Email Address</Label>
            <Input value={user?.email || ''} disabled className="bg-secondary text-muted-foreground" />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[hsl(var(--primary))] text-primary-foreground w-full sm:w-auto">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Account actions */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4" /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            To change your password, log out and use the "Forgot Password" flow on the login page.
          </p>
          <Button
            variant="outline"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => base44.auth.logout()}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}