"use client";

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
  return (
    <main className="min-h-screen overflow-hidden bg-[#05080d] text-white">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute left-1/2 top-[-300px] h-[650px] w-[650px] -translate-x-1/2 rounded-full bg-red-500/[0.08] blur-[140px]" />
        <div className="absolute right-[-200px] top-[35%] h-[500px] w-[500px] rounded-full bg-orange-500/[0.05] blur-[140px]" />
      </div>

      {/* Grid background */}
      <div className="pointer-events-none fixed inset-0 -z-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:64px_64px]" />

      {/* NAVBAR */}
      <header className="relative z-20 border-b border-white/[0.07] bg-[#05080d]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10">
              <div className="absolute h-2.5 w-2.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,.8)]" />
              <div className="absolute h-7 w-7 rounded-full border border-red-400/20" />
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight">
                ResQ<span className="text-red-400">AI</span>
              </div>
              <div className="text-[9px] font-medium uppercase tracking-[0.25em] text-white/35">
                Emergency Intelligence
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#platform"
              className="text-sm text-white/55 transition hover:text-white"
            >
              Platform
            </Link>

            <Link
              href="#how-it-works"
              className="text-sm text-white/55 transition hover:text-white"
            >
              How it works
            </Link>

            <Link
              href="#capabilities"
              className="text-sm text-white/55 transition hover:text-white"
            >
              Capabilities
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden px-4 py-2 text-sm text-white/60 transition hover:text-white sm:block"
            >
              Sign in
            </Link>

            <Link
              href="/report"
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Report Emergency
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section id="platform" className="relative z-10">
        <div className="mx-auto grid min-h-[720px] max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-24">
          {/* Left */}
          <div className="animate-fade-up">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/[0.07] px-3.5 py-2 text-xs font-medium text-red-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              AI-POWERED EMERGENCY RESPONSE
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              When every
              <br />
              <span className="text-white/40">second matters.</span>
              <br />
              <span className="bg-gradient-to-r from-white via-white to-red-300 bg-clip-text text-transparent">
                ResQAI responds.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-white/50 sm:text-lg">
              An intelligent emergency coordination platform that transforms
              incident reports into faster, smarter and more coordinated
              responses.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/report"
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-red-500 px-6 py-3.5 text-sm font-semibold shadow-[0_0_35px_rgba(239,68,68,.18)] transition hover:bg-red-400 hover:shadow-[0_0_45px_rgba(239,68,68,.28)]"
              >
                <span>🚨</span>
                Report an Emergency
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] px-6 py-3.5 text-sm font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
              >
                Explore the platform
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 border-t border-white/[0.07] pt-7">
              <div>
                <div className="text-xl font-semibold">24/7</div>
                <div className="mt-1 text-xs text-white/35">
                  Response readiness
                </div>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div>
                <div className="text-xl font-semibold">AI</div>
                <div className="mt-1 text-xs text-white/35">
                  Decision support
                </div>
              </div>

              <div className="h-8 w-px bg-white/10" />

              <div>
                <div className="text-xl font-semibold">Live</div>
                <div className="mt-1 text-xs text-white/35">
                  Coordination
                </div>
              </div>
            </div>
          </div>

          {/* Right command panel */}
          <div className="relative animate-fade-up-delayed">
            <div className="absolute -inset-8 rounded-[40px] bg-red-500/[0.05] blur-3xl" />

            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0f17]/90 shadow-2xl backdrop-blur-xl">
              {/* Panel top */}
              <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-sm">
                    ◉
                  </div>
                  <div>
                    <div className="text-xs font-semibold">
                      RESPONSE CENTER
                    </div>
                    <div className="text-[10px] text-white/30">
                      LIVE OPERATIONS
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  SYSTEM ONLINE
                </div>
              </div>

              {/* Fake map */}
              <div className="relative h-[285px] overflow-hidden bg-[#070b11]">
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(30deg,transparent_48%,rgba(255,255,255,.18)_49%,transparent_50%),linear-gradient(120deg,transparent_48%,rgba(255,255,255,.12)_49%,transparent_50%)] [background-size:80px_80px]" />

                <div className="absolute left-[22%] top-[32%] h-40 w-40 rounded-full border border-red-400/10 bg-red-500/[0.03]">
                  <div className="absolute inset-5 rounded-full border border-red-400/10" />
                  <div className="absolute inset-10 rounded-full border border-red-400/10" />
                </div>

                <div className="absolute left-[39%] top-[42%]">
                  <div className="absolute -inset-4 animate-ping rounded-full bg-red-400/10" />
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-red-300/40 bg-red-500/20 shadow-[0_0_25px_rgba(239,68,68,.4)]">
                    <div className="h-2 w-2 rounded-full bg-red-300" />
                  </div>
                </div>

                <div className="absolute left-[18%] top-[63%] h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.7)]" />
                <div className="absolute left-[70%] top-[28%] h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.7)]" />
                <div className="absolute left-[77%] top-[66%] h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,.7)]" />

                <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
                  <div className="text-[9px] uppercase tracking-wider text-white/30">
                    Active incident
                  </div>
                  <div className="mt-1 text-xs font-medium">
                    Critical medical emergency
                  </div>
                </div>

                <div className="absolute right-4 top-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
                  <div className="text-[9px] text-white/30">LOCATION</div>
                  <div className="mt-1 text-xs">28.6139° N · 77.2090° E</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 divide-x divide-white/[0.07] border-t border-white/[0.07]">
                <div className="p-5">
                  <div className="text-2xl font-semibold">12</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                    Active incidents
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-2xl font-semibold text-emerald-300">
                    28
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                    Resources ready
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-2xl font-semibold text-red-300">04</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                    Critical
                  </div>
                </div>
              </div>

              {/* Alert */}
              <div className="m-4 flex items-center gap-3 rounded-xl border border-red-400/15 bg-red-500/[0.06] p-3.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-sm">
                  !
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium">
                    Priority response required
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-white/35">
                    AI severity assessment: CRITICAL
                  </div>
                </div>
                <div className="ml-auto text-[10px] text-red-300">
                  NOW
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section
        id="capabilities"
        className="relative z-10 border-y border-white/[0.07] bg-white/[0.015]"
      >
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
              Intelligence layer
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              From emergency report
              <br />
              to coordinated response.
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/40 sm:text-base">
              ResQAI combines AI-assisted analysis, location intelligence and
              resource optimization to support emergency response teams.
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((item) => (
              <div
                key={item.number}
                className="group bg-[#080c12] p-7 transition hover:bg-[#0c121a]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/20">{item.number}</span>
                  <span className="text-lg text-red-300/70 transition group-hover:text-red-300">
                    {item.icon}
                  </span>
                </div>

                <h3 className="mt-12 text-base font-semibold">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/35">
                  {item.description}
                </p>

                <div className="mt-7 h-px w-8 bg-red-400/40 transition-all group-hover:w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
              Response workflow
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
              Every second counts.
              <br />
              Every decision matters.
            </h2>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                {index < steps.length - 1 && (
                  <div className="absolute left-[calc(100%+12px)] top-7 hidden h-px w-6 bg-gradient-to-r from-red-400/30 to-transparent md:block" />
                )}

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-white/[0.14] hover:bg-white/[0.04]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/[0.07] text-xs font-semibold text-red-300">
                    {step.number}
                  </div>

                  <h3 className="mt-7 font-semibold">{step.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-white/35">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-red-400/15 bg-gradient-to-br from-red-500/[0.09] via-white/[0.025] to-transparent p-8 sm:p-12 lg:p-16">
          <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-red-300">
                Ready when you are
              </div>

              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                Build a faster path from
                <br />
                emergency to response.
              </h2>
            </div>

            <Link
              href="/report"
              className="shrink-0 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              Report an Emergency →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/[0.07]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="text-sm font-semibold">
            ResQ<span className="text-red-400">AI</span>
          </div>

          <p className="text-xs text-white/25">
            AI-powered emergency response & resource coordination.
          </p>

          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} ResQAI
          </p>
        </div>
      </footer>
    </main>
  );
}