
"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Activity,
  Bell,
  CheckCircle2,
  Clock3,
  Crosshair,
  FileCheck2,
  FileClock,
  FileWarning,
  LocateFixed,
  LogOut,
  MapPin,
  Menu,
  Navigation,
  Radio,
  RefreshCw,
  ShieldCheck,
  Siren,
  User,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type VerificationApplication = {
  id: string;
  application_status: string;
  organization_name: string | null;
  organization_type: string | null;
  organization_email: string | null;
  organization_phone: string | null;
  organization_city: string | null;
  organization_state: string | null;
  verification_contact_name: string | null;
  submitted_at: string | null;
  updated_at: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
};

type Organization = {
  id: string;
  verification_status: string | null;
};

type VerificationResponse = {
  success: boolean;
  message?: string;
  organization: Organization | null;
  application: VerificationApplication | null;
};

type VerificationTone = "green" | "blue" | "amber" | "red";

type VerificationState = {
  title: string;
  description: string;
  badge: string;
  tone: VerificationTone;
  action: string;
};

const activeIncident = {
  id: "INC-2048",
  type: "Medical Emergency",
  title: "Multiple injuries reported",
  location: "Civil Lines, Near Railway Crossing",
  distance: "2.4 km",
  eta: "7 min",
  severity: "CRITICAL",
  people: 4,
  reported: "3 min ago",
};

