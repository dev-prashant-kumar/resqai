"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

type UserRole = "CITIZEN" | "RESPONDER" | "OPERATOR" | "ADMIN";

const roleRoutes: Record<UserRole, string> = {
  CITIZEN: "/dashboard",
  RESPONDER: "/responder",
  OPERATOR: "/operator",
  ADMIN: "/admin",
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function redirectByRole(role: string) {
    router.refresh();

    switch (role) {
      case "RESPONDER":
        console.log("7. REDIRECTING TO RESPONDER");
        router.replace("/responder");
        break;
      case "OPERATOR":
        console.log("7. REDIRECTING TO OPERATOR");
        router.replace("/operator");
        break;
      case "ADMIN":
        console.log("7. REDIRECTING TO ADMIN");
        router.replace("/admin");
        break;
      case "CITIZEN":
        console.log("7. REDIRECTING TO CITIZEN");
        router.replace("/dashboard");
        break;
      default:
        console.error("UNKNOWN ROLE:", role);
        setError(`Unknown role: ${role}`);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (authError || !authData.user) {
        toast.error("Unable to sign in. Check your email and password.");
        return;
      }

      // Read the user's role from the database.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        await supabase.auth.signOut();

        toast.error(
          "Your account profile could not be loaded. Please contact support."
        );

        return;
      }

      const role = profile.role as UserRole;
      const destination = roleRoutes[role];

      if (!destination) {
        await supabase.auth.signOut();
        toast.error("Your account has an invalid role.");
        return;
      }

      toast.success("Welcome back!");

      router.replace(destination);
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-8 sm:px-6">
      {/* Animated blue background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-pulse rounded-full bg-blue-300/30 blur-3xl sm:h-96 sm:w-96"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 animate-pulse rounded-full bg-sky-300/30 blur-3xl sm:h-96 sm:w-96"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl shadow-blue-900/10 backdrop-blur-xl md:grid-cols-2">
        {/* Branding panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 p-10 text-white md:flex">
          <div
            aria-hidden="true"
            className="absolute -right-20 top-20 h-64 w-64 rounded-full border border-white/20"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full border border-white/20"
          />

          <Link href="/" className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <HeartPulse size={28} />
            </span>

            <span>
              <span className="block text-2xl font-bold tracking-tight">
                ResQAI
              </span>
              <span className="text-xs text-blue-100">
                Intelligent Emergency Response
              </span>
            </span>
          </Link>

          <div className="relative py-12">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <Activity size={34} />
            </div>

            <h1 className="text-4xl font-bold leading-tight">
              Help when
              <br />
              every second
              <br />
              matters.
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-blue-100">
              Connect with emergency support, report incidents, and help your
              community respond when it matters most.
            </p>
          </div>

          <div className="relative flex items-center gap-2 text-sm text-blue-100">
            <ShieldCheck size={18} />
            Your safety matters to us.
          </div>
        </section>

        {/* Login form */}
        <section className="px-5 py-8 sm:px-10 sm:py-12">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 md:hidden"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <HeartPulse size={23} />
            </span>

            <span className="text-xl font-bold text-slate-900">ResQAI</span>
          </Link>

          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <LockKeyhole size={24} />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Sign in to your ResQAI account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
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
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
              {loading ? "Signing in..." : "Sign in"}

              {!loading && <ArrowRight size={19} />}
            </button>
          </form>

          <div className="my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">NEW TO RESQAI?</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Link
            href="/register"
            className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Create an account
          </Link>

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            By signing in, you agree to use ResQAI responsibly during emergency
            situations.
          </p>
        </section>
      </div>
    </main>
  );
}
