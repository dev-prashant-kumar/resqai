"use client";

import { useState } from "react";
import Link from "next/link";

const capabilities = [
  {
    number: "01",
    title: "AI Incident Analysis",
    description:
      "Automatically classify emergency reports and extract critical information for faster decision-making.",
    icon: "✦",
  },
  {
    number: "02",
    title: "Severity Assessment",
    description:
      "Evaluate emergency severity and prioritize critical incidents for immediate response.",
    icon: "◈",
  },
  {
    number: "03",
    title: "Smart Resource Allocation",
    description:
      "Match incidents with the most suitable available responders and resources.",
    icon: "⌁",
  },
  {
    number: "04",
    title: "Route Optimization",
    description:
      "Use location intelligence to help responders reach incidents efficiently.",
    icon: "↗",
  },
];

const steps = [
  {
    number: "01",
    title: "Report",
    text: "An emergency is reported with location and incident details.",
  },
  {
    number: "02",
    title: "Analyze",
    text: "AI classifies the incident and estimates its severity.",
  },
  {
    number: "03",
    title: "Allocate",
    text: "The system identifies and ranks suitable resources.",
  },
  {
    number: "04",
    title: "Respond",
    text: "Responders receive assignments and optimized routes.",
  },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05080d] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-1/2 top-[-300px] h-[450px] w-[450px] sm:h-[650px] sm:w-[650px] -translate-x-1/2 rounded-full bg-red-500/[0.08] blur-[100px] sm:blur-[140px]" />
        <div className="absolute right-[-100px] sm:right-[-200px] top-[35%] h-[350px] w-[350px] sm:h-[500px] sm:w-[500px] rounded-full bg-orange-500/[0.05] blur-[100px] sm:blur-[140px]" />
      </div>

      {/* Grid background */}
      <div className="pointer-events-none fixed inset-0 -z-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:32px_32px] sm:[background-size:64px_64px]" />

      {/* NAVBAR */}
      <header className="relative z-20 border-b border-white/[0.07] bg-[#05080d]/85 backdrop-blur-xl sticky top-0">
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10">
              <div className="absolute h-2 w-2 sm:h-2.5 sm:w-2.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,.8)]" />
              <div className="absolute h-6 w-6 sm:h-7 sm:w-7 rounded-full border border-red-400/20" />
            </div>

            <div>
              <div className="text-base sm:text-lg font-bold tracking-tight">
                ResQ<span className="text-red-400">AI</span>
              </div>
              <div className="text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.2em] sm:tracking-[0.25em] text-white/35">
                Emergency Intelligence
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-8 md:flex">
            <Link href="#platform" className="text-sm text-white/55 transition hover:text-white">
              Platform
            </Link>
            <Link href="#how-it-works" className="text-sm text-white/55 transition hover:text-white">
              How it works
            </Link>
            <Link href="#capabilities" className="text-sm text-white/55 transition hover:text-white">
              Capabilities
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden px-3 py-2 text-sm text-white/60 transition hover:text-white sm:block"
            >
              Sign in
            </Link>

            <Link
              href="/report"
              className="rounded-lg bg-white px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-black transition hover:bg-white/90 whitespace-nowrap shadow-lg shadow-white/10"
            >
              Report Emergency
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-white/[0.07] bg-[#070b12] px-6 py-5 space-y-4 shadow-xl">
            <Link
              href="#platform"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-white/70 hover:text-white"
            >
              Platform
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-white/70 hover:text-white"
            >
              How it works
            </Link>
            <Link
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-white/70 hover:text-white"
            >
              Capabilities
            </Link>
            <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-white/70 hover:text-white py-1"
              >
                Sign in
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="platform" className="relative z-10">
        <div className="mx-auto grid min-h-[auto] lg:min-h-[720px] max-w-7xl items-center gap-12 lg:gap-16 px-4 sm:px-6 py-12 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
          {/* Left */}
          <div className="text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/[0.07] px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-medium text-red-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              AI-POWERED EMERGENCY RESPONSE
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold leading-[1.08] sm:leading-[1.02] tracking-[-0.045em]">
              When every
              <br />
              <span className="text-white/40">second matters.</span>
              <br />
              <span className="bg-gradient-to-r from-white via-white to-red-300 bg-clip-text text-transparent">
                ResQAI responds.
              </span>
            </h1>

            <p className="mt-5 sm:mt-7 max-w-xl text-sm sm:text-base lg:text-lg leading-6 sm:leading-7 text-white/50">
              An intelligent emergency coordination platform that transforms incident reports into faster, smarter and more coordinated responses.
            </p>

            <div className="mt-8 sm:mt-9 flex flex-col sm:flex-row gap-3">
              <Link
                href="/report"
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-red-500 px-6 py-3.5 text-sm font-semibold shadow-[0_0_35px_rgba(239,68,68,.18)] transition hover:bg-red-400"
              >
                <span>🚨</span>
                Report an Emergency
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>

              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3.5 text-sm font-medium text-white/75 transition hover:bg-white/[0.07] hover:text-white"
              >
                Explore the platform
              </Link>
            </div>

            <div className="mt-10 sm:mt-12 grid grid-cols-3 gap-4 border-t border-white/[0.07] pt-6 sm:pt-7">
              <div>
                <div className="text-lg sm:text-xl font-semibold">24/7</div>
                <div className="mt-1 text-[11px] sm:text-xs text-white/35">Response readiness</div>
              </div>

              <div className="h-full w-px bg-white/10 mx-auto" />

              <div>
                <div className="text-lg sm:text-xl font-semibold">AI</div>
                <div className="mt-1 text-[11px] sm:text-xs text-white/35">Decision support</div>
              </div>

              <div className="h-full w-px bg-white/10 mx-auto hidden sm:block" />

              <div className="col-span-3 sm:col-span-1">
                <div className="text-lg sm:text-xl font-semibold">Live</div>
                <div className="mt-1 text-[11px] sm:text-xs text-white/35">Coordination</div>
              </div>
            </div>
          </div>

          {/* Right command panel */}
          <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
            <div className="absolute -inset-4 sm:-inset-8 rounded-[30px] sm:rounded-[40px] bg-red-500/[0.05] blur-2xl sm:blur-3xl" />

            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0a0f17]/90 shadow-2xl backdrop-blur-xl">
              {/* Panel top */}
              <div className="flex items-center justify-between border-b border-white/[0.07] px-4 sm:px-5 py-3.5 sm:py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-red-500/10 text-xs sm:text-sm">
                    ◉
                  </div>
                  <div>
                    <div className="text-[11px] sm:text-xs font-semibold">RESPONSE CENTER</div>
                    <div className="text-[9px] text-white/30">LIVE OPERATIONS</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[9px] sm:text-[10px] text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  ONLINE
                </div>
              </div>

              {/* Fake map */}
              <div className="relative h-[240px] sm:h-[285px] overflow-hidden bg-[#070b11]">
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(30deg,transparent_48%,rgba(255,255,255,.18)_49%,transparent_50%),linear-gradient(120deg,transparent_48%,rgba(255,255,255,.12)_49%,transparent_50%)] [background-size:60px_60px] sm:[background-size:80px_80px]" />

                <div className="absolute left-[39%] top-[42%]">
                  <div className="absolute -inset-4 animate-ping rounded-full bg-red-400/10" />
                  <div className="relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-red-300/40 bg-red-500/20 shadow-[0_0_25px_rgba(239,68,68,.4)]">
                    <div className="h-2 w-2 rounded-full bg-red-300" />
                  </div>
                </div>

                <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 sm:px-3 sm:py-2 backdrop-blur-md">
                  <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/30">Active incident</div>
                  <div className="mt-0.5 text-[11px] sm:text-xs font-medium">Critical medical emergency</div>
                </div>

                <div className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 sm:px-3 sm:py-2 backdrop-blur-md">
                  <div className="text-[8px] sm:text-[9px] text-white/30">LOCATION</div>
                  <div className="mt-0.5 text-[11px] sm:text-xs">28.6139° N · 77.2090° E</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-white/[0.07] border-t border-white/[0.07]">
                <div className="p-3.5 sm:p-5">
                  <div className="text-xl sm:text-2xl font-semibold">12</div>
                  <div className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-wider text-white/30">Active</div>
                </div>

                <div className="p-3.5 sm:p-5">
                  <div className="text-xl sm:text-2xl font-semibold text-emerald-300">28</div>
                  <div className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-wider text-white/30">Ready</div>
                </div>

                <div className="p-3.5 sm:p-5">
                  <div className="text-xl sm:text-2xl font-semibold text-red-300">04</div>
                  <div className="mt-1 text-[9px] sm:text-[10px] uppercase tracking-wider text-white/30">Critical</div>
                </div>
              </div>

              {/* Alert */}
              <div className="m-3 sm:m-4 flex items-center gap-3 rounded-xl border border-red-400/15 bg-red-500/[0.06] p-3">
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-xs sm:text-sm">
                  !
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium">Priority response required</div>
                  <div className="mt-0.5 truncate text-[10px] text-white/35">AI severity assessment: CRITICAL</div>
                </div>
                <div className="ml-auto text-[10px] text-red-300 font-mono">NOW</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="relative z-10 border-y border-white/[0.07] bg-white/[0.015]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
              Intelligence layer
            </div>

            <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-[-0.03em]">
              From emergency report
              <br />
              to coordinated response.
            </h2>

            <p className="mt-4 sm:mt-5 text-sm leading-6 sm:leading-7 text-white/40 sm:text-base">
              ResQAI combines AI-assisted analysis, location intelligence and resource optimization to support emergency response teams.
            </p>
          </div>

          <div className="mt-10 sm:mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((item) => (
              <div key={item.number} className="group bg-[#080c12] p-6 sm:p-7 transition hover:bg-[#0c121a]">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/20">{item.number}</span>
                  <span className="text-lg text-red-300/70 transition group-hover:text-red-300">
                    {item.icon}
                  </span>
                </div>

                <h3 className="mt-8 sm:mt-12 text-base font-semibold">{item.title}</h3>

                <p className="mt-2.5 sm:mt-3 text-sm leading-6 text-white/35">{item.description}</p>

                <div className="mt-6 sm:mt-7 h-px w-8 bg-red-400/40 transition-all group-hover:w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 lg:px-8">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
              Response workflow
            </div>

            <h2 className="mt-3 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-[-0.03em]">
              Every second counts.
              <br />
              Every decision matters.
            </h2>
          </div>

          <div className="mt-12 sm:mt-16 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:border-white/[0.14] hover:bg-white/[0.04]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/[0.07] text-xs font-semibold text-red-300">
                    {step.number}
                  </div>

                  <h3 className="mt-5 sm:mt-7 font-semibold">{step.title}</h3>

                  <p className="mt-2.5 sm:mt-3 text-sm leading-6 text-white/35">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-4 sm:px-6 pb-16 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-red-400/15 bg-gradient-to-br from-red-500/[0.09] via-white/[0.025] to-transparent p-6 sm:p-12 lg:p-16">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
                Ready when you are
              </div>

              <h2 className="mt-3 sm:mt-4 max-w-2xl text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-[-0.03em]">
                Build a faster path from
                <br />
                emergency to response.
              </h2>
            </div>

            <Link
              href="/report"
              className="shrink-0 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 shadow-lg"
            >
              Report an Emergency →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center gap-4 px-4 sm:px-6 py-8 sm:justify-between lg:px-8 text-center sm:text-left">
          <div className="text-sm font-semibold">
            ResQ<span className="text-red-400">AI</span>
          </div>

          <p className="text-xs text-white/40">
            Developed by{" "}
            <a
              href="https://github.com/dev-prashant-kumar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 transition hover:text-red-300"
            >
              Shant
            </a>
          </p>

          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} ResQAI
          </p>
        </div>
      </footer>
    </main>
  );
}