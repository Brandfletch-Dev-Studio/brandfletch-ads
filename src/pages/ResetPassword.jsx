/**
 * ResetPassword.jsx
 *
 * Handles all Supabase password-reset URL formats.
 * Since detectSessionInUrl is false in our Supabase client config,
 * we manually parse the URL hash fragment that Supabase sends.
 *
 * URL formats Supabase uses for recovery:
 *   1. Hash fragment: /reset-password#access_token=xxx&refresh_token=yyy&type=recovery  (DEFAULT)
 *   2. Query params:  /reset-password?token_hash=xxx&type=recovery                       (custom template)
 *   3. PKCE code:     /reset-password?code=xxx                                           (PKCE flow)
 */
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "sonner";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying"); // verifying | ready | error | success
  const [errorMsg, setErrorMsg] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    async function init() {
      // ── 1. Try hash fragment (Supabase DEFAULT format) ──
      // #access_token=xxx&refresh_token=yyy&type=recovery&expires_in=3600
      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (accessToken && refreshToken) {
          try {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
            setStatus("ready");
            return;
          } catch (err) {
            setErrorMsg("This password reset link has expired. Please request a new one.");
            setStatus("error");
            return;
          }
        }

        // Some Supabase setups put token_hash in the fragment instead
        const tokenHash = hashParams.get("token_hash");
        if (tokenHash) {
          try {
            const { error } = await supabase.auth.verifyOtp({
              token_hash: tokenHash,
              type: type || "recovery",
            });
            if (error) throw error;
            setStatus("ready");
            return;
          } catch (err) {
            setErrorMsg("This password reset link has expired. Please request a new one.");
            setStatus("error");
            return;
          }
        }
      }

      // ── 2. Try query params (custom email template format) ──
      const query = new URLSearchParams(window.location.search);
      const token_hash = query.get("token_hash");
      const code = query.get("code");
      const type = query.get("type") || "recovery";

      if (token_hash) {
        try {
          const { error } = await supabase.auth.verifyOtp({ token_hash, type });
          if (error) throw error;
          setStatus("ready");
          return;
        } catch (err) {
          setErrorMsg("This password reset link has expired. Please request a new one.");
          setStatus("error");
          return;
        }
      }

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setStatus("ready");
          return;
        } catch (err) {
          setErrorMsg("This password reset link has expired or is invalid.");
          setStatus("error");
          return;
        }
      }

      // ── 3. No token found anywhere ──
      setErrorMsg("No reset token found. Please use the link from your email.");
      setStatus("error");
    }

    init();
  }, []);

  // Countdown redirect after success
  useEffect(() => {
    if (status !== "success") return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          navigate("/login");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, navigate]);

  // Password strength
  const getStrength = () => {
    if (!newPassword) return { score: 0, label: "", color: "", textColor: "" };
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
    return { score, ...(levels[score - 1] || levels[0]) };
  };

  const strength = getStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (newPassword.length < 6) { setFormError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setFormError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated!");
      setStatus("success");
      await supabase.auth.signOut();
    } catch (err) {
      setFormError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Verifying ──
  if (status === "verifying") {
    return (
      <AuthLayout title="Verifying reset link" subtitle="Please wait…">
        <div className="flex flex-col items-center py-10 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#4f46e5]" />
          <p className="text-sm text-muted-foreground">Checking your reset token…</p>
        </div>
      </AuthLayout>
    );
  }

  // ── Error ──
  if (status === "error") {
    return (
      <AuthLayout
        title="Link expired or invalid"
        subtitle="We couldn't verify your reset link"
        footer={
          <Link to="/forgot-password" className="text-gray-400 hover:text-white font-medium hover:underline flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> Request a new reset link
          </Link>
        }
      >
        <div className="text-center py-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <AlertCircle className="w-9 h-9 text-red-600" />
          </div>
          <p className="text-sm text-foreground bg-red-50 p-4 rounded-lg border border-red-100 leading-relaxed">
            {errorMsg}
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

  // ── Success ──
  if (status === "success") {
    return (
      <AuthLayout title="Password updated!" subtitle="You can now log in with your new password">
        <div className="flex flex-col items-center py-10 gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-green-600" />
          </div>
          <p className="text-sm text-muted-foreground">Redirecting to login in {countdown}…</p>
          <Link to="/login" className="text-sm text-[#4f46e5] hover:text-[#4338ca] font-medium hover:underline">
            Go to login now →
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── Password form ──
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
        {formError && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password"
              autoFocus placeholder="••••••••" value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} className="pl-10 pr-10 h-11" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPassword && (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-1">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-gray-200"}`} />
                ))}
              </div>
              <span className={`text-xs font-medium ${strength.textColor}`}>{strength.label}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input id="confirmPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password"
              placeholder="••••••••" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} className="pl-10 pr-10 h-11" required />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-foreground">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && (
            <div className="flex items-center gap-1.5 text-xs">
              {newPassword === confirmPassword
                ? <><ShieldCheck className="w-3.5 h-3.5 text-green-600" /><span className="text-green-600">Passwords match</span></>
                : <span className="text-red-600">Passwords do not match</span>}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full h-11 font-semibold bg-[#4f46e5] hover:bg-[#4338ca] text-white" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating password…</> : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
}
