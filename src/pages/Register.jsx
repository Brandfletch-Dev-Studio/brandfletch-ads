import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44, supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const [resent, setResent]                 = useState(false);
  const [showPass, setShowPass]             = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);

  const referralCode = new URLSearchParams(window.location.search).get('ref') || '';

  // Pre-fill email if redirected from login page; preserve post-login redirect.
  // Also supports referral links carrying a ?service= param (e.g.
  // /register?ref=CODE&service=meta_ads) — these should auto-land the new
  // user on the matching order/contact page instead of the bare dashboard,
  // same mechanism as an explicit ?redirect= param.
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const prefill  = params.get('email');
    const redirect = params.get('redirect');
    const service  = params.get('service');
    const plan     = params.get('plan');
    if (prefill) setEmail(decodeURIComponent(prefill));
    if (redirect) {
      sessionStorage.setItem('bf_post_login_redirect', decodeURIComponent(redirect));
    } else if (service) {
      const orderParams = new URLSearchParams({ service });
      if (plan) orderParams.set('plan', plan);
      sessionStorage.setItem('bf_post_login_redirect', `/contact?${orderParams.toString()}`);
    }
  }, []);

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      const postLogin = sessionStorage.getItem('bf_post_login_redirect');
      if (authed) {
        sessionStorage.removeItem('bf_post_login_redirect');
        navigate(postLogin || '/dashboard', { replace: true });
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 8)          { setError("Password must be at least 8 characters"); return; }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: email.split('@')[0],
            role: 'user',
            referred_by: referralCode || null,
          },
        },
      });

      if (signUpError) throw signUpError;

      // ── KEY FIX: Supabase returns a fake success for existing accounts.
      // Detect this: identities array will be empty when the email already exists.
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        // Email is already registered — redirect to login with prefilled email
        { const _r = sessionStorage.getItem('bf_post_login_redirect');
        const _p = new URLSearchParams({ email, reason: 'existing' });
        if (_r) _p.set('redirect', _r);
        navigate(`/login?${_p.toString()}`, { replace: true }); }
        return;
      }

      setShowCheckEmail(true);
    } catch (err) {
      // Supabase occasionally does throw for existing accounts in some configs
      const msg = err.message?.toLowerCase() || '';
      if (
        msg.includes('user already registered') ||
        msg.includes('already registered') ||
        msg.includes('email already') ||
        msg.includes('already been registered')
      ) {
        { const _r = sessionStorage.getItem('bf_post_login_redirect');
        const _p = new URLSearchParams({ email, reason: 'existing' });
        if (_r) _p.set('redirect', _r);
        navigate(`/login?${_p.toString()}`, { replace: true }); }
        return;
      }
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResent(false);
    try {
      await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch {}
  };

  // ── Check-your-email screen ──────────────────────────────────────────────
  if (showCheckEmail) {
    return (
      <AuthLayout title="Check your email" subtitle={`We sent a verification link to ${email}`}>
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and get started.
            </p>
            <p className="text-xs text-muted-foreground">Can't find it? Check your spam folder.</p>
          </div>
          {resent && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" /> Email resent!
            </div>
          )}
          <Button variant="outline" className="w-full" onClick={handleResend}>
            Resend verification email
          </Button>
          <p className="text-sm text-muted-foreground">
            Wrong email?{" "}
            <button onClick={() => setShowCheckEmail(false)} className="text-primary font-medium hover:underline">
              Go back
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  // ── Registration form ────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Start advertising your business"
      subtitle="Reach more customers with professionally managed Facebook & Instagram campaigns"
      hideBrand={true}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="text-[hsl(var(--accent))] font-semibold hover:underline">Log in</Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email" type="email" autoComplete="email" autoFocus
              placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11" required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password" type={showPass ? "text" : "password"}
              autoComplete="new-password" placeholder="Min. 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11" required
            />
            <button type="button" tabIndex={-1}
              onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="confirm" type={showConfirm ? "text" : "password"}
              autoComplete="new-password" placeholder="••••••••"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10 h-11" required
            />
            <button type="button" tabIndex={-1}
              onClick={() => setShowConfirm(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold bg-[hsl(var(--primary))] text-primary-foreground"
          disabled={loading}
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</> : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
