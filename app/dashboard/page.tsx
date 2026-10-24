
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
  IN_PROGRESS: "border-amber-200 bg-amber-50 text-amber-700",
  RESOLVED: "border-green-200 bg-green-50 text-green-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

const severityStyles: Record<string, string> = {
  LOW: "border-green-200 bg-green-50 text-green-700",
  MEDIUM: "border-yellow-200 bg-yellow-50 text-yellow-800",
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
  "group relative rounded-2xl border border-blue-100 bg-white/85 shadow-[0_8px_30px_rgba(37,99,235,0.055)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-[0_16px_42px_rgba(37,99,235,0.14)] before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:border before:border-transparent before:transition-colors before:duration-300 hover:before:border-blue-400/70";

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
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-slate-900">
        <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-xl shadow-blue-100/60">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-blue-600" />
          <h1 className="text-xl font-bold">Profile unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            We couldn&apos;t load your account profile. Please sign in again.
            If the problem continues, contact support.
          </p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
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

  const firstName =
    profile.full_name?.trim().split(/\s+/)[0] || "there";

  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-[#f5f9ff] text-slate-800 selection:bg-blue-200 selection:text-blue-950">
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 animate-[float_12s_ease-in-out_infinite] rounded-full bg-blue-300/25 blur-3xl" />
        <div className="absolute -right-32 top-1/4 h-[30rem] w-[30rem] animate-[float_16s_ease-in-out_infinite] rounded-full bg-sky-300/25 blur-3xl [animation-delay:-4s]" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 animate-[float_14s_ease-in-out_infinite] rounded-full bg-indigo-200/30 blur-3xl [animation-delay:-7s]" />
        <div className="absolute inset-0 bg-[radial-gradient(#93c5fd_0.7px,transparent_0.7px)] bg-[size:28px_28px] opacity-25" />
      </div>

      <header className="sticky top-0 z-30 border-b border-blue-100/80 bg-white/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25 transition-transform duration-300 hover:rotate-3 hover:scale-105">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.25em] text-blue-600">
                RESQAI
              </span>
              <span className="block truncate text-sm font-bold text-slate-800">
                Citizen Dashboard
              </span>
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              Emergency reporting
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 sm:px-4 sm:text-sm"
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
        <section className={`${cardClass} mb-7 overflow-hidden p-6 sm:p-9`}>
          <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl transition-transform duration-700 group-hover:scale-125" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 sm:text-xs">
                <Activity className="h-3.5 w-3.5" />
                Citizen safety portal
              </span>

              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Hello, {firstName}
                <span className="text-blue-600">.</span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Report emergencies, review your submissions, and follow their
                status from one place. Clear information helps response teams
                assess incidents more effectively.
              </p>

              <p className="mt-3 break-all font-mono text-xs text-slate-400">
                {user.email}
              </p>
            </div>

            <Link
              href="/report"
              className="group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-blue-500/30 active:scale-[0.98]"
            >
              <PlusCircle className="h-5 w-5 transition-transform group-hover/button:rotate-90" />
              Report an emergency
              <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
            </Link>
          </div>
        </section>

        {/* Metrics */}
        <section
          aria-label="Incident summary"
          className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5"
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
            detail="Awaiting resolution"
            icon={Clock3}
            accent="amber"
          />
          <MetricCard
            label="Critical active"
            value={criticalCount}
            detail="High-priority attention"
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

        {/* Incident list */}
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-blue-100/80 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl">
                <Radio className="h-5 w-5 text-blue-600" />
                My emergency reports
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Your 10 most recent submissions and their current status.
              </p>
            </div>
            <Link
              href="/report"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-100 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 sm:text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              New report
            </Link>
          </div>

          {incidentsError ? (
            <div className="p-8 text-center sm:p-12">
              <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
              <h3 className="mt-4 font-bold text-slate-900">
                Unable to load reports
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                We couldn&apos;t retrieve your incidents right now. Please
                refresh the page and try again.
              </p>
            </div>
          ) : recentIncidents.length === 0 ? (
            <div className="flex flex-col items-center px-5 py-12 text-center sm:py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50">
                <FileWarning className="h-7 w-7 text-blue-500" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No reports yet
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Your submitted emergency reports will appear here so you can
                review their status.
              </p>
              <Link
                href="/report"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              >
                <PlusCircle className="h-4 w-4" />
                Submit your first report
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-blue-50">
              {recentIncidents.map((incident) => {
                const IncidentIcon = getIncidentIcon(incident.incident_type);

                return (
                  <article
                    key={incident.id}
                    className="group/incident relative p-5 transition-all duration-300 hover:bg-blue-50/70 sm:p-6"
                  >
                    <div className="pointer-events-none absolute inset-y-3 left-0 w-1 origin-center scale-y-0 rounded-r-full bg-gradient-to-b from-blue-400 to-indigo-500 transition-transform duration-300 group-hover/incident:scale-y-100" />

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3 sm:gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 transition-all duration-300 group-hover/incident:border-blue-300 group-hover/incident:bg-blue-100">
                          <IncidentIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="break-words font-bold text-slate-900">
                            {incident.title || formatLabel(incident.incident_type)}
                          </h3>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatLabel(incident.incident_type)}
                            <span className="mx-2 text-slate-300">•</span>
                            {formatDate(incident.created_at)}
                          </p>

                          {incident.address && (
                            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500 sm:text-sm">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                              <span className="break-words">
                                {incident.address}
                              </span>
                            </p>
                          )}

                          {incident.description && (
                            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                              {incident.description}
                            </p>
                          )}

                          {incident.affected_people != null && (
                            <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                              <Users className="h-3.5 w-3.5" />
                              People affected: {incident.affected_people}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 pl-0 sm:justify-end sm:pl-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            severityStyles[incident.severity] ??
                            "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {formatLabel(incident.severity)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            statusStyles[incident.status] ??
                            "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
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
            <div className="flex flex-col gap-3 border-t border-blue-100 bg-blue-50/50 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span>
                Showing {recentIncidents.length} of {totalIncidents} reports
              </span>
              <span className="flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh the page to check for status updates
              </span>
            </div>
          )}
        </section>

        {/* Emergency guidance */}
        <section className="group relative mt-6 overflow-hidden rounded-2xl border border-amber-200 bg-white/85 p-4 shadow-sm transition-all duration-300 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/60 sm:p-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-amber-300 to-orange-400" />
          <div className="flex gap-3 pl-2">
            <HeartPulse className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h2 className="text-sm font-bold text-amber-900">
                Need urgent help?
              </h2>
              <p className="mt-1 text-xs leading-6 text-slate-600 sm:text-sm">
                If someone is in immediate danger, contact the appropriate
                local emergency service directly. Do not wait for an online
                report to be reviewed or assigned.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="mt-8 border-t border-blue-100 bg-white/70 px-4 py-6 text-center text-xs text-slate-400 backdrop-blur-xl sm:px-8">
        <p>
          © {new Date().getFullYear()} RESQAI. Emergency information and
          community safety.
        </p>
        <p className="mt-2">
          Developed by{" "}
          <a
            href="https://github.com/dev-prashant-kumar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 transition hover:text-indigo-600"
          >
            Shant
          </a>
        </p>
      </footer>

      {/* Local animation styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(24px, -20px, 0) scale(1.08); }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
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
    glow: "group-hover:shadow-blue-200/60",
    number: "text-blue-700",
    line: "from-blue-400 to-indigo-500",
  },
  amber: {
    icon: "border-amber-200 bg-amber-50 text-amber-600",
    glow: "group-hover:shadow-amber-200/60",
    number: "text-amber-700",
    line: "from-amber-400 to-orange-500",
  },
  red: {
    icon: "border-red-200 bg-red-50 text-red-600",
    glow: "group-hover:shadow-red-200/60",
    number: "text-red-700",
    line: "from-red-400 to-rose-500",
  },
  green: {
    icon: "border-emerald-200 bg-emerald-50 text-emerald-600",
    glow: "group-hover:shadow-emerald-200/60",
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
    <div className="group relative min-w-0 overflow-hidden rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-[0_8px_25px_rgba(37,99,235,0.05)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl sm:p-6">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 scale-x-0 bg-gradient-to-r ${colors.line} transition-transform duration-500 group-hover:scale-x-100`} />

      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
          {label}
        </span>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110 sm:h-10 sm:w-10 ${colors.icon}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>

      <p className={`text-2xl font-black tabular-nums sm:text-3xl ${colors.number}`}>
        {value}
      </p>
      <p className="mt-1 truncate text-[10px] text-slate-400 sm:text-xs">
        {detail}
      </p>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full w-1/3 rounded-full bg-gradient-to-r ${colors.line} transition-all duration-700 group-hover:w-full`} />
      </div>
    </div>
  );
}
