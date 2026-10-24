"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  Siren,
  Users,
  Activity,
  MapPin,
  HeartPulse,
  Radio,
  UserPlus,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-12 text-slate-900 sm:px-6">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Soft blue glow */}
        <div className="blue-orb absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-300/30 blur-[100px]" />

        <div className="blue-orb blue-orb-delay absolute -right-32 top-[15%] h-[420px] w-[420px] rounded-full bg-sky-300/25 blur-[110px]" />

        <div className="blue-orb blue-orb-slow absolute -bottom-40 left-[30%] h-[450px] w-[450px] rounded-full bg-indigo-300/20 blur-[120px]" />

        {/* Subtle cyan accent */}
        <div className="blue-orb blue-orb-delay absolute bottom-[10%] -right-20 h-72 w-72 rounded-full bg-cyan-200/30 blur-[100px]" />

        {/* Fine grid */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#2563eb 1px, transparent 1px), linear-gradient(90deg, #2563eb 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        {/* White overlay keeps the page clean */}
        <div className="absolute inset-0 bg-white/35" />
      </div>

      <style jsx>{`
        .blue-orb {
          animation: float 12s ease-in-out infinite alternate;
          will-change: transform;
        }

        .blue-orb-delay {
          animation-delay: -4s;
          animation-duration: 15s;
        }

        .blue-orb-slow {
          animation-duration: 18s;
        }

        @keyframes float {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(35px, -25px, 0) scale(1.08);
          }
          100% {
            transform: translate3d(-20px, 30px, 0) scale(0.96);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .blue-orb {
            animation: none;
          }
        }
      `}</style>

      <div className="relative z-10 mx-auto w-full max-w-5xl">
        {/* Brand */}
        <header className="mb-12 text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mx-auto mb-5 flex items-center gap-3"
            aria-label="Go to ResQAI homepage"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-100 shadow-lg shadow-blue-100">
              <ShieldCheck className="h-7 w-7 text-blue-600" />
            </div>

            <span className="text-3xl font-black tracking-tight text-slate-900">
              ResQ<span className="text-blue-600">AI</span>
            </span>
          </button>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 shadow-sm shadow-blue-100/50">
            <Activity className="h-4 w-4" />
            Emergency Response Platform
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Join the ResQAI Network
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Whether you need emergency assistance or want to help save lives,
            choose the account that best describes you.
          </p>
        </header>

        {/* Staff Registration */}
        <div className="mb-7 flex justify-center">
          <button
            type="button"
            onClick={() => router.push("/admin/register")}
            className="group inline-flex max-w-full items-center gap-3 rounded-2xl border border-indigo-200 bg-white/90 px-4 py-3.5 text-left shadow-lg shadow-indigo-100/60 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100 sm:px-7"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 text-indigo-700 transition duration-300 group-hover:scale-105">
              <UserPlus className="h-5 w-5" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900 sm:text-base">
                Staff Registration
              </span>

              <span className="mt-0.5 block text-xs leading-5 text-slate-500">
                Authorized emergency operations staff
              </span>
            </span>

            <span className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition duration-300 group-hover:bg-indigo-600 group-hover:text-white">
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>

        {/* Account options */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Citizen */}
          <button
            type="button"
            onClick={() => router.push("/register/citizen")}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/85 p-6 text-left shadow-xl shadow-slate-200/50 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-100 sm:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-100/70 blur-3xl transition duration-500 group-hover:bg-blue-200/70" />

            <div className="relative">
              <div className="mb-7 flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm transition duration-300 group-hover:scale-105">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>

                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  CITIZEN
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Citizen Account
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Report emergencies, share your location, and stay informed
                about incidents that affect you and your community.
              </p>

              <div className="my-7 space-y-4">
                <Feature icon={Siren} text="Report an emergency" />
                <Feature icon={MapPin} text="Share incident location" />
                <Feature icon={HeartPulse} text="Receive emergency updates" />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <span className="font-semibold text-blue-700">
                  Create citizen account
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition duration-300 group-hover:bg-blue-600 group-hover:text-white">
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </button>

          {/* Responder */}
          <button
            type="button"
            onClick={() => router.push("/register/responder")}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/85 p-6 text-left shadow-xl shadow-slate-200/50 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-100 sm:p-8"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-100/70 blur-3xl transition duration-500 group-hover:bg-cyan-200/70" />

            <div className="relative">
              <div className="mb-7 flex items-center justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-sm transition duration-300 group-hover:scale-105">
                  <Siren className="h-8 w-8 text-cyan-700" />
                </div>

                <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800">
                  RESPONDER
                </span>
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                Responder Application
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                Apply to join the emergency response network as a trained
                professional, medical responder, rescue worker, or approved
                volunteer.
              </p>

              <div className="my-7 space-y-4">
                <Feature icon={ShieldCheck} text="Submit your qualifications" />
                <Feature icon={Radio} text="Apply to join response teams" />
                <Feature icon={Users} text="Await administrative approval" />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                <span className="font-semibold text-cyan-800">
                  Apply as responder
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 transition duration-300 group-hover:bg-cyan-600 group-hover:text-white">
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </button>
        </section>

        {/* Login and footer */}
        <footer className="mt-9 text-center">
          <p className="text-sm text-slate-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="font-semibold text-blue-700 transition hover:text-blue-900"
            >
              Sign in
            </button>
          </p>

          <p className="mt-6 text-xs leading-6 text-slate-500">
            Responder applications are subject to verification and approval.
            <br />
            Your account type does not determine emergency priority.
          </p>
        </footer>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  text,
}: {
  icon: React.ElementType;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
        <Icon className="h-4 w-4 text-blue-600" />
      </span>

      <span>{text}</span>
    </div>
  );
}