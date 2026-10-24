
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  MapPin,
  Search,
  ShieldAlert,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

type Incident = {
  id: string;
  title: string | null;
  description: string | null;
  incident_type: string;
  severity: string;
  status: string;
  address: string | null;
  affected_people: number | null;
  created_at: string;
};

type SearchParams = {
  search?: string;
  severity?: string;
  type?: string;
  status?: string;
};

const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TYPES = [
  "FLOOD",
  "FIRE",
  "ROAD_ACCIDENT",
  "MEDICAL",
  "EVACUATION",
  "OTHER",
];
const STATUSES = [
  "REPORTED",
  "ANALYZING",
  "VERIFIED",
  "ASSIGNED",
  "IN_PROGRESS",
  "RESOLVED",
  "CANCELLED",
];

function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function severityStyle(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "border-red-500/30 bg-red-500/15 text-red-400";
    case "HIGH":
      return "border-orange-500/30 bg-orange-500/15 text-orange-400";
    case "MEDIUM":
      return "border-yellow-500/30 bg-yellow-500/15 text-yellow-400";
    default:
      return "border-emerald-500/30 bg-emerald-500/15 text-emerald-400";
  }
}

function statusStyle(status: string) {
  switch (status) {
    case "RESOLVED":
      return "bg-emerald-500/10 text-emerald-400";
    case "CANCELLED":
      return "bg-zinc-700/60 text-zinc-400";
    case "IN_PROGRESS":
    case "ASSIGNED":
      return "bg-blue-500/10 text-blue-400";
    case "VERIFIED":
      return "bg-purple-500/10 text-purple-400";
    default:
      return "bg-amber-500/10 text-amber-400";
  }
}

