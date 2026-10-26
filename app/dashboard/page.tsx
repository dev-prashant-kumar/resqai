import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileWarning,
  HeartPulse,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  PlusCircle,
  Radio,
  Car,
  Flame,
  Waves,
  Users,
  RefreshCw,
  Siren,
  ArrowUpRight,
} from "lucide-react";

type Incident = {
  id: string;
  title: string;
  description: string | null;
  incident_type: string;
  severity: string;
  status: string;
  address: string | null;
  created_at: string;
  affected_people: number | null;
};

const statusStyles: Record<string, string> = {
  REPORTED: "border-blue-200 bg-blue-50 text-blue-700",
  ANALYZING: "border-violet-200 bg-violet-50 text-violet-700",
  VERIFIED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ASSIGNED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-800",
  RESOLVED: "border-green-200 bg-green-50 text-green-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

const statusDescriptions: Record<string, string> = {
  REPORTED: "Report received",
  ANALYZING: "Under review",
  VERIFIED: "Incident verified",
  ASSIGNED: "Response team assigned",
  IN_PROGRESS: "Response in progress",
  RESOLVED: "Incident resolved",
  CANCELLED: "Report cancelled",
};

const severityStyles: Record<string, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-800",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-red-200 bg-red-50 text-red-700",
};

const activeStatuses = [
  "REPORTED",
  "ANALYZING",
  "VERIFIED",
  "ASSIGNED",
  "IN_PROGRESS",
];

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getIncidentIcon(type: string) {
  switch (type) {
    case "FIRE":
      return Flame;
    case "FLOOD":
      return Waves;
    case "MEDICAL":
      return HeartPulse;
    case "ROAD_ACCIDENT":
      return Car;
    default:
      return AlertTriangle;
  }
}

async function signOutAction() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}

const cardClass =
  "group relative rounded-2xl border border-blue-100/80 bg-white/80 shadow-[0_8px_35px_rgba(37,99,235,0.055)] backdrop-blur-xl transition-all duration-300 hover:border-blue-200 hover:shadow-[0_16px_45px_rgba(37,99,235,0.10)]";

