/**
 * ResetPassword.jsx
 *
 * Supabase sends the reset link as:
 *   /reset-password?token_hash=<hash>&type=recovery
 *
 * We verify the token with verifyOtp(), then let the user set a new password.
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

  const token_hash = searchParams.get("token_hash");

  const [verifying, setVerifying]               = useState(true);
  const [verificationError, setVerificationError] = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [error, setError]                       = useState("");
  const [loading, setLoading]                   = useState(false);
  const [success, setSuccess]                   = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token_hash) {
        setVerificationError("No reset token found. Please use the link from your email.");
        setVerifying(false);
        return;
      }
      try {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: "recovery" });
        if (error) throw error;
        setVerifying(false);
      } catch (err) {
        setVerificationError(
          err.message || "This reset link has expired. Please request a new one."
        );
        setVerifying(false);
      }
    }
    verify();
  }, [token_hash]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess(true);
      toast.success("Password updated!");
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <AuthLayout title="Verifying reset link" subtitle="Please wait…">
        <div className="flex flex-col items-center py-8 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4f46e5]" />
          <p className="text-sm text-muted-foreground">Checking your reset token…</p>
        </div>
      </AuthLayout>
    );
  }

  if (verificationError) {
    return (
      <AuthLayout
        title="Link expired or invalid"
        subtitle="We couldn't verify your reset link"
        footer={
          <Link to="/forgot-password" className="text-gray-400 hover:text-white font-medium hover:underline">
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

  if (success) {
    return (
      <AuthLayout title="Password updated!" subtitle="You can now log in with your new password">
        <div className="flex flex-col items-center py-8 gap-3">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
          <p className="text-sm text-muted-foreground">Redirecting to login…</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create new password" subtitle="Choose a secure password with at least 6 characters">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">{error}</div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input id="password" type="password" autoComplete="new-password" placeholder="••••••••"
              value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pl-10 h-11" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••"
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-10 h-11" required />
          </div>
        </div>
        <Button type="submit" className="w-full h-11 font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating…</> : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
