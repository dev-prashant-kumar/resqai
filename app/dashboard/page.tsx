import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  FileWarning,
  HeartPulse,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  Siren,
  Users,
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
  REPORTED: "bg-blue-50 text-blue-700",
  ANALYZING: "bg-violet-50 text-violet-700",
  VERIFIED: "bg-emerald-50 text-emerald-700",
  ASSIGNED: "bg-indigo-50 text-indigo-700",
  IN_PROGRESS: "bg-amber-50 text-amber-700",
  RESOLVED: "bg-green-50 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const severityStyles: Record<string, string> = {
  LOW: "bg-green-50 text-green-700",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
};

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

async function signOutAction() {
  "use server";

  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}

export default async function CitizenDashboard() {
  const supabase = await createClient();

  // 1. Verify the authenticated user.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Check whether this user owns a registered government organization.
  //
  // Organization registration currently creates a row in
  // responder_organizations, while the profile role may remain CITIZEN.
  // Therefore, check organization ownership before loading the profile role.
  //
  // This check only changes dashboard routing. It does not grant operational
  // responder permissions or approve the organization's application.
  const {
    data: organization,
    error: organizationError,
  } = await supabase
    .from("responder_organizations")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  // Redirect organization owners to their organization dashboard.
  // The responder dashboard is responsible for showing the verification
  // status and restricting unapproved organizations from operational actions.
  if (!organizationError && organization) {
    redirect("/responder");
  }

  // 3. Load the authenticated user's profile.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-lg">
          <ShieldCheck className="mx-auto mb-4 text-blue-600" size={42} />

          <h1 className="text-xl font-bold text-slate-900">
            Profile unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            We couldn't load your account profile. Please sign in again or
            contact support if the problem continues.
          </p>

          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Return to login
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 4. Preserve routing for other authorized account roles.
  if (profile.role === "RESPONDER") {
    redirect("/responder");
  }

  if (profile.role === "OPERATOR") {
    redirect("/operator");
  }

  if (profile.role === "ADMIN") {
    redirect("/admin");
  }

  // Only citizen accounts should continue to the citizen dashboard.
  if (profile.role !== "CITIZEN") {
    redirect("/login");
  }

  // 5. Fetch only the incidents reported by this citizen.
  const { data: incidentData, error: incidentsError } = await supabase
    .from("incidents")
    .select(
      "id, title, description, incident_type, severity, status, address, created_at, affected_people"
    )
    .eq("reported_by", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const incidents = (incidentData ?? []) as Incident[];

  const activeStatuses = [
    "REPORTED",
    "ANALYZING",
    "VERIFIED",
    "ASSIGNED",
    "IN_PROGRESS",
  ];

  const activeCount = incidents.filter((incident) =>
    activeStatuses.includes(incident.status)
  ).length;

  const resolvedCount = incidents.filter(
    (incident) => incident.status === "RESOLVED"
  ).length;

  const firstName = profile.full_name?.trim().split(/\s+/)[0] || "there";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Soft animated blue background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-0 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-[650px] h-72 w-72 rounded-full bg-sky-200/20 blur-3xl"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
              <HeartPulse size={25} />
            </span>

            <span>
              <span className="block text-xl font-extrabold tracking-tight">
                ResQAI
              </span>

              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:block">
                Citizen Dashboard
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-slate-500 sm:block">
              Welcome,{" "}
              <span className="font-semibold text-slate-800">
                {firstName}
              </span>
            </span>

            <Link
              href="/report"
              aria-label="Report an emergency"
              className="group flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 sm:px-4"
            >
              <Plus size={19} />
              <span className="hidden sm:inline">Report Emergency</span>
              <span className="sm:hidden">Report</span>
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
              >
                <LogOut size={19} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        {/* Welcome */}
        <section className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            YOUR COMMUNITY SAFETY HUB
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            Good to see you, {firstName}.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Report an emergency, check the progress of your reports, and find
            important safety information.
          </p>
        </section>

        {/* Emergency banner */}
        <section className="group relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-blue-600 to-sky-500 p-5 text-white shadow-xl shadow-blue-900/15 transition-all duration-500 hover:shadow-[0_20px_55px_rgba(37,99,235,0.30)] sm:p-8">
          <div
            aria-hidden="true"
            className="absolute -right-12 -top-20 h-64 w-64 animate-pulse rounded-full border border-white/20 transition-transform duration-700 group-hover:scale-110"
          />

          <div
            aria-hidden="true"
            className="absolute -right-4 -top-12 h-44 w-44 rounded-full border border-white/20 transition-transform duration-700 group-hover:scale-110"
          />

          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-100">
                <Siren size={19} />
                NEED EMERGENCY ASSISTANCE?
              </div>

              <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                Every second matters.
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-blue-100">
                Submit an emergency report with the incident details and
                location so authorized personnel can review it.
              </p>
            </div>

            <Link
              href="/report"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50"
            >
              <Plus size={19} />
              Report an Emergency
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* Overview cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="group relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_14px_35px_rgba(37,99,235,0.12)] after:pointer-events-none after:absolute after:left-[-100%] after:top-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-transparent after:via-blue-500 after:to-transparent after:transition-[left] after:duration-700 hover:after:left-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Reports Loaded
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileWarning size={21} />
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold">{incidents.length}</p>

            <p className="mt-1 text-xs text-slate-400">
              Latest reports displayed below
            </p>
          </div>

          <div className="group relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_14px_35px_rgba(37,99,235,0.12)] after:pointer-events-none after:absolute after:left-[-100%] after:top-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-transparent after:via-blue-500 after:to-transparent after:transition-[left] after:duration-700 hover:after:left-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Active Reports
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={21} />
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold">{activeCount}</p>

            <p className="mt-1 text-xs text-slate-400">
              Among the reports currently loaded
            </p>
          </div>

          <div className="group relative isolate overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_14px_35px_rgba(37,99,235,0.12)] after:pointer-events-none after:absolute after:left-[-100%] after:top-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-transparent after:via-blue-500 after:to-transparent after:transition-[left] after:duration-700 hover:after:left-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-500">
                Resolved Reports
              </span>

              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <CheckCircle2 size={21} />
              </span>
            </div>

            <p className="mt-4 text-3xl font-extrabold">{resolvedCount}</p>

            <p className="mt-1 text-xs text-slate-400">
              Among the reports currently loaded
            </p>
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          {/* Recent reports */}
          <section className="group relative min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-[0_18px_45px_rgba(37,99,235,0.10)] after:pointer-events-none after:absolute after:left-[-100%] after:top-0 after:z-10 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-transparent after:via-blue-500 after:to-transparent after:transition-[left] after:duration-700 hover:after:left-0">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-bold">My Recent Reports</h2>

                <p className="mt-1 text-sm text-slate-500">
                  Review the latest emergency reports linked to your account.
                </p>
              </div>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Activity size={21} />
              </span>
            </div>

            {incidentsError ? (
              <div className="p-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-900">
                    Reports couldn't be loaded.
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-800">
                    Check your Supabase incident-table permissions and Row
                    Level Security policies, then refresh this page.
                  </p>
                </div>
              </div>
            ) : incidents.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <FileWarning size={27} />
                </span>

                <h3 className="mt-4 font-bold text-slate-900">
                  No reports to display yet
                </h3>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                  Your submitted emergency reports will appear here when they
                  are available.
                </p>

                <Link
                  href="/report"
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                >
                  <Plus size={17} />
                  Create a Report
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {incidents.map((incident) => (
                  <article
                    key={incident.id}
                    className="group relative p-5 transition-all duration-300 hover:bg-blue-50/50 sm:p-6 before:absolute before:bottom-4 before:left-0 before:top-4 before:w-0.5 before:rounded-full before:bg-blue-500 before:opacity-0 before:transition-opacity hover:before:opacity-100"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="break-words font-bold text-slate-900">
                          {incident.title}
                        </h3>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatLabel(incident.incident_type)} ·{" "}
                          {formatDate(incident.created_at)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                            severityStyles[incident.severity] ??
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatLabel(incident.severity)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                            statusStyles[incident.status] ??
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatLabel(incident.status)}
                        </span>
                      </div>
                    </div>

                    {incident.description && (
                      <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-slate-600">
                        {incident.description}
                      </p>
                    )}

                    {incident.address && (
                      <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
                        <MapPin
                          size={15}
                          className="mt-0.5 shrink-0 text-blue-500"
                        />

                        <span className="break-words">{incident.address}</span>
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* Safety sidebar */}
          <aside className="space-y-5">
            <section className="group relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_14px_35px_rgba(37,99,235,0.12)] after:pointer-events-none after:absolute after:left-[-100%] after:top-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-transparent after:via-blue-500 after:to-transparent after:transition-[left] after:duration-700 hover:after:left-0 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck size={23} />
                </span>

                <div>
                  <h2 className="font-bold">Safety First</h2>

                  <p className="text-xs text-slate-500">
                    Important reminders
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                <li className="flex items-start gap-3">
                  <CheckCircle2
                    size={17}
                    className="mt-1 shrink-0 text-blue-600"
                  />
                  Provide an accurate incident location.
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2
                    size={17}
                    className="mt-1 shrink-0 text-blue-600"
                  />
                  Describe the situation clearly and honestly.
                </li>

                <li className="flex items-start gap-3">
                  <CheckCircle2
                    size={17}
                    className="mt-1 shrink-0 text-blue-600"
                  />
                  Keep yourself and others away from immediate danger.
                </li>
              </ul>
            </section>

            <section className="group relative isolate overflow-hidden rounded-3xl border border-blue-100 bg-blue-50/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_14px_35px_rgba(37,99,235,0.12)] after:pointer-events-none after:absolute after:left-[-100%] after:top-0 after:h-[2px] after:w-full after:bg-gradient-to-r after:from-transparent after:via-blue-500 after:to-transparent after:transition-[left] after:duration-700 hover:after:left-0 sm:p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <Bell size={22} />
              </div>

              <h2 className="mt-4 font-bold text-slate-900">
                Need urgent help?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                If someone is in immediate danger, contact the appropriate
                local emergency service. Do not wait for an online report to
                be reviewed.
              </p>

              <div className="mt-4 flex items-center gap-2 text-xs font-medium text-blue-700">
                <Users size={16} />
                Emergency reports require human review.
              </div>
            </section>
          </aside>
        </div>

        <footer className="py-8 text-center text-xs text-slate-400">
          ResQAI · Emergency information and community safety
        </footer>
      </div>
    </main>
  );
}
