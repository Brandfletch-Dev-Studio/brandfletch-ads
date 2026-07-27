import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

/**
 * ResetPassword — handles Supabase password recovery.
 *
 * Three entry paths:
 *  A) AuthCallback already verified the OTP token_hash and established
 *     a session, then navigated here. We just need the new password.
 *  B) The Supabase email link landed directly here with ?token_hash=XXX
 *     &type=recovery (PKCE flow) — we verify the OTP ourselves.
 *  C) The Supabase email link landed here with #access_token=XXX
 *     &type=recovery (implicit flow) — we set the session from the hash.
 *
 * Since detectSessionInUrl is disabled in our Supabase client, we must
 * handle the hash fragment manually (Path C).
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [success, setSuccess] = useState(false);

  // ── Verify the reset link on mount ─────────────────────────────
  useEffect(() => {
    let mounted = true;

    const verifyAndSetup = async () => {
      // Path A: Check if we already have a session (e.g., AuthCallback verified)
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        if (mounted) {
          setHasSession(true);
          setVerifying(false);
        }
        return;
      }

      // Path C: Check hash fragment for implicit flow tokens
      // Supabase may send: #access_token=...&refresh_token=...&type=recovery
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      if (accessToken && hashType === "recovery") {
        try {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || "",
          });
          if (sessionError) throw sessionError;
          if (data.session && mounted) {
            setHasSession(true);
          }
        } catch (err) {
          if (mounted) setError(err?.message || "Failed to verify reset link.");
        } finally {
          if (mounted) setVerifying(false);
        }
        return;
      }

      // Path B: Check query params for PKCE flow tokens
      // Supabase may send: ?token_hash=...&type=recovery
      const tokenHash = searchParams.get("token_hash");
      const tokenType = searchParams.get("type") || "recovery";

      if (tokenHash) {
        try {
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: tokenType,
          });
          if (verifyError) throw verifyError;
          if (data.session && mounted) {
            setHasSession(true);
          }
        } catch (err) {
          if (mounted) setError(err?.message || "This reset link is invalid or has expired.");
        } finally {
          if (mounted) setVerifying(false);
        }
        return;
      }

      // No token found and no existing session — link is invalid/expired
      if (mounted) {
        setVerifying(false);
        setError("This link is missing or has expired. Please request a new password reset email.");
      }
    };

    verifyAndSetup();

    return () => { mounted = false; };
  }, [searchParams]);

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
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      // Sign out the recovery session
      await supabase.auth.signOut();

      setSuccess(true);
      // Redirect to login after showing success message
      setTimeout(() => {
        window.location.href = "/login?reset=success";
      }, 2500);
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

  // ── Success state: password was updated ──────────────────────────
  if (success) {
    return (
      <AuthLayout
        icon={CheckCircle2}
        title="Password updated!"
        subtitle="Redirecting you to login..."
      >
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <p className="text-sm text-muted-foreground">Your password has been updated successfully.</p>
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </AuthLayout>
    );
  }

  // ── Error state: no token and no session ──────────────────────────
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
        {error && (
          <p className="text-sm text-foreground text-center mb-4">{error}</p>
        )}
        <p className="text-sm text-muted-foreground text-center">
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
              minLength={6}
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
              minLength={6}
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
