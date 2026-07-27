/**
 * ResetPassword.jsx — Redesigned
 *
 * Handles the password reset flow from Supabase recovery emails.
 * Supports both token_hash and code URL formats for maximum compatibility.
 *
 * URL formats handled:
 *   /reset-password?token_hash=<hash>&type=recovery  (newer Supabase API)
 *   /reset-password?code=<code>&type=recovery          (older Supabase API)
 *   /reset-password?type=recovery&next=/dashboard      (with redirect target)
 */
import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "sonner";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token_hash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const type = searchParams.get("type") || "recovery";

  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Verify the reset token on mount
  useEffect(() => {
    async function verify() {
      // Need either token_hash or code to proceed
      if (!token_hash && !code) {
        setVerificationError("No reset token found. Please use the link from your email.");
        setVerifying(false);
        return;
      }

      try {
        let result;
        if (token_hash) {
          // Newer Supabase API — token_hash + type
          result = await supabase.auth.verifyOtp({ token_hash, type });
        } else {
          // Older Supabase API — PKCE code flow
          result = await supabase.auth.exchangeCodeForSession(code);
        }

        if (result.error) throw result.error;
        setVerifying(false);
      } catch (err) {
        console.error("[ResetPassword] Token verification failed:", err);
        let msg = err.message || "This reset link has expired or is invalid.";

        // Map common Supabase errors to user-friendly messages
        if (msg.includes("expired") || msg.includes("invalid") || msg.includes("Token not found")) {
          msg = "This password reset link has expired. Reset links are valid for 1 hour. Please request a new one.";
        }

        setVerificationError(msg);
        setVerifying(false);
      }
    }
    verify();
  }, [token_hash, code, type]);

  // Countdown redirect after success
  useEffect(() => {
    if (!success) return;
    const interval = setInterval(() => {
      setRedirectCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate("/login");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [success, navigate]);

  // Password strength check
  const getPasswordStrength = () => {
    if (!newPassword) return { score: 0, label: "", color: "" };
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 10) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    const levels = [
      { label: "Very weak", color: "bg-red-500", textColor: "text-red-600" },
      { label: "Weak", color: "bg-orange-500", textColor: "text-orange-600" },
      { label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-600" },
      { label: "Good", color: "bg-blue-500", textColor: "text-blue-600" },
      { label: "Strong", color: "bg-green-500", textColor: "text-green-600" },
    ];
    return { score, ...levels[score - 1] || levels[0] };
  };

  const strength = getPasswordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
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

      // Sign out the recovery session
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[ResetPassword] Password update failed:", err);
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──
  if (verifying) {
    return (
      <AuthLayout title="Verifying reset link" subtitle="Please wait…">
        <div className="flex flex-col items-center py-10 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#4f46e5]" />
          <p className="text-sm text-muted-foreground">Checking your reset token…</p>
        </div>
      </AuthLayout>
    );
  }

  // ── Error state ──
  if (verificationError) {
    return (
      <AuthLayout
        title="Link expired or invalid"
        subtitle="We couldn't verify your reset link"
        footer={
          <Link
            to="/forgot-password"
            className="text-gray-400 hover:text-white font-medium hover:underline flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4" /> Request a new reset link
          </Link>
        }
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-9 h-9 text-red-600" />
          </div>
          <p className="text-sm text-foreground bg-red-50 p-4 rounded-lg border border-red-100 leading-relaxed">
            {verificationError}
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center w-full h-11 font-semibold rounded-md bg-[#4f46e5] hover:bg-[#4338ca] text-white transition-colors"
          >
            Request a new reset link
          </Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Success state ──
  if (success) {
    return (
      <AuthLayout title="Password updated!" subtitle="You can now log in with your new password">
        <div className="flex flex-col items-center py-10 gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            Redirecting to login in {redirectCountdown}…
          </p>
          <Link
            to="/login"
            className="text-sm text-[#4f46e5] hover:text-[#4338ca] font-medium hover:underline"
          >
            Go to login now →
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Password reset form ──
  return (
    <AuthLayout
      title="Create new password"
      subtitle="Choose a secure password with at least 6 characters"
      footer={
        <Link to="/login" className="text-gray-400 hover:text-white font-medium hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 pr-10 h-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength bar */}
          {newPassword && (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strength.score ? strength.color : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className={`text-xs font-medium ${strength.textColor || "text-muted-foreground"}`}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 pr-10 h-11"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground transition-colors"
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password match indicator */}
          {confirmPassword && (
            <div className="flex items-center gap-1.5 text-xs">
              {newPassword === confirmPassword ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-green-600">Passwords match</span>
                </>
              ) : (
                <span className="text-red-600">Passwords do not match</span>
              )}
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white transition-colors"
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
