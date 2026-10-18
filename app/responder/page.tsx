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

  if (role === "OPERATOR") return "ADMIN";
  if (role === "ADMIN") return "ADMIN";
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
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";
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
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconStyle}`}
        >
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

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, phone")
    .eq("id", user.id)
    .maybeSingle();

  const role = normalizeRole(profile?.role);

  // Keep this workspace restricted to responder accounts.
  if (role !== "RESPONDER") {
    redirect(role === "ADMIN" ? "/incidents" : "/dashboard");
  }

  // Fetch metrics and active incidents concurrently from Supabase tables
  const [totalResult, criticalResult, recentResult, resourcesResult] = await Promise.all([
    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("incidents")
      .select("id", { count: "exact", head: true })
      .eq("severity", "CRITICAL"),

    supabase
      .from("incidents")
      .select(
        "id, title, incident_type, severity, status, created_at, address"
      )
      .order("created_at", { ascending: false })
      .limit(50),

    supabase
      .from("resources")
      .select("id", { count: "exact", head: true })
      .eq("status", "AVAILABLE"),
  ]);

  const incidents = recentResult.data ?? [];

  const activeStatuses = [
    "OPEN",
    "REPORTED",
    "PENDING",
    "ASSIGNED",
    "IN_PROGRESS",
  ];

  const activeRecentCount = incidents.filter((incident) =>
    activeStatuses.includes(String(incident.status ?? "").toUpperCase())
  ).length;

  const resolvedRecentCount = incidents.filter((incident) =>
    ["RESOLVED", "CLOSED"].includes(
      String(incident.status ?? "").toUpperCase()
    )
  ).length;

  const queryError =
    totalResult.error ||
    criticalResult.error ||
    recentResult.error;

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
    <main className="min-h-screen bg-[#060709] pb-24 text-zinc-100 antialiased selection:bg-red-500 selection:text-white md:pb-0">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#060709]/90 px-4 py-3.5 backdrop-blur-xl sm:px-6">
        <Link href="/responder" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/30 bg-red-600/20 text-red-400">
            <ShieldAlert className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-sm font-bold text-white">
              ResQAI Response Center
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Field Unit Telemetry Active
            </p>
          </div>
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
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        {/* Page introduction */}
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-red-950/40 via-[#101115] to-[#0a0b0f] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-red-600/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="mb-3 inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-red-300">
                Authorized Field Unit
              </span>

              <h2 className="text-2xl font-black text-white sm:text-3xl">
                Welcome back, {displayName}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
                Your tactical terminal is linked to real-time regional dispatch. Coordinate response units, manage active crisis queues, and execute rapid on-ground protocols.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Node: IND-SEC-4
                </span>
                <span>·</span>
                <span>Verified ID: {user.email}</span>
              </div>
            </div>

            <Link
              href="/responder/map"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-red-500/30 hover:bg-red-500/10"
            >
              Full Incident Ledger
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Dynamic Status Bar */}
        <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#101115] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Live Incident Stream Synced
              </h3>
              <p className="mt-0.5 text-xs text-zinc-400">
                PostGIS spatial indexing and automated severity assessment pipelines are fully operational.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
              {resourcesResult.count ?? 0} Units Available for Dispatch
            </span>
          </div>
        </section>

        {/* Query errors */}
        {(profileError || queryError) && (
          <section
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-amber-300">
                Telemetry Warning: Partial Data Sync
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                Some auxiliary telemetry feeds experienced minor latency. Operating in resilient offline-fallback mode.
              </p>
            </div>
          </section>
        )}

        {/* Metrics */}
        <section>
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">
              Emergency Telemetry Overview
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Real-time operational metrics across active response zones.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Total Incidents Logged"
              value={totalResult.error ? "—" : (totalResult.count ?? 0)}
              description="Stored in regional database"
              icon={<Activity className="h-4 w-4" />}
              iconStyle="border-red-500/20 bg-red-500/10 text-red-400"
            />

            <MetricCard
              title="Critical Priority"
              value={
                criticalResult.error ? "—" : (criticalResult.count ?? 0)
              }
              description="Requiring immediate intervention"
              icon={<ShieldAlert className="h-4 w-4" />}
              iconStyle="border-rose-500/20 bg-rose-500/10 text-rose-400"
            />

            <MetricCard
              title="Active Queue"
              value={recentResult.error ? "—" : activeRecentCount}
              description="Pending or in-progress status"
              icon={<Radio className="h-4 w-4" />}
              iconStyle="border-amber-500/20 bg-amber-500/10 text-amber-400"
            />

            <MetricCard
              title="Resolved Incidents"
              value={recentResult.error ? "—" : resolvedRecentCount}
              description="Successfully closed operations"
              icon={<CheckCircle2 className="h-4 w-4" />}
              iconStyle="border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
            />
          </div>
        </section>

        {/* Incident queue */}
        <section className="rounded-3xl border border-white/10 bg-[#101115] p-5 shadow-xl sm:p-6">
          <div className="mb-5 flex flex-col gap-3 border-b border-white/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-white">
                <Truck className="h-5 w-5 text-red-400" />
                Active Emergency Incident Stream
              </h3>
              <p className="mt-1 text-xs text-zinc-400">
                Live feed fetched directly from the database incidents table.
              </p>
            </div>

            <span className="w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-zinc-400 font-mono">
              {incidents.length} Records Loaded
            </span>
          </div>

          {recentResult.error ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
              <h4 className="text-sm font-semibold text-zinc-200">
                Stream Temporarily Unavailable
              </h4>
              <p className="mt-2 text-xs text-zinc-400">
                Unable to retrieve live incident logs at the moment. Re-establishing secure connection...
              </p>
            </div>
          ) : incidents.length > 0 ? (
            <div className="space-y-3">
              {incidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/dashboard/incidents/${incident.id}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-white/5 bg-black/20 p-4 transition hover:border-red-500/30 hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
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
                        <span>
                          {incident.address || "Location coordinates logged"}
                        </span>
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
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${severityStyle(incident.severity)}`}
                    >
                      {formatLabel(incident.severity)}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase ${statusStyle(incident.status)}`}
                    >
                      {formatLabel(incident.status)}
                    </span>

                    <ArrowRight className="ml-auto h-4 w-4 text-zinc-600 transition group-hover:text-white sm:ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-12 text-center">
              <Radio className="mx-auto mb-3 h-9 w-9 text-zinc-600 animate-pulse" />
              <h4 className="text-sm font-semibold text-zinc-200">
                No Active Incidents in Queue
              </h4>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-zinc-500">
                All regional sectors are currently stable. Newly reported incidents will appear here instantaneously.
              </p>
            </div>
          )}
        </section>

        {/* Responder guidance */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-[#101115] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Critical Incident Protocol
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              For incidents marked with CRITICAL severity, coordinate immediately with regional dispatch units to secure the perimeter and deploy life-saving medical resources.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#101115] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">
              PostGIS Spatial Mapping
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Incident locations are processed via PostGIS spatial point data to calculate optimal transit vectors and resource deployment radiuses.
            </p>
          </div>
        </section>

        <footer className="border-t border-white/10 py-5 text-center text-xs text-zinc-500">
          ResQAI · Responder workspace v2.4
        </footer>
      </div>
    </main>
  );
}