const navigationItems = [
  { id: "overview", label: "Overview", icon: ShieldCheck },
  { id: "assignment", label: "My Incidents", icon: AlertTriangle },
  { id: "live-status", label: "Navigation", icon: Navigation },
  { id: "quick-actions", label: "Communication", icon: Radio },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function formatStatus(value?: string | null) {
  if (!value) return "Unknown";

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getVerificationState(
  data: VerificationResponse | null,
): VerificationState {
  if (!data?.organization) {
    return {
      title: "Organization Not Linked",
      description:
        "No responder organization is linked to your account. Complete responder registration or contact an administrator.",
      badge: "NOT LINKED",
      tone: "amber",
      action: "Open Verification",
    };
  }

  const organizationStatus = (
    data.organization.verification_status ?? ""
  ).toUpperCase();

  const applicationStatus = (
    data.application?.application_status ?? ""
  ).toUpperCase();

  if (
    applicationStatus === "REJECTED" ||
    organizationStatus === "REJECTED"
  ) {
    return {
      title: "Verification Rejected",
      description:
        data.application?.rejection_reason ||
        data.application?.review_notes ||
        "Your application was rejected. Review the available feedback or contact an administrator for next steps.",
      badge: "REJECTED",
      tone: "red",
      action: "Review Application",
    };
  }

  if (
    organizationStatus === "VERIFIED" ||
    applicationStatus === "VERIFIED"
  ) {
    return {
      title: "Organization Verified",
      description:
        "Your organization has been verified. Keep your organization details up to date.",
      badge: "VERIFIED",
      tone: "green",
      action: "View Verification",
    };
  }

  if (
    applicationStatus === "APPROVED" ||
    organizationStatus === "APPROVED"
  ) {
    return {
      title: "Approval Recorded",
      description:
        "Approval is recorded, but verification is not yet confirmed. Contact an administrator if this persists.",
      badge: "APPROVED",
      tone: "amber",
      action: "View Verification",
    };
  }

  if (
    applicationStatus === "PENDING" ||
    organizationStatus === "PENDING" ||
    organizationStatus === "UNDER_REVIEW" ||
    applicationStatus === "UNDER_REVIEW"
  ) {
    return {
      title: "Verification Under Review",
      description:
        "Your application has been submitted and is awaiting review. You can check your submitted details and status.",
      badge: "PENDING REVIEW",
      tone: "blue",
      action: "View Application",
    };
  }

  return {
    title: "Verification Not Submitted",
    description:
      "Submit your organization's official details and required documents to begin the verification process.",
    badge: "NOT SUBMITTED",
    tone: "amber",
    action: "Verify Organization",
  };
}

const toneStyles: Record<
  VerificationTone,
  {
    badge: string;
    icon: string;
    panel: string;
    button: string;
    dot: string;
  }
> = {
  green: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "bg-emerald-100 text-emerald-700",
    panel: "border-emerald-100 from-emerald-50/80 to-white",
    button: "bg-emerald-600 hover:bg-emerald-700",
    dot: "bg-emerald-500",
  },
  blue: {
    badge: "border-blue-200 bg-blue-50 text-blue-700",
    icon: "bg-blue-100 text-blue-700",
    panel: "border-blue-100 from-blue-50/80 to-white",
    button: "bg-blue-600 hover:bg-blue-700",
    dot: "bg-blue-500",
  },
  amber: {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    icon: "bg-amber-100 text-amber-700",
    panel: "border-amber-100 from-amber-50/80 to-white",
    button: "bg-blue-600 hover:bg-blue-700",
    dot: "bg-amber-500",
  },
  red: {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    icon: "bg-rose-100 text-rose-700",
    panel: "border-rose-100 from-rose-50/80 to-white",
    button: "bg-rose-600 hover:bg-rose-700",
    dot: "bg-rose-500",
  },
};

export default function ResponderDashboard() {
  const [status, setStatus] = useState("AVAILABLE");
  const [assignmentStatus, setAssignmentStatus] = useState("EN_ROUTE");
  const [activeNav, setActiveNav] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const [verification, setVerification] =
    useState<VerificationResponse | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [verificationError, setVerificationError] = useState("");

  const assignmentSteps = [
    "ASSIGNED",
    "EN_ROUTE",
    "ARRIVED",
    "COMPLETED",
  ];
  const currentStep = assignmentSteps.indexOf(assignmentStatus);

  const loadVerification = useCallback(async () => {
    setVerificationLoading(true);
    setVerificationError("");

    try {
      const response = await fetch("/api/responder/verification", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const result =
        (await response.json()) as VerificationResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load your verification status.",
        );
      }

      setVerification(result);
    } catch (error) {
      setVerificationError(
        error instanceof Error
          ? error.message
          : "Unable to load verification status.",
      );
    } finally {
      setVerificationLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchVerification() {
      try {
        const response = await fetch("/api/responder/verification", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        const result =
          (await response.json()) as VerificationResponse;

        if (cancelled) return;

        if (!response.ok || !result.success) {
          setVerificationError(
            result.message || "Unable to load verification status.",
          );
          return;
        }

        setVerification(result);
        setVerificationError("");
      } catch {
        if (!cancelled) {
          setVerificationError(
            "Unable to connect to the verification service. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setVerificationLoading(false);
        }
      }
    }

    void fetchVerification();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigate = (id: string) => {
    setActiveNav(id);
    setMobileMenuOpen(false);

    if (id === "notifications") {
      setNotice("There are no live notifications connected yet.");
      return;
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const openVerification = () => {
    window.location.assign("/responder/verification");
  };

  const updateAssignment = () => {
    const nextStep = Math.min(
      currentStep + 1,
      assignmentSteps.length - 1,
    );

    setAssignmentStatus(assignmentSteps[nextStep]);

    if (nextStep === assignmentSteps.length - 1) {
      setNotice("Demo assignment marked as completed.");
    } else if (assignmentSteps[nextStep] === "ARRIVED") {
      setNotice("Arrival marked in demo mode.");
    } else {
      setNotice(
        `Demo assignment status updated to ${assignmentSteps[nextStep]}.`,
      );
    }
  };

  const openNavigation = () => {
    const destination = encodeURIComponent(activeIncident.location);

    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const quickAction = (title: string) => {
    const messages: Record<string, string> = {
      "Team Radio":
        "Team communication is not connected to a live radio backend yet.",
      "Share Location":
        "Live location sharing requires browser permission and backend integration.",
      "Request Backup":
        "Backup requests are not connected to the incident API yet.",
    };

    setNotice(messages[title] ?? `${title} selected.`);
  };

  const verificationState = getVerificationState(verification);
  const verificationTone = toneStyles[verificationState.tone];

  return (
    <main
      id="overview"
      className="relative min-h-screen overflow-x-clip bg-[#f6f9ff] text-slate-800"
    >
      <style>{`
        @keyframes responderFloat {
          0%, 100% { transform: translate3d(0, 0, 0); }
          50% { transform: translate3d(0, -16px, 0); }
        }

        @keyframes responderPulse {
          0%, 100% { opacity: .45; transform: scale(.96); }
          50% { opacity: 1; transform: scale(1.04); }
        }

        @keyframes responderBorder {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .responder-float {
          animation: responderFloat 10s ease-in-out infinite;
        }

        .responder-pulse {
          animation: responderPulse 2s ease-in-out infinite;
        }

        .responder-card {
          position: relative;
          isolation: isolate;
          transition: transform .25s ease, box-shadow .25s ease;
        }

        .responder-card::before {
          content: "";
          position: absolute;
          inset: -1px;
          z-index: -1;
          border-radius: inherit;
          background: linear-gradient(120deg, #bfdbfe, #60a5fa, #c4b5fd, #93c5fd);
          background-size: 250% 250%;
          opacity: 0;
          transition: opacity .25s ease;
          animation: responderBorder 5s ease infinite;
        }

        .responder-card:hover::before {
          opacity: 1;
        }

        .responder-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 45px -28px rgba(37, 99, 235, .4);
        }

        .responder-card-inner {
          height: 100%;
          border-radius: inherit;
          background: rgba(255,255,255,.96);
        }

        @media (prefers-reduced-motion: reduce) {
          .responder-float, .responder-pulse, .responder-card::before {
            animation: none !important;
          }
          .responder-card {
            transition: none !important;
          }
        }
      `}</style>

      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
        <div className="responder-float absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-300/30 blur-[100px]" />
        <div
          className="responder-float absolute -right-32 top-[28%] h-[28rem] w-[28rem] rounded-full bg-sky-300/25 blur-[110px]"
          style={{ animationDelay: "-4s" }}
        />
        <div
          className="responder-float absolute bottom-[-8rem] left-[35%] h-80 w-80 rounded-full bg-indigo-200/30 blur-[100px]"
          style={{ animationDelay: "-7s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.24]"
          style={{
            backgroundImage:
              "radial-gradient(#94a3b8 0.7px, transparent 0.7px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-blue-100/80 bg-white/85 px-5 py-6 shadow-[8px_0_40px_-35px_rgba(37,99,235,.35)] backdrop-blur-2xl lg:block">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
            <Siren size={21} />
          </div>
          <div>
            <h1 className="font-extrabold tracking-wide text-slate-900">
              ResQAI
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Response Network
            </p>
          </div>
        </div>

        <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Operations
        </p>

        <nav className="space-y-2">
          {navigationItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavigate(id)}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all ${
                activeNav === id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20"
                  : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <Icon size={18} />
              {label}
              {activeNav === id && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
              )}
            </button>
          ))}
        </nav>

        <button
          onClick={openVerification}
          className="mt-6 flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-left text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-100"
        >
          <FileCheck2 size={18} />
          Organization Verification
          <ArrowUpRight size={15} className="ml-auto" />
        </button>

        <div className="group absolute bottom-5 left-5 right-5 rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50 to-indigo-50 p-2 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-200/40">
        <p className="text-[11px] font-medium text-slate-500">
          Current role
        </p>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="responder-pulse h-2 w-2 shrink-0 rounded-full bg-blue-500" />

          <span className="text-sm font-bold tracking-wide text-slate-800 transition-colors duration-300 group-hover:text-blue-700">
            RESPONDER
          </span>
        </div>

        <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
          Organization verification and operational availability are shown separately.
        </p>
      </div>
            </aside>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
          />
          <aside className="absolute bottom-0 left-0 top-0 w-[min(18rem,85vw)] border-r border-blue-100 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Siren size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">ResQAI</p>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    Responder
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <nav className="mt-6 space-y-2">
              {navigationItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleNavigate(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${
                    activeNav === id
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-blue-50"
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </nav>

            <button
              onClick={openVerification}
              className="mt-5 flex w-full items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 text-sm font-semibold text-blue-800"
            >
              <FileCheck2 size={18} />
              Organization Verification
              <ArrowUpRight size={15} className="ml-auto" />
            </button>
          </aside>
        </div>
      )}

      {/* Main content */}
      <section className="relative z-10 min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between gap-3 border-b border-blue-100/80 bg-white/80 px-4 backdrop-blur-2xl sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-xl border border-blue-100 bg-white p-2.5 text-slate-600 shadow-sm lg:hidden"
            >
              <Menu size={19} />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600 sm:text-xs">
                Responder Command
              </p>
              <h2 className="mt-1 text-base font-bold text-slate-900 sm:text-xl">
                Field Operations
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span
              className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold sm:flex ${
                status === "AVAILABLE"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-500"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  status === "AVAILABLE" ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              {status}
            </span>

            <button
              id="notifications"
              onClick={() => handleNavigate("notifications")}
              aria-label="Notifications"
              className="relative rounded-xl border border-blue-100 bg-white p-2.5 text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600"
            >
              <Bell size={19} />
            </button>

            <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white py-1.5 pl-1.5 pr-3 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                <User size={16} />
              </div>
              <span className="hidden text-sm font-semibold text-slate-700 sm:block">
                Responder
              </span>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {notice && (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 shadow-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                <p>{notice}</p>
              </div>
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
                className="rounded-lg p-1 hover:bg-blue-100"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Welcome */}
          <section className="mb-6">
            <div className="responder-card rounded-3xl">
              <div className="responder-card-inner overflow-hidden border border-white p-5 shadow-[0_12px_45px_-32px_rgba(37,99,235,.3)] sm:p-7">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 sm:text-xs">
                      <Activity size={14} />
                      Emergency response network
                    </div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                      Stay ready.{" "}
                      <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Respond fast.
                      </span>
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                      Review your organization verification, monitor assigned
                      emergencies, and coordinate your response.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setStatus(
                        status === "AVAILABLE" ? "OFFLINE" : "AVAILABLE",
                      )
                    }
                    className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                      status === "AVAILABLE"
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                        : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        status === "AVAILABLE"
                          ? "bg-emerald-300"
                          : "bg-slate-400"
                      }`}
                    />
                    {status === "AVAILABLE" ? "Go Offline" : "Go Available"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Organization verification */}
          <section className="mb-6" aria-labelledby="verification-heading">
            <div className="responder-card rounded-3xl">
              <div
                className={`responder-card-inner overflow-hidden border bg-gradient-to-br p-5 shadow-[0_12px_45px_-32px_rgba(37,99,235,.3)] sm:p-6 ${verificationTone.panel}`}
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div className="flex min-w-0 gap-4">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${verificationTone.icon}`}
                    >
                      {verificationLoading ? (
                        <RefreshCw size={23} className="animate-spin" />
                      ) : verificationState.tone === "green" ? (
                        <ShieldCheck size={24} />
                      ) : verificationState.tone === "red" ? (
                        <FileWarning size={24} />
                      ) : verificationState.tone === "blue" ? (
                        <FileClock size={24} />
                      ) : (
                        <FileCheck2 size={24} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 sm:text-xs">
                          Organization Verification
                        </p>

                        {!verificationLoading && (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${verificationTone.badge}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${verificationTone.dot}`}
                            />
                            {verificationError
                              ? "STATUS UNAVAILABLE"
                              : verificationState.badge}
                          </span>
                        )}
                      </div>

                      <h2
                        id="verification-heading"
                        className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl"
                      >
                        {verificationLoading
                          ? "Loading verification status..."
                          : verificationError
                            ? "Unable to Load Status"
                            : verificationState.title}
                      </h2>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        {verificationLoading
                          ? "Checking the current status from your responder organization records."
                          : verificationError
                            ? verificationError
                            : verificationState.description}
                      </p>

                      {verification?.organization && (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl border border-white/90 bg-white/80 p-3">
                            <p className="text-[11px] font-medium text-slate-500">
                              Organization
                            </p>
                            <p className="mt-1 break-words text-sm font-bold text-slate-800">
                              {verification.application?.organization_name ||
                                "Organization linked"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/90 bg-white/80 p-3">
                            <p className="text-[11px] font-medium text-slate-500">
                              Application status
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {verification.application
                                ? formatStatus(
                                    verification.application.application_status,
                                  )
                                : "No application found"}
                            </p>
                          </div>

                          {verification.application?.organization_city && (
                            <div className="rounded-xl border border-white/90 bg-white/80 p-3">
                              <p className="text-[11px] font-medium text-slate-500">
                                Organization location
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {[
                                  verification.application.organization_city,
                                  verification.application.organization_state,
                                ]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          )}

                          {verification.application?.submitted_at && (
                            <div className="rounded-xl border border-white/90 bg-white/80 p-3">
                              <p className="text-[11px] font-medium text-slate-500">
                                Submitted on
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {new Date(
                                  verification.application.submitted_at,
                                ).toLocaleDateString(undefined, {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {verification?.application?.rejection_reason && (
                        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                          <p className="font-bold">Review feedback</p>
                          <p className="mt-1 leading-relaxed">
                            {verification.application.rejection_reason}
                          </p>
                        </div>
                      )}

                      {!verification?.application?.rejection_reason &&
                        verification?.application?.review_notes && (
                          <div className="mt-4 rounded-xl border border-blue-200 bg-white/80 p-3 text-sm text-slate-700">
                            <p className="font-bold">Administrator notes</p>
                            <p className="mt-1 leading-relaxed">
                              {verification.application.review_notes}
                            </p>
                          </div>
                        )}

                      {verificationError && (
                        <button
                          onClick={() => void loadVerification()}
                          disabled={verificationLoading}
                          className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 disabled:opacity-60"
                        >
                          <RefreshCw size={15} />
                          Retry status check
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
                    <button
                      onClick={openVerification}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 ${verificationTone.button}`}
                    >
                      <FileCheck2 size={17} />
                      {verificationState.action}
                      <ArrowUpRight size={15} />
                    </button>

                    <button
                      onClick={() => void loadVerification()}
                      disabled={verificationLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RefreshCw
                        size={16}
                        className={verificationLoading ? "animate-spin" : ""}
                      />
                      Refresh Status
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-2 border-t border-slate-200/70 pt-4 text-xs leading-relaxed text-slate-500">
                  <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                  <p>
                    This status is loaded from your organization and application
                    records. Organization verification is separate from your
                    operational availability.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Demo metrics */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<AlertTriangle size={19} />}
              label="Active Assignment"
              value={assignmentStatus === "COMPLETED" ? "00" : "01"}
              description="Demo assignment"
              accent="rose"
            />
            <StatCard
              icon={<Clock3 size={19} />}
              label="Response ETA"
              value={
                assignmentStatus === "ARRIVED" ||
                assignmentStatus === "COMPLETED"
                  ? "Arrived"
                  : "07 min"
              }
              description="Demo assignment"
              accent="blue"
            />
            <StatCard
              icon={<CheckCircle2 size={19} />}
              label="Completed Today"
              value={assignmentStatus === "COMPLETED" ? "09" : "08"}
              description="Demo metric"
              accent="emerald"
            />
            <StatCard
              icon={<Users size={19} />}
              label="Team Members"
              value="04"
              description="Demo metric"
              accent="violet"
            />
          </section>

          {/* Assignment and navigation */}
          <section className="mt-6 grid scroll-mt-24 gap-6 xl:grid-cols-[1.55fr_1fr]">
            <div
              id="assignment"
              className="responder-card scroll-mt-24 rounded-3xl"
            >
              <div className="responder-card-inner overflow-hidden border border-white shadow-[0_12px_45px_-32px_rgba(37,99,235,.3)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20">
                      <Siren size={21} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 sm:text-xs">
                        Demo Assignment
                      </p>
                      <h3 className="mt-1 font-bold text-slate-900">
                        {activeIncident.id}
                      </h3>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[10px] font-extrabold tracking-wider text-rose-700 sm:text-xs">
                    {activeIncident.severity}
                  </span>
                </div>

                <div className="p-5 sm:p-6">
                  <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                    {activeIncident.title}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeIncident.type} · Reported {activeIncident.reported}
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <InfoRow
                      icon={<MapPin size={18} />}
                      label="Location"
                      value={activeIncident.location}
                    />
                    <InfoRow
                      icon={<LocateFixed size={18} />}
                      label="Distance"
                      value={activeIncident.distance}
                    />
                    <InfoRow
                      icon={<Clock3 size={18} />}
                      label="Estimated arrival"
                      value={activeIncident.eta}
                    />
                    <InfoRow
                      icon={<Users size={18} />}
                      label="People affected"
                      value={`${activeIncident.people} people`}
                    />
                  </div>

                  <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500">
                        Demo assignment progress
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-extrabold tracking-wider text-blue-700 shadow-sm">
                        {formatStatus(assignmentStatus)}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center">
                      {assignmentSteps.map((step, index) => {
                        const complete = index <= currentStep;

                        return (
                          <div
                            key={step}
                            className="flex flex-1 items-center last:flex-none"
                          >
                            <div
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                                complete
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 bg-white text-slate-400"
                              }`}
                            >
                              {complete ? (
                                <CheckCircle2 size={14} />
                              ) : (
                                <span className="text-[10px] font-bold">
                                  {index + 1}
                                </span>
                              )}
                            </div>
                            {index < assignmentSteps.length - 1 && (
                              <div className="mx-1 h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    index < currentStep
                                      ? "w-full bg-blue-600"
                                      : "w-0"
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[9px] font-semibold text-slate-500 sm:text-[10px]">
                      <span>Assigned</span>
                      <span>En route</span>
                      <span>Arrived</span>
                      <span>Completed</span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={openNavigation}
                      className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5"
                    >
                      <Navigation size={17} />
                      Open Navigation
                      <ArrowUpRight
                        size={15}
                        className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </button>

                    <button
                      onClick={updateAssignment}
                      disabled={assignmentStatus === "COMPLETED"}
                      className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-3.5 text-sm font-bold text-blue-700 transition hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 size={17} />
                      {assignmentStatus === "EN_ROUTE"
                        ? "Mark Arrived"
                        : assignmentStatus === "ARRIVED"
                          ? "Complete Assignment"
                          : assignmentStatus === "COMPLETED"
                            ? "Assignment Completed"
                            : "Start Response"}
                    </button>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-slate-400">
                    Demo only: assignment changes are local to this page and
                    are not saved to the incident database.
                  </p>
                </div>
              </div>
            </div>

            {/* Illustrative navigation */}
            <div
              id="live-status"
              className="responder-card scroll-mt-24 rounded-3xl"
            >
              <div className="responder-card-inner border border-white p-5 shadow-[0_12px_45px_-32px_rgba(37,99,235,.3)] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 sm:text-xs">
                      Navigation Preview
                    </p>
                    <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                      Response Network
                    </h3>
                  </div>
                  <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-700">
                    ILLUSTRATIVE
                  </div>
                </div>

                <div className="relative mt-5 h-64 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-sky-50 via-white to-indigo-50">
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "linear-gradient(30deg, transparent 47%, #dbeafe 48%, #dbeafe 50%, transparent 51%), linear-gradient(120deg, transparent 45%, #e0e7ff 46%, #e0e7ff 48%, transparent 49%)",
                      backgroundSize: "95px 85px, 115px 105px",
                    }}
                  />
                  <div className="absolute left-[18%] top-0 h-full w-7 rotate-[25deg] bg-white/90 shadow-sm" />
                  <div className="absolute left-[58%] top-0 h-full w-5 -rotate-[24deg] bg-white/90 shadow-sm" />
                  <div className="absolute left-0 top-[35%] h-6 w-full rotate-[-8deg] bg-white/90 shadow-sm" />
                  <div className="absolute left-0 top-[72%] h-4 w-full rotate-[5deg] bg-white/90 shadow-sm" />

                  <div className="absolute left-[25%] top-[25%] rounded-lg border border-white bg-white/90 px-2 py-1 text-[9px] font-semibold text-slate-500 shadow-sm">
                    Civil Lines
                  </div>
                  <div className="absolute right-[8%] top-[18%] rounded-lg border border-white bg-white/90 px-2 py-1 text-[9px] font-semibold text-slate-500 shadow-sm">
                    Railway Crossing
                  </div>

                  <div className="absolute left-[31%] top-[44%]">
                    <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-white shadow-lg">
                      <Siren size={16} />
                    </div>
                  </div>

                  <div className="absolute left-[66%] top-[65%]">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg">
                      <Navigation size={15} />
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-white bg-white/95 px-3 py-2 text-[10px] font-bold text-slate-600 shadow-sm">
                    <Crosshair size={13} className="text-blue-600" />
                    NOT REAL-TIME GPS
                  </div>
                  <button
                    onClick={openNavigation}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-bold text-white shadow-md transition hover:bg-blue-700"
                  >
                    Open Maps <ArrowUpRight size={13} />
                  </button>
                </div>

                <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                  This graphic is illustrative and does not show your live
                  position or a verified incident location.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
                    <p className="text-xs font-medium text-slate-500">
                      Local availability
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
                      <LocateFixed size={14} className="text-blue-600" />
                      {status}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
                    <p className="text-xs font-medium text-slate-500">
                      Team channel
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-amber-700">
                      <Radio size={14} />
                      Not connected
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section
            id="quick-actions"
            className="responder-card mt-6 scroll-mt-24 rounded-3xl"
          >
            <div className="responder-card-inner border border-white p-5 shadow-[0_12px_45px_-32px_rgba(37,99,235,.3)] sm:p-6">
              <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 sm:text-xs">
                  Quick Actions
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">
                  Response controls
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Open navigation or access response features.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickAction
                  icon={<Navigation size={19} />}
                  title="Navigation"
                  description="Open route to incident"
                  onClick={openNavigation}
                />
                <QuickAction
                  icon={<Radio size={19} />}
                  title="Team Radio"
                  description="Communication integration pending"
                  onClick={() => quickAction("Team Radio")}
                />
                <QuickAction
                  icon={<MapPin size={19} />}
                  title="Share Location"
                  description="Location integration pending"
                  onClick={() => quickAction("Share Location")}
                />
                <QuickAction
                  icon={<AlertTriangle size={19} />}
                  title="Request Backup"
                  description="Incident API integration pending"
                  danger
                  onClick={() => quickAction("Request Backup")}
                />
              </div>
            </div>
          </section>

          <footer className="mt-6 flex flex-col justify-between gap-3 rounded-2xl border border-blue-100 bg-white/85 px-5 py-4 text-xs text-slate-500 shadow-sm backdrop-blur-xl sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="font-semibold text-slate-700">
                Dashboard loaded
              </span>
            </div>
            <span>
              Verification status uses organization records · Incident metrics
              are demo data
            </span>
            <button
              onClick={() => window.location.assign("/login")}
              className="flex items-center gap-2 font-semibold text-slate-500 transition hover:text-blue-700"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </footer>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  description,
  accent = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  accent?: "rose" | "blue" | "emerald" | "violet";
}) {
  const accents = {
    rose: {
      icon: "bg-rose-50 text-rose-600",
      stripe: "from-rose-500 to-orange-400",
      value: "text-rose-700",
    },
    blue: {
      icon: "bg-blue-50 text-blue-600",
      stripe: "from-blue-500 to-sky-400",
      value: "text-blue-700",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-600",
      stripe: "from-emerald-500 to-teal-400",
      value: "text-emerald-700",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600",
      stripe: "from-violet-500 to-indigo-400",
      value: "text-violet-700",
    },
  };

  const style = accents[accent];

  return (
    <div className="responder-card rounded-2xl">
      <div className="responder-card-inner relative overflow-hidden border border-white p-5 shadow-[0_8px_30px_-25px_rgba(37,99,235,.3)]">
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${style.stripe}`}
        />
        <div className="flex items-center justify-between">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl ${style.icon}`}
          >
            {icon}
          </div>
          <ArrowUpRight size={16} className="text-slate-300" />
        </div>
        <p className="mt-5 text-xs font-semibold text-slate-500">{label}</p>
        <p
          className={`mt-1 text-2xl font-extrabold tracking-tight ${style.value}`}
        >
          {value}
        </p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:border-blue-100 hover:bg-blue-50/50">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold leading-relaxed text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  danger = false,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-1 ${
        danger
          ? "border-rose-100 bg-rose-50/60 hover:border-rose-300 hover:bg-rose-50"
          : "border-slate-100 bg-slate-50/70 hover:border-blue-200 hover:bg-blue-50/70"
      }`}
    >
      <div
        className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition group-hover:scale-105 ${
          danger
            ? "bg-rose-100 text-rose-600"
            : "bg-white text-blue-600 shadow-sm"
        }`}
      >
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        {description}
      </p>
    </button>
  );
}
