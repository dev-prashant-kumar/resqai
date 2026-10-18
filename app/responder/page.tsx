import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  Clock3,
  Flame,
  HeartPulse,
  LogOut,
  MapPin,
  Radio,
  ShieldAlert,
  Truck,
  Waves,
  Zap,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeRole(value: unknown) {
  const role = String(value ?? "CITIZEN").toUpperCase();
  if (role === "OPERATOR" || role === "ADMIN") return "ADMIN";
  if (role === "RESPONDER") return "RESPONDER";
  return "CITIZEN";
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "Time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function severityStyle(value: string | null) {
  switch (String(value ?? "").toUpperCase()) {
    case "CRITICAL":
      return "border-rose-500/30 bg-rose-500/10 text-rose-300";
    case "HIGH":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
    case "MEDIUM":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";
    case "LOW":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    default:
      return "border-white/10 bg-white/5 text-zinc-300";
  }
}

function statusStyle(value: string | null) {
  switch (String(value ?? "").toUpperCase()) {
    case "RESOLVED":
    case "CLOSED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "IN_PROGRESS":
    case "ASSIGNED":
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
    case "PENDING":
    case "REPORTED":
    case "OPEN":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300 animate-pulse";
    default:
      return "border-white/10 bg-white/5 text-zinc-300";
  }
}

function incidentIcon(type: string | null) {
  switch (String(type ?? "").toUpperCase()) {
    case "FIRE":
      return <Flame className="h-5 w-5" />;
    case "FLOOD":
      return <Waves className="h-5 w-5" />;
    case "MEDICAL":
      return <HeartPulse className="h-5 w-5" />;
    case "ROAD_ACCIDENT":
      return <Car className="h-5 w-5" />;
    default:
      return <AlertTriangle className="h-5 w-5" />;
  }
}

function MetricCard({
  title,
  value,
  description,
  icon,
  iconStyle,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  iconStyle: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#101115] p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {title}
        </p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconStyle}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </section>
  );
}

