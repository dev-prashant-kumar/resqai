"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function CitizenRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (cleanPhone && !/^\+?[0-9\s()-]{7,20}$/.test(cleanPhone)) {
      toast.error("Please enter a valid phone number.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must contain at least 8 characters.");
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      toast.error("Use at least one letter and one number in your password.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone || null,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (!data.user) {
        toast.error("We couldn't complete your registration. Please try again.");
        return;
      }

      setSuccess(true);

      if (data.session) {
        toast.success("Your citizen account has been created!");

        window.setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 1200);
      } else {
        toast.success("Registration submitted successfully.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12">
        <Background />

        <section className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white/90 p-8 text-center shadow-2xl shadow-blue-100/70 backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-100 bg-emerald-50">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-900">
            Registration Successful
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            {`Your registration for ${email.trim().toLowerCase()} has been submitted.`}
          </p>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left">
            <div className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

              <p className="text-sm leading-6 text-blue-900">
                If email confirmation is required, check your inbox and follow
                the verification link before signing in.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
          >
            Continue to sign in
            <ArrowRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-4 text-sm font-medium text-slate-500 transition hover:text-blue-700"
          >
            Return to homepage
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10 text-slate-900 sm:px-6">
      <Background />

      <div className="relative z-10 mx-auto w-full max-w-xl">
        <Link
          href="/register"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to account selection
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-2xl shadow-blue-100/60 backdrop-blur-xl">
          {/* Header */}
          <header className="border-b border-slate-100 px-6 py-7 sm:px-9 sm:py-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50">
                <ShieldCheck className="h-7 w-7 text-blue-600" />
              </div>

              <div>
                <div className="mb-1 flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                    Citizen registration
                  </span>
                </div>

                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Create your account
                </h1>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Join ResQAI to report emergencies and receive important
              incident updates.
            </p>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-7 sm:px-9 sm:py-8">
            <InputField
              id="fullName"
              label="Full name"
              placeholder="Enter your full name"
              icon={<UserRound className="h-5 w-5" />}
              value={fullName}
              onChange={setFullName}
              autoComplete="name"
              required
            />

            <InputField
              id="email"
              label="Email address"
              placeholder="you@example.com"
              icon={<Mail className="h-5 w-5" />}
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
              required
            />

            <InputField
              id="phone"
              label="Phone number"
              placeholder="Enter your phone number"
              icon={<Phone className="h-5 w-5" />}
              value={phone}
              onChange={setPhone}
              type="tel"
              autoComplete="tel"
            />

            <PasswordField
              id="password"
              label="Password"
              placeholder="At least 8 characters"
              value={password}
              onChange={setPassword}
              show={showPassword}
              toggle={() => setShowPassword((value) => !value)}
              autoComplete="new-password"
            />

            <PasswordField
              id="confirmPassword"
              label="Confirm password"
              placeholder="Enter your password again"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              toggle={() =>
                setShowConfirmPassword((value) => !value)
              }
              autoComplete="new-password"
            />

            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

                <p className="text-xs leading-6 text-slate-600">
                  Your password is handled by Supabase Authentication.
                  Never share your password or verification link with anyone.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create citizen account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-sm text-slate-600">
              Already registered?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-700 hover:text-blue-900"
              >
                Sign in
              </Link>
            </p>
          </form>
        </section>

        <p className="mt-6 text-center text-xs leading-6 text-slate-500">
          ResQAI helps connect communities with emergency response services.
          <br />
          In an immediate emergency, contact your local emergency services.
        </p>
      </div>
    </main>
  );
}

function Background() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="citizen-orb absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-300/30 blur-[110px]" />

        <div className="citizen-orb citizen-orb-delay absolute -right-32 top-[20%] h-[420px] w-[420px] rounded-full bg-sky-300/25 blur-[120px]" />

        <div className="citizen-orb citizen-orb-slow absolute -bottom-40 left-[25%] h-[420px] w-[420px] rounded-full bg-indigo-300/20 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <style jsx>{`
        .citizen-orb {
          animation: citizenFloat 14s ease-in-out infinite alternate;
          will-change: transform;
        }

        .citizen-orb-delay {
          animation-delay: -5s;
          animation-duration: 17s;
        }

        .citizen-orb-slow {
          animation-duration: 20s;
        }

        @keyframes citizenFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(30px, -25px, 0) scale(1.07);
          }
          100% {
            transform: translate3d(-20px, 25px, 0) scale(0.97);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .citizen-orb {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}

function InputField({
  id,
  label,
  placeholder,
  icon,
  value,
  onChange,
  type = "text",
  autoComplete,
  required = false,
}: {
  id: string;
  label: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-blue-600">*</span>}
      </label>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
        <span className="shrink-0 text-slate-400">{icon}</span>

        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  placeholder,
  value,
  onChange,
  show,
  toggle,
  autoComplete,
}: {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  toggle: () => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        {label}
        <span className="ml-1 text-blue-600">*</span>
      </label>

      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
        <LockKeyhole className="h-5 w-5 shrink-0 text-slate-400" />

        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />

        <button
          type="button"
          onClick={toggle}
          className="shrink-0 rounded-lg p-1 text-slate-400 transition hover:text-blue-700"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
    </div>
  );
}