
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  UserRound,
  Mail,
  LockKeyhole,
  KeyRound,
  LoaderCircle,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Activity,
  ArrowRight,
} from "lucide-react";

export default function StaffRegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/staff/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          registration_code: registrationCode,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Registration failed.");
      }

      setNotice(result.message);
      setPassword("");
      setRegistrationCode("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to register staff.",
      );
    } finally {
      setLoading(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-slate-200/90 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-800 outline-none transition-all duration-300 placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-white to-blue-100/70 px-4 py-10 text-slate-800 selection:bg-blue-200 sm:px-6">
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.10),transparent_55%)]" />

        <div className="absolute -left-32 -top-32 h-80 w-80 animate-[float_12s_ease-in-out_infinite] rounded-full bg-blue-300/15 blur-[100px]" />

        <div className="absolute -right-28 top-1/4 h-96 w-96 animate-[float_15s_ease-in-out_infinite] rounded-full bg-blue-400/15 blur-[110px]" />

        <div className="absolute -bottom-36 left-1/4 h-96 w-96 animate-[float_18s_ease-in-out_infinite] rounded-full bg-sky-300/15 blur-[110px]" />

        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(59,130,246,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(59,130,246,0.025)_1px,transparent_1px)] bg-[size:42px_42px]" />

        {/* Floating blue particles */}
        <div className="absolute left-[12%] top-[18%] h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.25)]" />

        <div className="absolute right-[15%] top-[25%] h-2 w-2 animate-pulse rounded-full bg-blue-400/40" />

        <div className="absolute bottom-[18%] right-[22%] h-2.5 w-2.5 animate-pulse rounded-full bg-blue-400/50" />

        <div className="absolute bottom-[35%] left-[8%] h-2 w-2 animate-pulse rounded-full bg-sky-400/40" />
      </div>

      {/* Wider registration card */}
      <section className="group/card relative z-10 w-full max-w-xl animate-[fadeUp_0.8s_ease-out_both]">
        {/* Animated gradient border */}
        <div className="absolute -inset-[2px] rounded-[28px] bg-gradient-to-br from-blue-300 via-sky-200 to-blue-400 opacity-45 blur-[1px] transition-all duration-500 group-hover/card:opacity-80 group-hover/card:blur-[3px]" />

        <div className="relative overflow-hidden rounded-[26px] border border-white/90 bg-white/[0.96] p-6 shadow-[0_20px_65px_-30px_rgba(37,99,235,0.20)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_25px_75px_-25px_rgba(37,99,235,0.28)] sm:p-9 md:p-10">
          {/* Top accent */}
          <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500" />

          {/* Soft decorative shine */}
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-blue-100/40 blur-3xl transition-transform duration-700 group-hover/card:scale-125" />

          {/* Back link */}
          <Link
            href="/admin/login"
            className="group/back relative mb-7 inline-flex items-center gap-2 rounded-lg text-sm font-medium text-slate-500 transition-colors duration-300 hover:text-blue-600"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover/back:-translate-x-1" />
            Back to staff login
          </Link>

          {/* Header */}
          <div className="relative mb-7 flex items-center gap-4 sm:gap-5">
            <div className="group/icon relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100/80 bg-gradient-to-br from-white to-blue-50 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-200/40 sm:h-16 sm:w-16">
              <ShieldCheck className="h-7 w-7 text-blue-600 transition-transform duration-500 group-hover/icon:scale-110 group-hover/icon:rotate-3 sm:h-8 sm:w-8" />
              <Sparkles className="absolute -right-1 -top-1 h-4 w-4 animate-pulse text-sky-500" />
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                  Staff Registration
                </h1>
              </div>
              <p className="text-sm text-slate-500 sm:text-base">
                Create your ResQAI staff account
              </p>
            </div>
          </div>

          {/* Security status */}
          <div className="mb-7 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3.5">
            <Activity className="h-4 w-4 shrink-0 text-blue-600" />
            <p className="text-xs font-medium text-blue-800 sm:text-sm">
              Secure staff onboarding
            </p>

            <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Protected
            </span>
          </div>

          {/* Error message */}
          {error && (
            <div
              role="alert"
              className="mb-5 animate-[fadeUp_0.3s_ease-out] rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {/* Success message */}
          {notice && (
            <div
              role="status"
              className="mb-6 animate-[fadeUp_0.3s_ease-out] rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
            >
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                Registration successful
              </div>

              <p>{notice}</p>

              <p className="mt-2 text-emerald-700/80">
                After confirming your email, return to the staff login page.
              </p>

              <Link
                href="/admin/login"
                className="mt-4 inline-flex items-center gap-2 font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
              >
                Continue to login
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {/* Registration form */}
          <form onSubmit={handleSubmit} className="relative space-y-5">
            {/* Full name */}
            <div className="group/field">
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold text-slate-700 transition-colors group-focus-within/field:text-blue-700"
              >
                Full name
              </label>

              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within/field:text-blue-600" />

                <input
                  id="fullName"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={100}
                  required
                  className={fieldClass}
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="group/field">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700 transition-colors group-focus-within/field:text-blue-700"
              >
                Work email
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within/field:text-blue-600" />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                  required
                  className={fieldClass}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="group/field">
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700 transition-colors group-focus-within/field:text-blue-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within/field:text-blue-600" />

                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={10}
                  maxLength={72}
                  required
                  className={fieldClass}
                  placeholder="At least 10 characters"
                />
              </div>

              <p className="mt-1.5 text-xs text-slate-400">
                Use at least 10 characters.
              </p>
            </div>

            {/* Registration code */}
            <div className="group/field">
              <label
                htmlFor="registrationCode"
                className="mb-2 block text-sm font-semibold text-slate-700 transition-colors group-focus-within/field:text-blue-700"
              >
                Staff registration code
              </label>

              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400 transition-colors duration-300 group-focus-within/field:text-blue-600" />

                <input
                  id="registrationCode"
                  type="password"
                  autoComplete="off"
                  value={registrationCode}
                  onChange={(e) => setRegistrationCode(e.target.value)}
                  required
                  className={fieldClass}
                  placeholder="Enter your private code"
                />
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Ask the ResQAI administrator for this code. New accounts
                receive operator permissions.
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="group/button relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/button:translate-x-full" />

              {loading ? (
                <>
                  <LoaderCircle className="relative h-4 w-4 animate-spin" />
                  <span className="relative">Creating account...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="relative h-4 w-4 transition-transform duration-300 group-hover/button:scale-110" />
                  <span className="relative">Register as staff</span>
                  <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover/button:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <p className="text-center text-sm text-slate-500">
              Already registered?{" "}
              <Link
                href="/admin/login"
                className="font-bold text-blue-600 transition-colors duration-300 hover:text-indigo-600 hover:underline hover:underline-offset-4"
              >
                Staff login
              </Link>
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>ResQAI · Secure staff access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }

          50% {
            transform: translate3d(18px, -22px, 0);
          }
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translate3d(0, 18px, 0);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
