import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Capture referral code from URL ?ref=BF-XXXXXX
  const referralCode = new URLSearchParams(window.location.search).get('ref') || '';

  useEffect(() => {
    base44.auth.isAuthenticated().then((authed) => {
      if (authed) window.location.href = "/onboarding";
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      // If user signed up via a referral link, record it
      if (referralCode) {
        try {
          const me = await base44.auth.me();
          // Store the referral code on the new user's profile
          await base44.auth.updateMe({ referred_by: referralCode });
          // Create a Referral record for the referrer to track
          await base44.entities.Referral.create({
            referral_code: referralCode,
            referred_email: email,
            referred_name: me?.full_name || '',
            referred_user_id: me?.id || '',
            status: 'pending',
          });
        } catch (err) {
          // Non-blocking — don't prevent onboarding if referral tracking fails
          console.warn('Referral tracking failed:', err);
        }
      }
      window.location.href = "/onboarding";
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await base44.auth.resendOtp(email);
    } catch {}
  };

  if (showOtp) {
    return (
      <AuthLayout title="Verify your email" subtitle={`We sent a 6-digit code to ${email}`}>
        {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="flex justify-center mb-6">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-11 font-semibold bg-[hsl(var(--primary))] text-primary-foreground" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : "Verify & Continue"}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-[hsl(var(--accent))] font-medium hover:underline">Resend</button>
        </p>
      </AuthLayout>
    );
  }

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
      {/* OAuth */}
      <div className="space-y-3 mb-6">
        <Button variant="outline" className="w-full h-11 text-sm font-medium gap-2.5"
          onClick={() => base44.auth.loginWithProvider("google", "/onboarding")}>
          <GoogleIcon className="w-4 h-4" /> Continue with Google
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or register with email</span>
        </div>
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" autoFocus placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="Min. 8 characters"
              value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="confirm" type="password" autoComplete="new-password" placeholder="••••••••"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 h-11" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-11 font-semibold bg-[hsl(var(--primary))] text-primary-foreground" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create account"}
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center mt-4">
        By creating an account you agree to our{" "}
        <a href="#" className="underline">Terms of Service</a> and{" "}
        <a href="#" className="underline">Privacy Policy</a>.
      </p>
    </AuthLayout>
  );
}