export default async function IncidentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const search = (params.search ?? "").trim().slice(0, 100);
  const severity = params.severity ?? "";
  const type = params.type ?? "";
  const status = params.status ?? "";

  // Authenticate the current user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Only operators and administrators can access this page.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#09090b] px-6 text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-400" size={36} />
          <h1 className="text-xl font-bold">Profile unavailable</h1>
          <p className="mt-2 text-sm text-zinc-400">
            We could not load your user profile. Please sign in again or
            contact your administrator.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-lg bg-red-600 px-5 py-3 font-semibold hover:bg-red-500"
          >
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  const role = String(profile.role).toUpperCase();

  if (role !== "OPERATOR" && role !== "ADMIN") {
    redirect(role === "RESPONDER" ? "/responder" : "/dashboard");
  }

  // Fetch incidents. Supabase RLS still controls which rows are visible.
  let query = supabase
    .from("incidents")
    .select(
      "id, title, description, incident_type, severity, status, address, affected_people, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    // Escape PostgREST filter punctuation before using the search term.
    const safeSearch = search.replace(/[,%()_*\\]/g, " ");
    query = query.or(
      `title.ilike.%${safeSearch}%,address.ilike.%${safeSearch}%`
    );
  }

  if (SEVERITIES.includes(severity)) {
    query = query.eq("severity", severity);
  }

  if (TYPES.includes(type)) {
    query = query.eq("incident_type", type);
  }

  if (STATUSES.includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  const incidents = (data ?? []) as Incident[];

  const activeCount = incidents.filter(
    (incident) =>
      !["RESOLVED", "CANCELLED"].includes(incident.status)
  ).length;

  const criticalCount = incidents.filter(
    (incident) => incident.severity === "CRITICAL"
  ).length;

  const resolvedCount = incidents.filter(
    (incident) => incident.status === "RESOLVED"
  ).length;

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                <ClipboardList className="text-red-400" size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Incident Management
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  Monitor and review emergency reports.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-400 sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {role} ACCESS
          </div>
        </header>

        {/* Summary cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Incidents shown"
            value={incidents.length}
            icon={<ClipboardList size={20} />}
            color="text-blue-400"
          />
          <SummaryCard
            title="Active incidents"
            value={activeCount}
            icon={<AlertTriangle size={20} />}
            color="text-orange-400"
          />
          <SummaryCard
            title="Critical incidents"
            value={criticalCount}
            icon={<ShieldAlert size={20} />}
            color="text-red-400"
          />
        </section>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <form action="/incidents" method="GET">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="lg:col-span-2">
                <label
                  htmlFor="search"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Search incidents
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3">
                  <Search size={18} className="shrink-0 text-zinc-500" />
                  <input
                    id="search"
                    name="search"
                    defaultValue={search}
                    placeholder="Search title or address..."
                    maxLength={100}
                    className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <FilterSelect
                name="severity"
                label="Severity"
                value={severity}
                options={SEVERITIES}
              />

              <FilterSelect
                name="type"
                label="Incident type"
                value={type}
                options={TYPES}
              />

              <FilterSelect
                name="status"
                label="Status"
                value={status}
                options={STATUSES}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-red-500"
              >
                <Search size={16} />
                Apply filters
              </button>
              <Link
                href="/incidents"
                className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-zinc-300 transition hover:bg-white/5"
              >
                Clear filters
              </Link>
            </div>
          </form>
        </section>

        {/* Incidents table */}
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <div className="flex flex-col justify-between gap-2 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">Emergency reports</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Showing up to 200 matching reports, newest first.
              </p>
            </div>
            <span className="text-sm text-zinc-400">
              {incidents.length} result{incidents.length === 1 ? "" : "s"}
            </span>
          </div>

          {error ? (
            <div className="p-8 text-center">
              <ShieldAlert className="mx-auto mb-3 text-red-400" size={30} />
              <h3 className="font-semibold">Unable to load incidents</h3>
              <p className="mt-2 text-sm text-zinc-400">
                {error.message}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Check your Supabase SELECT policy and database connection.
              </p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-12 text-center">
              <ClipboardList
                className="mx-auto mb-4 text-zinc-600"
                size={36}
              />
              <h3 className="font-semibold">No incidents found</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Try different filters, or check again when reports arrive.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.02] text-xs uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-5 py-4 font-medium">Incident</th>
                      <th className="px-5 py-4 font-medium">Severity</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Affected</th>
                      <th className="px-5 py-4 font-medium">Reported</th>
                      <th className="px-5 py-4 text-right font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {incidents.map((incident) => (
                      <tr
                        key={incident.id}
                        className="transition hover:bg-white/[0.025]"
                      >
                        <td className="max-w-xs px-5 py-4">
                          <p className="truncate font-semibold">
                            {incident.title || "Untitled incident"}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {formatLabel(incident.incident_type)}
                          </p>
                          <p className="mt-2 flex items-center gap-1 truncate text-xs text-zinc-500">
                            <MapPin size={12} className="shrink-0" />
                            {incident.address || "Location not provided"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${severityStyle(incident.severity)}`}
                          >
                            {formatLabel(incident.severity)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(incident.status)}`}
                          >
                            {formatLabel(incident.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-zinc-300">
                          {incident.affected_people ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-zinc-400">
                          {formatDate(incident.created_at)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/incidents/${incident.id}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                          >
                            View
                            <ArrowRight size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-3 p-3 md:hidden">
                {incidents.map((incident) => (
                  <article
                    key={incident.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityStyle(incident.severity)}`}
                      >
                        {formatLabel(incident.severity)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${statusStyle(incident.status)}`}
                      >
                        {formatLabel(incident.status)}
                      </span>
                    </div>
                    <h3 className="mt-3 font-semibold">
                      {incident.title || "Untitled incident"}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-400">
                      {formatLabel(incident.incident_type)}
                    </p>
                    <p className="mt-3 flex items-start gap-2 text-sm text-zinc-400">
                      <MapPin size={15} className="mt-0.5 shrink-0" />
                      {incident.address || "Location not provided"}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Affected people: {incident.affected_people ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatDate(incident.created_at)}
                    </p>
                    <Link
                      href={`/dashboard/incidents/${incident.id}`}
                      className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold hover:bg-red-500"
                    >
                      View incident
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <p className="mt-5 text-xs leading-5 text-zinc-600">
          ResQAI incident monitoring · Results are limited to 200 reports per
          search. Incident visibility and access are enforced by Supabase
          authentication and Row Level Security.
        </p>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{title}</p>
        <span className={color}>{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: string[];
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={value}
        className="w-full rounded-xl border border-white/10 bg-[#111114] px-3 py-3 text-sm text-white outline-none focus:border-red-500/60"
      >
        <option value="">All {label.toLowerCase()}s</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </div>
  );
}
