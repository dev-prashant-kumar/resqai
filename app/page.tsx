"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  HeartPulse,
  Menu,
  ShieldCheck,
  Siren,
  Users,
  X,
  Zap,
} from "lucide-react";

/**
 * ============================================================
 * RESQAI HOME PAGE
 * ============================================================
 * Sections:
 * 1. Global animated background
 * 2. Sticky header and desktop navigation
 * 3. Animated mobile navigation
 * 4. Hero section
 * 5. Response-center illustration
 * 6. Platform introduction
 * 7. How it works
 * 8. Capabilities
 * 9. Final call to action
 * 10. Footer
 * 11. Animations and accessibility
 *
 * Theme:
 * - White and light blue backgrounds
 * - Navy typography
 * - Blue and sky-blue gradients
 * - Glass-effect cards
 * - Responsive animated navigation
 *
 * Routes:
 * /                  Home
 * /login             User login
 * /register          User registration
 * /login?redirect=/report  Emergency reporting login
 * /responder         Responder area (verify registration route)
 * /admin/login       Admin login
 * ============================================================
 */

/* Navigation links used by desktop and mobile menus. */
const navigationLinks = [
  { label: "Home", href: "#home" },
  { label: "Platform", href: "#platform" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Capabilities", href: "#capabilities" },
];

/* Registration choices shown in the desktop dropdown. */
const registrationLinks = [
  {
    title: "Register as a User",
    description: "Create an account to access ResQAI.",
    href: "/register",
    icon: Users,
  },
  {
    title: "Register as a Responder",
    description: "Access the responder registration area.",
    href: "/responder",
    icon: ShieldCheck,
  },
];

/* Shared visual styles for light-theme cards. */
const cardStyle =
  "rounded-3xl border border-blue-100/90 bg-white/85 shadow-[0_12px_45px_rgba(37,99,235,0.055)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_55px_rgba(37,99,235,0.10)]";

export default function HomePage() {
  /* Controls the animated mobile navigation. */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Controls the desktop registration dropdown. */
  const [registerMenuOpen, setRegisterMenuOpen] = useState(false);

  /* Closes menus after a user selects a destination. */
  const closeMenus = () => {
    setMobileMenuOpen(false);
    setRegisterMenuOpen(false);
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#F8FAFF] text-[#102344] selection:bg-blue-200 selection:text-blue-950">
      {/* ======================================================
          1. GLOBAL ANIMATED BACKGROUND
          Soft blue orbs, subtle grid, and ambient light.
      ====================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        {/* Light blue grid pattern. */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.035)_1px,transparent_1px)] bg-[size:42px_42px]" />

        {/* Large animated blue and cyan glow effects. */}
        <div className="blue-orb absolute -left-40 top-10 h-[420px] w-[420px] rounded-full bg-blue-300/25 blur-[110px]" />
        <div className="cyan-orb absolute -right-40 top-[28rem] h-[440px] w-[440px] rounded-full bg-cyan-300/25 blur-[120px]" />
        <div className="blue-orb absolute bottom-[8%] left-[30%] h-[360px] w-[360px] rounded-full bg-indigo-300/15 blur-[120px]" />
        <div className="cyan-orb absolute right-[15%] top-[12%] h-48 w-48 rounded-full bg-sky-200/30 blur-[85px]" />

        {/* Faint decorative rings. */}
        <div className="absolute -right-28 top-[20%] h-80 w-80 rounded-full border border-blue-200/40" />
        <div className="absolute -right-16 top-[22%] h-64 w-64 rounded-full border border-cyan-200/40" />
        <div className="absolute -left-20 bottom-[15%] h-64 w-64 rounded-full border border-indigo-200/30" />
      </div>

      {/* ======================================================
          2. STICKY HEADER AND DESKTOP NAVIGATION
          White glass navbar, brand, page links, admin and register.
      ====================================================== */}
      <header className="sticky top-0 z-50 border-b border-blue-100/80 bg-white/85 shadow-[0_4px_25px_rgba(37,99,235,0.035)] backdrop-blur-2xl">
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
        >
          {/* Brand and home link. */}
          <Link
            href="/"
            onClick={closeMenus}
            aria-label="ResQAI home"
            className="group flex shrink-0 items-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-br from-white to-blue-100 shadow-[0_5px_18px_rgba(37,99,235,0.12)] transition duration-300 group-hover:scale-105 group-hover:shadow-blue-200/70">
              <ShieldCheck
                size={25}
                className="text-blue-600 transition-transform duration-300 group-hover:rotate-3"
              />
            </span>

            <span className="leading-tight">
              <span className="block text-xl font-black tracking-tight text-[#102344] sm:text-2xl">
                ResQ<span className="text-blue-600">AI</span>
              </span>
              <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500 sm:block">
                Emergency Response
              </span>
            </span>
          </Link>

          {/* Desktop section navigation. */}
          <div className="hidden items-center gap-6 lg:flex xl:gap-8">
            {navigationLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative py-2 text-sm font-semibold text-slate-600 transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-blue-600 after:transition-all after:duration-300 hover:text-blue-700 hover:after:w-full"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Desktop account actions. */}
          <div className="hidden items-center gap-2 md:flex">
            {/* Admin login button. */}
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-bold text-slate-700 transition duration-300 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 lg:px-4"
            >
              <ShieldCheck size={16} className="text-blue-600" />
              <span>Admin Login</span>
            </Link>

            {/* Registration dropdown trigger. */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={registerMenuOpen}
                aria-haspopup="menu"
                onClick={() => setRegisterMenuOpen((open) => !open)}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-600/30"
              >
                Register
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${
                    registerMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Registration dropdown content. */}
              {registerMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+12px)] w-[320px] origin-top-right animate-[menuIn_180ms_ease-out] rounded-2xl border border-blue-100 bg-white/95 p-2 shadow-[0_20px_60px_rgba(30,64,175,0.16)] backdrop-blur-2xl"
                >
                  {registrationLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        role="menuitem"
                        onClick={closeMenus}
                        className="group flex items-start gap-3 rounded-xl p-3 transition duration-200 hover:bg-blue-50"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-100 text-blue-600 transition group-hover:border-blue-200 group-hover:from-blue-100 group-hover:to-sky-100">
                          <Icon size={21} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-[#102344]">
                            {item.title}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            {item.description}
                          </span>
                        </span>

                        <ChevronRight
                          size={16}
                          className="mt-1 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600"
                        />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu open/close button. */}
          <button
            type="button"
            aria-label={
              mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-700 shadow-sm transition duration-300 hover:border-blue-200 hover:bg-blue-50 md:hidden"
          >
            <span
              className={`absolute transition-all duration-300 ${
                mobileMenuOpen
                  ? "rotate-90 scale-0 opacity-0"
                  : "rotate-0 scale-100 opacity-100"
              }`}
            >
              <Menu size={23} />
            </span>

            <span
              className={`absolute transition-all duration-300 ${
                mobileMenuOpen
                  ? "rotate-0 scale-100 opacity-100"
                  : "-rotate-90 scale-0 opacity-0"
              }`}
            >
              <X size={23} />
            </span>
          </button>
        </nav>

        {/* ====================================================
            3. ANIMATED MOBILE NAVIGATION
            Staggered links and registration/account actions.
        ==================================================== */}
        <div
          id="mobile-navigation"
          aria-hidden={!mobileMenuOpen}
          inert={!mobileMenuOpen}
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out md:hidden ${
            mobileMenuOpen
              ? "grid-rows-[1fr] opacity-100"
              : "pointer-events-none grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="border-t border-blue-100 bg-white/95 px-4 pb-5 pt-3 shadow-[0_18px_35px_rgba(37,99,235,0.08)] backdrop-blur-2xl sm:px-6">
              {/* Mobile section links with staggered entrance. */}
              <div className="space-y-1">
                {navigationLinks.map((item, index) => (
                  <a
                    key={item.label}
                    href={item.href}
                    tabIndex={mobileMenuOpen ? 0 : -1}
                    onClick={closeMenus}
                    style={{ transitionDelay: `${index * 45}ms` }}
                    className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 transition duration-300 hover:bg-blue-50 hover:text-blue-700 ${
                      mobileMenuOpen
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-3 opacity-0"
                    }`}
                  >
                    {item.label}
                    <ChevronRight size={16} className="text-blue-400" />
                  </a>
                ))}
              </div>

              {/* Mobile login and registration buttons. */}
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-blue-100 pt-4 sm:grid-cols-2">
                <Link
                  href="/admin/login"
                  tabIndex={mobileMenuOpen ? 0 : -1}
                  onClick={closeMenus}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <ShieldCheck size={17} className="text-blue-600" />
                  Admin Login
                </Link>

                <Link
                  href="/register"
                  tabIndex={mobileMenuOpen ? 0 : -1}
                  onClick={closeMenus}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/15 transition hover:from-blue-700 hover:to-blue-600"
                >
                  <Users size={17} />
                  User Registration
                </Link>

                <Link
                  href="/responder"
                  tabIndex={mobileMenuOpen ? 0 : -1}
                  onClick={closeMenus}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-blue-800 transition hover:border-sky-300 hover:bg-sky-100 sm:col-span-2"
                >
                  <ShieldCheck size={17} />
                  Register as a Responder
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Emergency reporting shortcut. */}
              <Link
                href="/login?redirect=/report"
                tabIndex={mobileMenuOpen ? 0 : -1}
                onClick={closeMenus}
                className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 transition hover:border-rose-200 hover:bg-rose-100"
              >
                <Siren size={17} />
                Access Emergency Reporting
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================
          4. HERO SECTION
          Main headline, description, and primary actions.
      ====================================================== */}
      <section
        id="home"
        className="relative z-10 mx-auto grid min-h-[650px] max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-28"
      >
        {/* Hero text and actions. */}
        <div className="animate-[heroIn_700ms_ease-out_both]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-xs font-bold tracking-wide text-blue-700 shadow-sm shadow-blue-100/70 backdrop-blur sm:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
            </span>
            AI-ASSISTED EMERGENCY RESPONSE
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-[#102344] sm:text-5xl md:text-6xl xl:text-7xl">
            When every
            <span className="block">second matters,</span>
            <span className="mt-2 block bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              response matters.
            </span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
            ResQAI is designed to help people report emergencies and connect
            with an organized response workflow through a clear, accessible
            digital platform.
          </p>

          {/* Primary hero buttons. */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?redirect=/report"
              className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 font-bold text-white shadow-xl shadow-blue-600/20 transition duration-300 hover:-translate-y-1 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-600/30"
            >
              <Siren size={19} />
              Report an Emergency
              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/register"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white/90 px-6 py-4 font-bold text-blue-800 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50"
            >
              Create an Account
              <ChevronRight size={18} className="text-blue-600" />
            </Link>
          </div>

          {/* Short platform notes. */}
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={17} className="text-blue-600" />
              Clear reporting workflow
            </span>
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={17} className="text-blue-600" />
              User-focused design
            </span>
          </div>
        </div>

        {/* ====================================================
            5. HERO RESPONSE-CENTER ILLUSTRATION
            Decorative visualization; not live emergency data.
        ==================================================== */}
        <div className="relative mx-auto w-full max-w-[520px] animate-[heroIn_900ms_ease-out_120ms_both]">
          {/* Blue ambient glow behind the illustration. */}
          <div
            aria-hidden="true"
            className="absolute inset-8 rounded-full bg-blue-300/35 blur-[75px]"
          />

          {/* Main white glass card. */}
          <div className="relative overflow-hidden rounded-[30px] border border-white/90 bg-white/85 p-5 shadow-[0_25px_90px_rgba(37,99,235,0.13)] backdrop-blur-2xl sm:p-7">
            {/* Card heading. */}
            <div className="flex items-center justify-between gap-4 border-b border-blue-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-100 text-blue-600">
                  <Activity size={22} />
                </span>
                <div>
                  <p className="font-bold text-[#102344]">Response Center</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Platform overview
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 sm:text-xs">
                Platform UI
              </span>
            </div>

            {/* Abstract network illustration. */}
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-br from-[#F5F9FF] via-white to-[#ECF5FF] p-5 sm:p-6">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-60"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(59,130,246,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.09) 1px, transparent 1px)",
                  backgroundSize: "30px 30px",
                }}
              />

              <div className="relative flex min-h-[220px] items-center justify-center sm:min-h-[260px]">
                {/* Concentric network rings. */}
                <div className="absolute h-48 w-48 rounded-full border border-blue-200/80 sm:h-56 sm:w-56" />
                <div className="absolute h-36 w-36 rounded-full border border-sky-300/80 sm:h-44 sm:w-44" />
                <div className="absolute h-24 w-24 rounded-full border border-blue-300/80 sm:h-28 sm:w-28" />

                {/* Central soft glow. */}
                <div className="absolute h-32 w-32 animate-pulse rounded-full bg-blue-300/30 blur-2xl" />

                {/* Central icon. */}
                <div className="relative flex h-20 w-20 items-center justify-center rounded-[25px] border border-blue-100 bg-gradient-to-br from-white to-blue-100 shadow-[0_12px_35px_rgba(37,99,235,0.18)] sm:h-24 sm:w-24">
                  <HeartPulse size={44} className="text-blue-600 sm:h-12 sm:w-12" />
                </div>

                {/* Floating network nodes. */}
                <span className="absolute left-[12%] top-[24%] flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-100 bg-white/95 text-cyan-700 shadow-md shadow-cyan-100/70">
                  <Users size={20} />
                </span>

                <span className="absolute right-[10%] top-[28%] flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-white/95 text-blue-600 shadow-md shadow-blue-100/70">
                  <ShieldCheck size={20} />
                </span>

                <span className="absolute bottom-[10%] left-[22%] flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-white/95 text-sky-700 shadow-md shadow-sky-100/70">
                  <Zap size={20} />
                </span>

                <span className="absolute bottom-[8%] right-[20%] flex h-11 w-11 items-center justify-center rounded-xl border border-indigo-100 bg-white/95 text-indigo-600 shadow-md shadow-indigo-100/70">
                  <Siren size={20} />
                </span>
              </div>

              <p className="relative text-center text-xs leading-6 text-slate-600 sm:text-sm">
                Reporting, coordination, and response workflows in one
                platform interface.
              </p>
            </div>

            {/* Quick feature cards. */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/70 p-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <HeartPulse size={17} />
                  <span className="text-xs font-bold sm:text-sm">
                    Emergency Access
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  A clear path to emergency reporting.
                </p>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/70 p-4">
                <div className="flex items-center gap-2 text-sky-700">
                  <Users size={17} />
                  <span className="text-xs font-bold sm:text-sm">
                    Response Network
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Dedicated access for responders.
                </p>
              </div>
            </div>
          </div>

          {/* Decorative orbit accent. */}
          <div
            aria-hidden="true"
            className="absolute -right-3 top-20 -z-10 h-28 w-28 rounded-full border border-blue-200/80 sm:-right-6"
          />
        </div>
      </section>

      {/* ======================================================
          6. PLATFORM INTRODUCTION
          Introduces the main purpose and access paths.
      ====================================================== */}
      <section
        id="platform"
        className="relative z-10 border-y border-blue-100/80 bg-white/60 px-4 py-20 backdrop-blur-sm sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
              The ResQAI Platform
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#102344] sm:text-4xl md:text-5xl">
              A more organized way to{" "}
              <span className="bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                seek help.
              </span>
            </h2>

            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              The platform brings emergency reporting and dedicated access
              experiences together in one interface, helping users understand
              where to go and what to do next.
            </p>
          </div>

          {/* Three platform feature cards. */}
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            <article className={`${cardStyle} p-6 sm:p-7`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 transition group-hover:scale-110">
                <Siren size={24} />
              </span>
              <h3 className="mt-6 text-xl font-bold text-[#102344]">
                Emergency Reporting
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Give users a clear entry point to report an emergency through
                the application&apos;s reporting workflow.
              </p>
              <Link
                href="/login?redirect=/report"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:gap-3"
              >
                Access reporting <ArrowRight size={16} />
              </Link>
            </article>

            <article className={`${cardStyle} p-6 sm:p-7`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                <Users size={24} />
              </span>
              <h3 className="mt-6 text-xl font-bold text-[#102344]">
                Responder Access
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Provide a dedicated route for people and organizations
                participating in the response network.
              </p>
              <Link
                href="/responder"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:gap-3"
              >
                Responder portal <ArrowRight size={16} />
              </Link>
            </article>

            <article className={`${cardStyle} p-6 sm:p-7`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                <ShieldCheck size={24} />
              </span>
              <h3 className="mt-6 text-xl font-bold text-[#102344]">
                Secure Access
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Separate entry points help users, responders, and authorized
                administrators reach the appropriate area.
              </p>
              <Link
                href="/admin/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 transition hover:gap-3"
              >
                Admin login <ArrowRight size={16} />
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* ======================================================
          7. HOW IT WORKS
          Explains the high-level user journey.
      ====================================================== */}
      <section
        id="how-it-works"
        className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            {/* Workflow heading and CTA. */}
            <div className="lg:sticky lg:top-32">
              <span className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
                Simple by Design
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#102344] sm:text-4xl md:text-5xl">
                Clear steps.
                <span className="block bg-gradient-to-r from-blue-700 to-cyan-500 bg-clip-text text-transparent">
                  Better coordination.
                </span>
              </h2>

              <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
                Keep the user journey straightforward with accessible
                navigation and dedicated routes for each platform role.
              </p>

              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-5 py-3.5 text-sm font-bold text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                Get Started <ArrowRight size={17} />
              </Link>
            </div>

            {/* Three workflow steps. */}
            <div className="space-y-4">
              <article className={`${cardStyle} flex gap-5 p-5 sm:gap-6 sm:p-7`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
                  <Users size={22} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                    Step 01
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-[#102344] sm:text-xl">
                    Create the appropriate account
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Users can register for an account, while responders can
                    use the dedicated responder route.
                  </p>
                </div>
              </article>

              <article className={`${cardStyle} flex gap-5 p-5 sm:gap-6 sm:p-7`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-sky-700">
                  <Siren size={22} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky-700">
                    Step 02
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-[#102344] sm:text-xl">
                    Access the reporting workflow
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Registered users can navigate to emergency reporting
                    through the application&apos;s configured login flow.
                  </p>
                </div>
              </article>

              <article className={`${cardStyle} flex gap-5 p-5 sm:gap-6 sm:p-7`}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                  <Activity size={22} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                    Step 03
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-[#102344] sm:text-xl">
                    Continue through the platform
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Users and authorized personnel access the features
                    permitted by their account and role.
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          8. CAPABILITIES
          Highlights the platform's intended capabilities.
      ====================================================== */}
      <section
        id="capabilities"
        className="relative z-10 border-y border-blue-100/80 bg-white/65 px-4 py-20 backdrop-blur-sm sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
              Designed for Clarity
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#102344] sm:text-4xl">
              Essential access, without the confusion.
            </h2>
            <p className="mt-4 leading-8 text-slate-600">
              A focused interface helps people find the right destination
              quickly.
            </p>
          </div>

          {/* Capability cards. */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: HeartPulse,
                title: "Emergency Access",
                description:
                  "A prominent route to the emergency reporting workflow.",
              },
              {
                icon: ShieldCheck,
                title: "Role-Based Entry",
                description:
                  "Dedicated access points for users and administrators.",
              },
              {
                icon: Users,
                title: "Responder Path",
                description:
                  "A dedicated route for the responder experience.",
              },
              {
                icon: Zap,
                title: "Responsive Interface",
                description:
                  "Navigation designed to work across mobile and desktop.",
              },
            ].map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className={`${cardStyle} p-5`}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 text-blue-600">
                    <Icon size={23} />
                  </span>
                  <h3 className="mt-5 font-bold text-[#102344]">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================
          9. FINAL CALL TO ACTION
          Encourages user and responder registration.
      ====================================================== */}
      <section className="relative z-10 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-blue-100 bg-gradient-to-br from-white via-[#F0F6FF] to-[#E5F3FF] px-6 py-12 text-center shadow-[0_25px_90px_rgba(37,99,235,0.10)] sm:px-12 sm:py-16 lg:px-20">
          {/* Decorative CTA background. */}
          <div
            aria-hidden="true"
            className="blue-orb pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-blue-300/30 blur-[90px]"
          />
          <div
            aria-hidden="true"
            className="cyan-orb pointer-events-none absolute -bottom-36 -left-20 h-72 w-72 rounded-full bg-cyan-300/30 blur-[90px]"
          />

          <div className="relative mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
              <ShieldCheck size={15} />
              Start with ResQAI
            </span>

            <h2 className="mt-6 text-3xl font-black tracking-tight text-[#102344] sm:text-4xl md:text-5xl">
              Be ready to take the next step.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-600">
              Create an account to explore the platform, or access the
              responder area if you are joining the response network.
            </p>

            {/* CTA buttons. */}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition duration-300 hover:-translate-y-1 hover:from-blue-700 hover:to-blue-600"
              >
                Register as a User <ArrowRight size={18} />
              </Link>

              <Link
                href="/responder"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white/90 px-6 py-4 font-bold text-blue-800 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50"
              >
                <ShieldCheck size={18} />
                Responder Registration
              </Link>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              For emergencies, use the appropriate local emergency services.
              ResQAI availability and response times depend on your deployed
              services and operational coverage.
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================
          10. FOOTER
          Brand identity, quick links, and copyright.
      ====================================================== */}
      <footer className="relative z-10 border-t border-blue-100 bg-white/90 px-4 py-10 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* Footer brand. */}
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-white to-blue-100 text-blue-600">
              <ShieldCheck size={22} />
            </span>
            <span>
              <span className="block text-lg font-black text-[#102344]">
                ResQ<span className="text-blue-600">AI</span>
              </span>
              <span className="mt-1 block text-xs text-slate-500">
                Emergency Response Platform
              </span>
            </span>
          </Link>

          {/* Footer navigation links. */}
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-slate-600">
            <Link href="/login" className="transition hover:text-blue-700">
              Login
            </Link>
            <Link href="/register" className="transition hover:text-blue-700">
              Register
            </Link>
            <Link
              href="/responder"
              className="transition hover:text-blue-700"
            >
              Responders
            </Link>
            <Link
              href="/admin/login"
              className="transition hover:text-blue-700"
            >
              Admin Login
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-blue-100 pt-6">
          <p className="text-xs leading-6 text-slate-500">
            © {new Date().getFullYear()} ResQAI. Built to support clearer
            emergency reporting and response workflows.
          </p>
        </div>
      </footer>

      {/* ======================================================
          11. ANIMATIONS AND ACCESSIBILITY
          Hero entrance, animated blue orbs, dropdown animation,
          and reduced-motion preference support.
      ====================================================== */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
          scroll-padding-top: 90px;
        }

        @keyframes heroIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes menuIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes blueFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(24px, -28px, 0) scale(1.08);
          }
        }

        @keyframes cyanFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-28px, 24px, 0) scale(0.94);
          }
        }

        .blue-orb {
          animation: blueFloat 13s ease-in-out infinite;
          will-change: transform;
        }

        .cyan-orb {
          animation: cyanFloat 16s ease-in-out infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

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
