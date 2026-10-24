"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      toast.error("Enter your staff email and password.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Step 1: Authenticate with Supabase.
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        // Log individual properties so useful details aren't hidden as {}.
        console.error("Supabase sign-in failed:", {
          message: error.message || "No error message provided",
          code: error.code || "unknown",
          status: error.status ?? "unknown",
          name: error.name || "AuthError",
        });

        if (
          error.code === "email_not_confirmed" ||
          error.message.toLowerCase().includes("email not confirmed")
        ) {
          toast.error(
            "Please confirm your email address before signing in.",
          );
        } else if (
          error.code === "invalid_credentials" ||
          error.message.toLowerCase().includes("invalid login credentials")
        ) {
          toast.error("Incorrect email or password.");
        } else {
          toast.error(
            error.message || "Unable to sign in. Please try again.",
          );
        }

        return;
      }

      if (!data.user) {
        console.error(
          "Supabase sign-in returned no authenticated user.",
        );

        toast.error(
          "Sign-in failed. No authenticated user was returned.",
        );
        return;
      }

      // Step 2: Verify the authenticated user's staff profile.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Staff profile lookup failed:", {
          message: profileError.message || "No error message provided",
          code: profileError.code || "unknown",
          details: profileError.details || null,
          hint: profileError.hint || null,
        });

        await supabase.auth.signOut();

        toast.error(
          "Unable to verify your staff profile. Please try again.",
        );
        return;
      }

      if (!profile) {
        await supabase.auth.signOut();

        toast.error(
          "Your account has no ResQAI profile. Contact the system administrator.",
        );
        return;
      }

      // Step 3: Only authorized staff roles may access the dashboard.
      const normalizedRole =
        typeof profile.role === "string"
          ? profile.role.trim().toUpperCase()
          : "";

      if (
        normalizedRole !== "ADMIN" &&
        normalizedRole !== "OPERATOR"
      ) {
        await supabase.auth.signOut();

        toast.error(
          "Access denied. An authorized ResQAI staff account is required.",
        );
        return;
      }

      // Step 4: Navigate to the staff dashboard.
      const displayName =
        typeof profile.full_name === "string"
          ? profile.full_name.trim()
          : "";

      toast.success(
        displayName ? `Welcome, ${displayName}!` : "Welcome back!",
      );

      router.replace("/admin");
      router.refresh();
    } catch (error) {
      // Handle unexpected errors without assuming the value is an Error.
      const details =
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
            }
          : {
              message: String(error),
            };

      console.error("Unexpected administrator login error:", details);

      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-300/25 blur-3xl"
      />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-blue-100 bg-white/90 shadow-2xl shadow-blue-900/10 backdrop-blur-xl md:grid-cols-2">
        {/* Left branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-10 text-white md:flex">
          <div
            aria-hidden="true"
            className="absolute -right-24 top-16 h-72 w-72 rounded-full border border-white/10"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full border border-white/10"
          />

          <Link href="/" className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <HeartPulse size={27} />
            </span>

            <span>
              <span className="block text-2xl font-bold tracking-tight">
                ResQAI
              </span>
              <span className="text-xs text-blue-200">
                Emergency Intelligence
              </span>
            </span>
          </Link>

          <div className="relative py-12">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
              <Activity size={32} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">
              Staff portal
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-tight">
              Coordinate
              <br />
              responses.
              <br />
              Protect lives.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100/80">
              Access the ResQAI operations dashboard to review responder
              organization applications and support emergency coordination.
            </p>
          </div>

          <div className="relative flex items-center gap-2 text-sm text-blue-100">
            <ShieldCheck size={18} />
            Restricted to authorized staff
          </div>
        </section>

        {/* Login form */}
        <section className="px-5 py-9 sm:px-10 sm:py-12">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 md:hidden"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <HeartPulse size={23} />
            </span>
            <span className="text-xl font-bold text-slate-900">
              ResQAI
            </span>
          </Link>

          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <ShieldCheck size={24} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Authorized personnel
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Staff sign in
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in with your existing ResQAI staff account to access the
              administration dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Work email
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="staff@example.com"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verifying account..." : "Access staff dashboard"}
              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">SECURE ACCESS</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-start gap-3">
              <LockKeyhole
                size={18}
                className="mt-0.5 shrink-0 text-blue-600"
              />

              <p className="text-xs leading-5 text-slate-600">
                Staff access is controlled by your account role. A regular
                citizen or responder account cannot enter this dashboard.
                Contact your system administrator if you need staff access.
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="mt-6 flex items-center justify-center text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            Back to regular sign in
          </Link>
        </section>
      </div>
    </main>
  );
}
