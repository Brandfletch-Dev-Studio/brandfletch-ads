/**
 * ResetPassword.jsx
 *
 * Handles two Supabase password-reset URL formats:
 *
 * 1. PKCE flow (newer) — Supabase sends:
 *    /reset-password?token_hash=<hash>&type=recovery
 *    We call verifyOtp({ token_hash, type: 'recovery' }) to establish a session,
 *    then updateUser({ password }).
 *
 * 2. Legacy implicit flow — Supabase puts tokens in the URL *hash*:
 *    /reset-password#access_token=...&refresh_token=...&type=recovery
 *    We call setSession({ access_token, refresh_token }) then updateUser({ password }).
 *
 * The error in the screenshot ("Reset token is missing from the URL") happens
 * because the email link uses the hash-based flow and the code was only
 * looking at query params.
 */
import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "sonner";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // PKCE (query param) tokens
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") || "recovery";

  const [verifying, setVerifying]           = useState(true);
  const [verificationError, setVerificationError] = useState("");
  const [newPassword, setNewPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError]                   = useState("");
  const [loading, setLoading]               = useState(false);
  const [success, setSuccess]               = useState(false);

  useEffect(() => {
    async function verifyToken() {
      // ── 1. Try PKCE flow (token_hash in query string) ──────────────────
      if (token_hash) {
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash,
            type: "recovery",
          });
          if (verifyError) throw verifyError;
          setVerifying(false);
          return;
        } catch (err) {
          setVerificationError(
            err.message || "Invalid or expired reset link. Please request a new one."
          );
          setVerifying(false);
          return;
        }
      }

      // ── 2. Try legacy hash flow (tokens in URL fragment) ───────────────
      // window.location.hash looks like:
      // #access_token=xxx&refresh_token=yyy&type=recovery
      const hash = window.location.hash.slice(1); // strip leading #
      if (hash) {
        const params = new URLSearchParams(hash);
        const access_token  = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const hashType      = params.get("type");

        if (access_token && (hashType === "recovery" || !hashType)) {
          try {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token: refresh_token || "",
            });
            if (sessionError) throw sessionError;
            // Clean the hash so it's not visible
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
            setVerifying(false);
            return;
          } catch (err) {
            setVerificationError(
              err.message || "Your reset link has expired. Please request a new one."
            );
            setVerifying(false);
            return;
          }
        }
      }

      // ── 3. Supabase sometimes fires an onAuthStateChange SIGNED_IN event
      //       before the component mounts. Check if there's already a session. ──
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setVerifying(false);
        return;
      }

      // Nothing worked
      setVerificationError(
        "Reset link not found. Please use the link from your email, or request a new one."
      );
      setVerifying(false);
    }

    verifyToken();
  }, [token_hash]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setSuccess(true);
      toast.success("Password updated successfully!");

      await supabase.auth.signOut();
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (verifying) {
    return (
      <AuthLayout
        title="Verifying reset link"
        subtitle="Please wait while we verify your credentials"
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#4f46e5]" />
          <p className="text-sm text-muted-foreground">Checking reset token…</p>
        </div>
      </AuthLayout>
    );
  }

  // ── Verification error ────────────────────────────────────────────────────
  if (verificationError) {
    return (
      <AuthLayout
        title="Link expired or invalid"
        subtitle="We couldn't verify your reset link"
        footer={
          <Link
            to="/forgot-password"
            className="text-gray-400 hover:text-white font-medium hover:underline"
          >
            Request a new reset link
          </Link>
        }
      >
        <div className="text-center py-4 space-y-4">
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
            {verificationError}
          </p>
          <Link to="/login" className="text-sm text-muted-foreground hover:underline block">
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <AuthLayout
        title="Password updated!"
        subtitle="You can now log in with your new password"
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <p className="text-sm text-muted-foreground">Redirecting to login…</p>
        </div>
      </AuthLayout>
    );
  }

  // ── Password form ─────────────────────────────────────────────────────────
  return (
    <AuthLayout
      title="Create new password"
      subtitle="Choose a secure password with at least 6 characters"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
            {error}
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-11"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-11"
              required
            />
          </div>
        </div>
        <Button
          type="submit"
          className="w-full h-11 font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating password…
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
