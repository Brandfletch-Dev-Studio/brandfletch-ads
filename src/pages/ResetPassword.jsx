import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "sonner";

/**
 * Reset Password — handles the Supabase recovery flow.
 *
 * Supabase can redirect back with either:
 *   - token_hash + type=recovery  (implicit / older flow)
 *   - code + type=recovery         (PKCE flow, current Supabase default)
 *
 * With detectSessionInUrl:true on the Supabase client, the PKCE code is
 * auto-exchanged and a session is established before this component mounts.
 * So we also check for an existing session as a valid entry state.
 */
export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = searchParams.get("type") || "recovery";

  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verify = async () => {
      // Case 1: PKCE flow — code is in the URL. The Supabase client with
      // detectSessionInUrl:true may have already exchanged it, but if not
      // (or if the component mounts before that completes), we exchange
      // it explicitly here.
      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          setVerifying(false);
          return;
        } catch (err) {
          // The code might have already been consumed by detectSessionInUrl.
          // Check if we have a valid session anyway.
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setVerifying(false);
            return;
          }
          setVerificationError(
            err.message || "Invalid or expired reset link. Please request a new password reset."
          );
          setVerifying(false);
          return;
        }
      }

      // Case 2: Implicit flow — token_hash is in the URL
      if (tokenHash) {
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type,
          });
          if (verifyError) throw verifyError;
          setVerifying(false);
          return;
        } catch (err) {
          setVerificationError(
            err.message || "Invalid or expired reset token. Please request a new password reset link."
          );
          setVerifying(false);
          return;
        }
      }

      // Case 3: No token in URL — check if detectSessionInUrl already
      // established a session (this happens when Supabase processes the
      // redirect before React mounts and strips the params)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setVerifying(false);
          return;
        }
      } catch (_) {
        // ignore
      }

      // Case 4: No token, no session — nothing we can do
      setVerificationError("Reset token is missing. Please request a new password reset link.");
      setVerifying(false);
    };

    verify();
  }, [tokenHash, code, type]);

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
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      toast.success("Password reset successfully. Please log in with your new password.");

      // Sign out to clean up the recovery session
      await supabase.auth.signOut();

      navigate("/login");
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthLayout
        title="Verifying reset link"
        subtitle="Please wait while we verify your secure credentials"
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#4f46e5]" />
          <p className="text-sm text-gray-500">Checking reset token...</p>
        </div>
      </AuthLayout>
    );
  }

  if (verificationError) {
    return (
      <AuthLayout
        title="Verification failed"
        subtitle="We couldn't verify your reset link"
        footer={
          <Link to="/forgot-password" className="text-gray-400 hover:text-white font-medium hover:underline">
            Request a new reset link
          </Link>
        }
      >
        <div className="text-center py-4">
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 mb-6">
            {verificationError}
          </p>
          <Link to="/login" className="text-sm text-gray-500 hover:underline">
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

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
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