export default async function ResponderPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, phone")
    .eq("id", user.id)
    .maybeSingle();

  const role = normalizeRole(profile?.role);
  if (role !== "RESPONDER") {
    redirect(role === "ADMIN" ? "/incidents" : "/dashboard");
  }

  const [totalResult, criticalResult, recentResult, resourcesResult] = await Promise.all([
    supabase.from("incidents").select("id", { count: "exact", head: true }),
    supabase.from("incidents").select("id", { count: "exact", head: true }).eq("severity", "CRITICAL"),
    supabase
      .from("incidents")
      .select("id, title, incident_type, severity, status, created_at, address")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("resources").select("id", { count: "exact", head: true }).eq("status", "AVAILABLE"),
  ]);

  const incidents = recentResult.data ?? [];

  // Group and categorize incidents for separated sections
  const reportedIncidents = incidents.filter((i) =>
    ["OPEN", "REPORTED", "PENDING"].includes(String(i.status ?? "").toUpperCase())
  );

  const inProgressIncidents = incidents.filter((i) =>
    ["IN_PROGRESS", "ASSIGNED"].includes(String(i.status ?? "").toUpperCase())
  );

  const resolvedIncidents = incidents.filter((i) =>
    ["RESOLVED", "CLOSED"].includes(String(i.status ?? "").toUpperCase())
  );

  const displayName =
    profile?.full_name?.trim() ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Responder";

  async function signOut() {
    "use server";
    const supabaseServer = await createClient();
    await supabaseServer.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#060709] pb-24 text-zinc-100 antialiased selection:bg-red-500 selection:text-white md:pb-0 flex flex-col justify-between">
      <div>
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#060709]/90 px-4 py-3.5 backdrop-blur-xl sm:px-6">
          <Link href="/responder" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/30 bg-red-600/20 text-red-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">ResQAI Response Center</h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Field Unit Telemetry Active
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/responder/map"
              className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-600/20 px-3.5 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-600/30"
            >
              <span>Tactical Map</span>
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            </form>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          {/* Intro */}
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-950/40 via-[#101115] to-[#0a0b0f] p-6 sm:p-8">
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="mb-3 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-red-300">
                  Authorized Field Unit
                </span>
                <h2 className="text-2xl font-black text-white sm:text-3xl">Welcome back, {displayName}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                  New incoming emergencies are highlighted at the top for immediate attention. Manage active dispatches and oversee resolution flows.
                </p>
              </div>
              <Link
                href="/incidents"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10"
              >
                Full Incident Ledger
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* Metrics */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Incidents"
              value={totalResult.error ? "—" : (totalResult.count ?? 0)}
              description="Stored in regional database"
              icon={<Activity className="h-4 w-4" />}
              iconStyle="border-red-500/20 bg-red-500/10 text-red-400"
            />
            <MetricCard
              title="Critical Priority"
              value={criticalResult.error ? "—" : (criticalResult.count ?? 0)}
              description="Immediate life-safety threat"
              icon={<ShieldAlert className="h-4 w-4" />}
              iconStyle="border-rose-500/20 bg-rose-500/10 text-rose-400"
            />
            <MetricCard
              title="New Reports"
              value={reportedIncidents.length}
              description="Pending responder assignment"
              icon={<Radio className="h-4 w-4" />}
              iconStyle="border-amber-500/20 bg-amber-500/10 text-amber-400"
            />
            <MetricCard
              title="In Progress"
              value={inProgressIncidents.length}
              description="Active field operations"
              icon={<Truck className="h-4 w-4" />}
              iconStyle="border-blue-500/20 bg-blue-500/10 text-blue-400"
            />
          </div>

          {/* ================= SECTION 1: REPORTED / NEW INCIDENTS (TOP PRIORITY) ================= */}
          <section className="rounded-3xl border border-amber-500/30 bg-[#101115] p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-amber-500/20 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-amber-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                  New Reported Emergencies ({reportedIncidents.length})
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Action required: Newly filed reports awaiting unit dispatch.
                </p>
              </div>
            </div>

            {reportedIncidents.length > 0 ? (
              <div className="space-y-3">
                {reportedIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-8 text-center text-zinc-500 text-xs">
                No new unassigned reports in queue. Sector clear.
              </div>
            )}
          </section>

          {/* ================= SECTION 2: IN PROGRESS / ASSIGNED INCIDENTS ================= */}
          <section className="rounded-3xl border border-blue-500/30 bg-[#101115] p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-blue-500/20 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-blue-300">
                  <Truck className="h-5 w-5 text-blue-400" />
                  In Progress & Dispatched ({inProgressIncidents.length})
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Ongoing emergency operations currently being handled by field units.
                </p>
              </div>
            </div>

            {inProgressIncidents.length > 0 ? (
              <div className="space-y-3">
                {inProgressIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-8 text-center text-zinc-500 text-xs">
                No active dispatches underway.
              </div>
            )}
          </section>

          {/* ================= SECTION 3: RESOLVED / CLOSED INCIDENTS ================= */}
          <section className="rounded-3xl border border-white/10 bg-[#101115]/60 p-5 shadow-lg sm:p-6">
            <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-zinc-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  Resolved & Closed Incidents ({resolvedIncidents.length})
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Archived history of successfully concluded response operations.
                </p>
              </div>
            </div>

            {resolvedIncidents.length > 0 ? (
              <div className="space-y-3 opacity-80 hover:opacity-100 transition">
                {resolvedIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-8 text-center text-zinc-500 text-xs">
                No resolved reports found in recent queue.
              </div>
            )}
          </section>
        </div>
      </div>

      <footer className="hidden md:flex border-t border-white/10 bg-zinc-950 py-5 px-8 items-center justify-between text-xs text-zinc-500 mt-12">
        <div>© {new Date().getFullYear()} ResQAI. All rights reserved.</div>
        <div>
          Developed by{" "}
          <a
            href="https://github.com/dev-prashant-kumar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-400 font-semibold underline underline-offset-4 transition hover:text-red-300"
          >
            Shant
          </a>
        </div>
      </footer>
    </main>
  );
}

// Reusable Incident Item Card Component
function IncidentCard({ incident }: { incident: any }) {
  return (
    <Link
      href={`/dashboard/incidents/${incident.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-white/5 bg-black/30 p-4 transition hover:border-red-500/30 hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
          {incidentIcon(incident.incident_type)}
        </div>
        <div className="min-w-0">
          <h4 className="break-words text-sm font-bold text-white group-hover:text-red-300">
            {incident.title || "Untitled incident"}
          </h4>
          <p className="mt-1 flex items-start gap-1.5 text-xs text-zinc-400">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{incident.address || "Location coordinates logged"}</span>
          </p>
          <p className="mt-1 text-xs text-zinc-500 font-medium">
            Type: {formatLabel(incident.incident_type)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDate(incident.created_at)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${severityStyle(incident.severity)}`}>
          {formatLabel(incident.severity)}
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${statusStyle(incident.status)}`}>
          {formatLabel(incident.status)}
        </span>
        <ArrowRight className="ml-auto h-4 w-4 text-zinc-600 transition group-hover:text-white sm:ml-1" />
      </div>
    </Link>
  );
}