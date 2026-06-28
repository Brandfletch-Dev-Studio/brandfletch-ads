import { base44 } from '@/api/base44Client';
import { Lock, LogOut, KeyRound, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SecurityTab({ user }) {
  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" /> Account Security
          </CardTitle>
          <CardDescription>Manage your password and active sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Password */}
          <div className="flex items-center justify-between p-4 rounded-xl border bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-background border flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">Last changed: unknown</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/forgot-password'}
            >
              Reset Password
            </Button>
          </div>

          <Separator />

          {/* Account info */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Details</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-secondary/30 border">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{user?.email || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border">
                <p className="text-xs text-muted-foreground">Account Role</p>
                <p className="text-sm font-medium capitalize">{user?.role?.replace('_', ' ') || 'Client'}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border">
                <p className="text-xs text-muted-foreground">Member Since</p>
                <p className="text-sm font-medium">
                  {user?.created_date ? new Date(user.created_date).toLocaleDateString('en-GB', { year: 'numeric', month: 'long' }) : '—'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border">
                <p className="text-xs text-muted-foreground">Account ID</p>
                <p className="text-sm font-mono text-muted-foreground truncate">{user?.id?.slice(0, 16) || '—'}…</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="shadow-sm border-destructive/20">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2 font-semibold text-destructive">
            <Lock className="w-4 h-4" /> Session & Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl border bg-secondary/30">
            <div>
              <p className="text-sm font-medium">Sign Out</p>
              <p className="text-xs text-muted-foreground">End your current session on this device.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/5"
              onClick={() => base44.auth.logout()}
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Need to delete your account? <a href="mailto:support@brandfletch.com" className="text-[hsl(var(--accent))] hover:underline">Contact our support team</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}