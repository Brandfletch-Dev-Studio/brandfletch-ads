import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44, supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

/**
 * ResetPassword — handles Supabase password recovery.
 *
 * Two entry paths:
 *  A) AuthCallback already verified the OTP token_hash and established
 *     a session, then navigated here. We just need the new password.
 *  B) The Supabase email link landed directly here with ?token_hash=XXX
 *     &type=recovery — we verify the OTP ourselves, then show the form.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenHash = searchParams.get("token_hash");
  const tokenType = searchParams.get("type") || "recovery";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(!!tokenHash);
  const [hasSession, setHasSession] = useState(false);

  // ── Path B: verify the OTP token ourselves ──────────────────────
  useEffect(() => {
    if (!tokenHash) {
      // No token_hash — check if we already have a session (Path A)
      supabase.auth.getSession().then(({ data: { session } }) => {
        setHasSession(!!session);
      });
      return;
    }

    (async () => {
      setVerifying(true);
      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: tokenType,
        });
        if (error) throw error;
        setHasSession(true);
      } catch (err) {
        setError(err.message || "This reset link is invalid or has expired.");
      } finally {
        setVerifying(false);
      }
    })();
  }, [tokenHash, tokenType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // updateUser works because the recovery session was established
      // either by AuthCallback (Path A) or our verifyOtp above (Path B)
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Sign out so the user logs in fresh with the new password
      await supabase.auth.signOut();
      window.location.href = "/login?reset=success";
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state while verifying the OTP token ──────────────────
  if (verifying) {
    return (
      <AuthLayout
        icon={Loader2}
        title="Verifying reset link"
        subtitle="Please wait..."
      >
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying your password reset link…</p>
        </div>
      </AuthLayout>
    );
  }

  // ── Error state: no token and no session ──────────────────────────
  if (!hasSession && error) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Reset your password"
        subtitle="This link is missing or has expired"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          {error}
        </p>
      </AuthLayout>
    );
  }

  if (!hasSession) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Reset your password"
        subtitle="This link is missing or has expired"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          The link you used appears to be incomplete or has expired. Please request a new password reset email.
        </p>
      </AuthLayout>
    );
  }

  // ── Success state: session active, show the password form ────────
  return (
    <AuthLayout
      icon={Lock}
      title="Create a new password"
      subtitle="Choose a strong password to secure your account"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Resetting...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
