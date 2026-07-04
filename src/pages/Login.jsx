import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff, Info } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function Login() {
  const navigate  = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [notice, setNotice]     = useState(""); // non-error informational banner

  useEffect(() => {
    // Pre-fill email if redirected from register page (existing account detected)
    const params   = new URLSearchParams(window.location.search);
    const prefill  = params.get('email');
    const reason   = params.get('reason');
    const redirect = params.get('redirect');

    if (prefill)  setEmail(decodeURIComponent(prefill));
    // Persist the intended destination so handleSubmit can use it
    if (redirect) sessionStorage.setItem('bf_post_login_redirect', decodeURIComponent(redirect));

    if (reason === 'existing') {
      setNotice("An account with that email already exists. Enter your password to log in.");
    }
    if (reason === 'no_account') {
      setNotice("No account found for that email. Create one below for free.");
    }

    // If already logged in redirect away
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        localStorage.setItem('bf_visited', '1');
        const postLogin = sessionStorage.getItem('bf_post_login_redirect');
        sessionStorage.removeItem('bf_post_login_redirect');
        window.location.href = postLogin || "/dashboard";
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        const msg = signInError.message?.toLowerCase() || '';

        // "Invalid login credentials" is Supabase's generic error for:
        //   a) wrong password, OR b) email not found
        // We attempt to distinguish them to give the right redirect.
        if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid_credentials')) {
          // Try to figure out if the user simply doesn't have an account
          // by attempting a dummy signUp — if identities[] is empty → exists → wrong password
          // if identities[] has an entry → new user → redirect to register
          const { data: probeData } = await supabase.auth.signUp({
            email,
            password: crypto.randomUUID(), // throwaway password
            options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
          });

          // identities empty → account exists → wrong password
          if (probeData?.user?.identities?.length === 0) {
            throw new Error("Incorrect password. Please try again, or use 'Forgot password' to reset it.");
          } else {
            // identities has entry → no account exists → redirect to register
            // Clean up the ghost signup attempt immediately
            navigate(`/register?email=${encodeURIComponent(email)}&reason=no_account`, { replace: true });
            return;
          }
        }

        if (msg.includes('email not confirmed')) {
          throw new Error("Please verify your email first — check your inbox for the verification link.");
        }

        throw signInError;
      }

      localStorage.setItem('bf_visited', '1');
      const postLogin = sessionStorage.getItem('bf_post_login_redirect');
      sessionStorage.removeItem('bf_post_login_redirect');
      window.location.href = postLogin || "/dashboard";

    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      hideBrand
      title="Welcome back"
      subtitle="Log in to continue growing your business with Brandfletch Media"
      footer={
        <>
          New here?{" "}
          <Link
            to={(() => {
              const r = new URLSearchParams(window.location.search).get('redirect');
              return r ? `/register?redirect=${encodeURIComponent(r)}` : '/register';
            })()}
            className="text-[hsl(var(--accent))] font-semibold hover:underline"
          >
            Create a free account
          </Link>
        </>
      }
    >
      {/* Informational notice (non-error, e.g. redirected from register) */}
      {notice && !error && (
        <div className="mb-4 p-3 rounded-lg bg-primary/8 border border-primary/20 text-sm flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span className="text-foreground">{notice}</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email" type="email" autoComplete="email"
              autoFocus={!email} // only autofocus if email isn't prefilled
              placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11" required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-[hsl(var(--accent))] hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password" type={showPass ? "text" : "password"}
              autoComplete="current-password" placeholder="••••••••"
              autoFocus={!!email} // autofocus password if email was prefilled
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-11" required
            />
            <button
              type="button" tabIndex={-1}
              onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 font-semibold bg-[hsl(var(--primary))] text-primary-foreground"
          disabled={loading}
        >
          {loading
            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging in…</>
            : "Log in"
          }
        </Button>
      </form>
    </AuthLayout>
  );
}