export default async function CitizenDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: organization, error: organizationError } = await supabase
    .from("responder_organizations")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!organizationError && organization) {
    redirect("/responder");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f4f8ff] px-5 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-2xl shadow-blue-100/60">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <h1 className="text-xl font-bold">Profile unavailable</h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            We couldn&apos;t load your account profile. Please sign in again.
            If the problem continues, contact support.
          </p>

          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
            >
              <LogOut className="h-4 w-4" />
              Return to login
            </button>
          </form>
        </div>
      </main>
    );
  }

  if (profile.role === "RESPONDER") redirect("/responder");
  if (profile.role === "OPERATOR") redirect("/operator");
  if (profile.role === "ADMIN") redirect("/admin");
  if (profile.role !== "CITIZEN") redirect("/login");

  const { data: incidentData, error: incidentsError } = await supabase
    .from("incidents")
    .select(
      "id, title, description, incident_type, severity, status, address, created_at, affected_people"
    )
    .eq("reported_by", user.id)
    .order("created_at", { ascending: false });

  const incidents = (incidentData ?? []) as Incident[];
  const recentIncidents = incidents.slice(0, 10);
  const totalIncidents = incidents.length;

  const activeCount = incidents.filter((incident) =>
    activeStatuses.includes(incident.status)
  ).length;

  const criticalCount = incidents.filter(
    (incident) =>
      incident.severity === "CRITICAL" &&
      activeStatuses.includes(incident.status)
  ).length;

  const resolvedCount = incidents.filter(
    (incident) => incident.status === "RESOLVED"
  ).length;

  const firstName = profile.full_name?.trim().split(/\s+/)[0] || "there";

  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[#f5f8ff] text-slate-800 selection:bg-blue-200 selection:text-blue-950">
      {/* Animated blue atmosphere */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] animate-[resqFloat_18s_ease-in-out_infinite] rounded-full bg-blue-300/25 blur-[100px]" />
        <div className="absolute -right-40 top-[12%] h-[32rem] w-[32rem] animate-[resqFloat_22s_ease-in-out_infinite] rounded-full bg-sky-300/25 blur-[110px] [animation-delay:-6s]" />
        <div className="absolute -bottom-48 left-[25%] h-[30rem] w-[30rem] animate-[resqFloat_20s_ease-in-out_infinite] rounded-full bg-indigo-300/20 blur-[110px] [animation-delay:-10s]" />
        <div className="absolute inset-0 bg-[radial-gradient(#60a5fa_0.7px,transparent_0.7px)] bg-[size:26px_26px] opacity-[0.20]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-blue-50/40" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-blue-100/80 bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-8 sm:py-4">
          <Link
            href="/dashboard"
            className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
          >
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/25 transition duration-300 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent" />
              <ShieldAlert className="relative h-5 w-5" />
            </div>

            <div className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-[0.26em] text-blue-600">
                RESQAI
              </span>
              <span className="block truncate text-sm font-bold text-slate-800 sm:text-base">
                Citizen Dashboard
              </span>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-xs font-semibold text-emerald-700 sm:inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Safety portal
            </span>

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:px-4 sm:text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8 sm:py-9">
        {/* Welcome panel */}
        <section className={`${cardClass} mb-7 overflow-hidden p-5 sm:p-8 lg:p-9`}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-blue-400/15 blur-[75px] transition-transform duration-700 group-hover:scale-110"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 left-[30%] h-64 w-64 rounded-full bg-indigo-400/10 blur-[80px]"
          />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-700 sm:text-xs">
                <Activity className="h-3.5 w-3.5" />
                Citizen safety portal
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Hello, {firstName}
                <span className="text-blue-600">.</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Your safety matters. Report an emergency, keep track of your
                submissions, and follow updates from one convenient dashboard.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-medium text-slate-600">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Citizen account
                </span>

                <span className="inline-flex max-w-full items-center gap-2 rounded-lg border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-medium text-slate-600">
                  <span className="truncate">{user.email}</span>
                </span>
              </div>
            </div>

            {/* Primary emergency action */}
            <div className="relative w-full shrink-0 lg:w-[290px]">
              <p className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.13em] text-slate-600">
                <Siren className="h-4 w-4 text-red-600" />
                Need help?
              </p>

              <Link
                href="/report"
                className="group/report relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-red-300/70 bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 px-5 py-4 text-sm font-extrabold text-white shadow-[0_8px_30px_rgba(225,29,72,0.28)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_38px_rgba(225,29,72,0.38)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-300 motion-safe:animate-[resqGlow_3s_ease-in-out_infinite]"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/report:translate-x-full"
                />

                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15">
                  <PlusCircle className="h-5 w-5 transition-transform duration-300 group-hover/report:rotate-90" />
                </span>

                <span className="relative min-w-0 flex-1 text-left">
                  <span className="block text-[15px] leading-5">
                    Report an Emergency
                  </span>
                  <span className="mt-1 block text-[11px] font-medium text-white/85">
                    Fire, accident, medical & more
                  </span>
                </span>

                <ArrowRight className="relative h-5 w-5 shrink-0 transition-transform duration-300 group-hover/report:translate-x-1" />
              </Link>

              <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
                For immediate danger, call local emergency services directly.
              </p>
            </div>
          </div>
        </section>

        {/* Incident metrics */}
        <section
          aria-label="Incident summary"
          className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5"
        >
          <MetricCard
            label="Total reports"
            value={totalIncidents}
            detail="All your submissions"
            icon={FileWarning}
            accent="blue"
          />
          <MetricCard
            label="Active reports"
            value={activeCount}
            detail="Not yet resolved"
            icon={Clock3}
            accent="amber"
          />
          <MetricCard
            label="Critical active"
            value={criticalCount}
            detail="Critical and active"
            icon={ShieldAlert}
            accent="red"
          />
          <MetricCard
            label="Resolved"
            value={resolvedCount}
            detail="Marked as resolved"
            icon={CheckCircle2}
            accent="green"
          />
        </section>

        {/* Reports */}
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-4 border-b border-blue-100/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
                  <Radio className="h-4.5 w-4.5" />
                </span>
                My emergency reports
              </h2>
              <p className="mt-2 text-xs leading-5 text-slate-500 sm:text-sm">
                Review your 10 most recent reports and check their current status.
              </p>
            </div>

            <Link
              href="/report"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 sm:w-fit sm:text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Create new report
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {incidentsError ? (
            <div className="p-8 text-center sm:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-bold text-slate-900">
                Unable to load reports
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                We couldn&apos;t retrieve your reports right now. Please refresh
                the page and try again.
              </p>
            </div>
          ) : recentIncidents.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-12 text-center sm:py-16">
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 shadow-sm">
                <div className="absolute inset-0 rounded-3xl bg-blue-300/10 blur-xl" />
                <FileWarning className="relative h-8 w-8" />
              </div>

              <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                No reports yet
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                When you submit an emergency report, it will appear here. You
                can return anytime to review its details and status.
              </p>

              <Link
                href="/report"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200"
              >
                <PlusCircle className="h-4 w-4" />
                Submit your first report
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-blue-50/90">
              {recentIncidents.map((incident) => {
                const IncidentIcon = getIncidentIcon(incident.incident_type);

                return (
                  <article
                    key={incident.id}
                    className="group/incident relative p-5 transition-colors duration-300 hover:bg-blue-50/60 sm:p-6"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-3 left-0 w-1 origin-center scale-y-0 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500 transition-transform duration-300 group-hover/incident:scale-y-100"
                    />

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3 sm:gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 transition-all duration-300 group-hover/incident:border-blue-200 group-hover/incident:shadow-md group-hover/incident:shadow-blue-100">
                          <IncidentIcon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="break-words font-bold text-slate-900">
                            {incident.title ||
                              formatLabel(incident.incident_type)}
                          </h3>

                          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                            <span className="font-semibold text-blue-700">
                              {formatLabel(incident.incident_type)}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>{formatDate(incident.created_at)}</span>
                          </p>

                          {incident.address && (
                            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-600 sm:text-sm">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                              <span className="break-words">
                                {incident.address}
                              </span>
                            </p>
                          )}

                          {incident.description && (
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                              {incident.description}
                            </p>
                          )}

                          {incident.affected_people != null && (
                            <p className="mt-2.5 flex items-center gap-2 text-xs text-slate-500">
                              <Users className="h-3.5 w-3.5 text-blue-500" />
                              People affected: {incident.affected_people}
                            </p>
                          )}

                          <p className="mt-3 text-xs font-medium text-slate-500">
                            Update:{" "}
                            <span className="text-slate-700">
                              {statusDescriptions[incident.status] ??
                                formatLabel(incident.status)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 pl-0 sm:max-w-[230px] sm:justify-end sm:pl-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            severityStyles[incident.severity] ??
                            "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {formatLabel(incident.severity)}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            statusStyles[incident.status] ??
                            "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {incident.status === "IN_PROGRESS" && (
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                          )}
                          {formatLabel(incident.status)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!incidentsError && recentIncidents.length > 0 && (
            <div className="flex flex-col gap-2.5 border-t border-blue-100/80 bg-blue-50/40 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>
                Showing{" "}
                <strong className="font-bold text-slate-700">
                  {recentIncidents.length}
                </strong>{" "}
                of{" "}
                <strong className="font-bold text-slate-700">
                  {totalIncidents}
                </strong>{" "}
                reports
              </span>

              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
                Refresh the page to check for status updates
              </span>
            </div>
          )}
        </section>

        {/* Emergency guidance */}
        <section className="group relative mt-6 overflow-hidden rounded-2xl border border-amber-200/90 bg-white/85 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 sm:p-6">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-400 to-orange-500"
          />

          <div className="flex items-start gap-3.5 pl-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600">
              <HeartPulse className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-sm font-extrabold text-amber-950 sm:text-base">
                Need urgent help?
              </h2>

              <p className="mt-1.5 text-xs leading-6 text-slate-600 sm:text-sm">
                If someone is in immediate danger, contact the appropriate
                local emergency service directly. Do not wait for an online
                report to be reviewed, verified, or assigned.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-blue-100/80 bg-white/70 px-4 py-6 text-center text-xs text-slate-500 backdrop-blur-xl sm:px-8">
        <p>
          © {new Date().getFullYear()} RESQAI. Emergency information and
          community safety.
        </p>

        
      </footer>

      {/* Page-specific animation styles */}
      <style>{`
        @keyframes resqFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(22px, -18px, 0) scale(1.06);
          }
        }

        @keyframes resqGlow {
          0%, 100% {
            box-shadow: 0 8px 30px rgba(225, 29, 72, 0.22);
          }
          50% {
            box-shadow: 0 10px 36px rgba(225, 29, 72, 0.36);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
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

type MetricCardProps = {
  label: string;
  value: number;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "blue" | "amber" | "red" | "green";
};

const metricAccents = {
  blue: {
    icon: "border-blue-200 bg-blue-50 text-blue-600",
    number: "text-blue-700",
    line: "from-blue-400 to-indigo-500",
  },
  amber: {
    icon: "border-amber-200 bg-amber-50 text-amber-600",
    number: "text-amber-700",
    line: "from-amber-400 to-orange-500",
  },
  red: {
    icon: "border-red-200 bg-red-50 text-red-600",
    number: "text-red-700",
    line: "from-red-400 to-rose-500",
  },
  green: {
    icon: "border-emerald-200 bg-emerald-50 text-emerald-600",
    number: "text-emerald-700",
    line: "from-emerald-400 to-teal-500",
  },
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: MetricCardProps) {
  const colors = metricAccents[accent];

  return (
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-blue-100/80 bg-white/85 p-4 shadow-[0_8px_25px_rgba(37,99,235,0.045)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60 sm:p-5 lg:p-6">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r ${colors.line} transition-transform duration-500 group-hover:scale-x-100`}
      />

      <div className="mb-4 flex items-start justify-between gap-2">
        <span className="pt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:text-xs">
          {label}
        </span>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110 sm:h-10 sm:w-10 ${colors.icon}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>

      <p className={`text-2xl font-black tabular-nums sm:text-3xl ${colors.number}`}>
        {value}
      </p>

      <p className="mt-1.5 truncate text-[10px] text-slate-500 sm:text-xs">
        {detail}
      </p>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full w-1/3 rounded-full bg-gradient-to-r ${colors.line} transition-all duration-700 group-hover:w-full`}
        />
      </div>
    </div>
  );
}
