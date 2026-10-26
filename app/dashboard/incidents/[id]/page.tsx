
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Users,
  Clock,
  ShieldAlert,
  Activity,
  CheckCircle2,
  Truck,
  Search,
  FileText,
  CalendarDays,
  HeartPulse,
} from "lucide-react";
import IncidentStatusActions from "@/components/IncidentStatusActions";
import ResourceAssignmentBox from "@/components/ResourceAssignmentBox";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function IncidentDetailsPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;

  if (!id) notFound();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role?.toUpperCase() || "CITIZEN";

  const { data: incident, error } = await supabase
    .from("incidents")
    .select(`
      *,
      resources (
        id,
        name,
        resource_type,
        status
      )
    `)
    .eq("id", id)
    .single();

  if (error || !incident) {
    console.error("Supabase Incident Fetch Error:", error);
    notFound();
  }

  const isAuthorizedResponderOrAdmin = [
    "ADMIN",
    "OPERATOR",
    "RESPONDER",
  ].includes(role);

  const isOwner = incident.reported_by === user.id;

  const status = String(incident.status ?? "REPORTED").toUpperCase();

  const isClosed = ["RESOLVED", "CANCELLED"].includes(status);

  const backUrl =
    role === "RESPONDER"
      ? "/responder"
      : role === "ADMIN"
        ? "/incidents"
        : "/dashboard";

  const [availableResResult, assignedResResult] = await Promise.all([
    supabase
      .from("resources")
      .select("id, name, resource_type, status")
      .eq("status", "AVAILABLE"),

    supabase
      .from("resources")
      .select("id, name, resource_type, status")
      .eq("assigned_incident_id", id),
  ]);

  const availableResources = availableResResult.data ?? [];
  const assignedResources = assignedResResult.data ?? [];

  const resourceData = incident.resources as
    | {
        id: string;
        name: string;
        resource_type: string;
        status: string;
      }
    | {
        id: string;
        name: string;
        resource_type: string;
        status: string;
      }[]
    | null;

  const dispatchedResource = Array.isArray(resourceData)
    ? resourceData[0]
    : resourceData;

  const severity = String(incident.severity ?? "MEDIUM").toUpperCase();

  const severityStyle =
    severity === "CRITICAL" || severity === "HIGH"
      ? "border-red-200 bg-red-50 text-red-700"
      : severity === "LOW"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

  const statusStyle =
    status === "RESOLVED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "CANCELLED"
        ? "border-slate-200 bg-slate-100 text-slate-600"
        : status === "IN_PROGRESS" || status === "DISPATCHED"
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-amber-200 bg-amber-50 text-amber-700";

  const reportedAt = incident.created_at
    ? new Date(incident.created_at).toLocaleString()
    : "Unavailable";

  return (
    <main className="incident-page relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/70 px-4 py-6 text-slate-800 sm:px-7 sm:py-9 lg:px-10">
      <style>{`
        @keyframes incidentFadeUp {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes incidentFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        @keyframes incidentPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.10); }
          50% { box-shadow: 0 0 0 7px rgba(37, 99, 235, 0); }
        }

        .incident-animate {
          animation: incidentFadeUp 650ms cubic-bezier(.2,.7,.2,1) both;
        }

        .incident-delay-1 { animation-delay: 80ms; }
        .incident-delay-2 { animation-delay: 160ms; }
        .incident-delay-3 { animation-delay: 240ms; }
        .incident-delay-4 { animation-delay: 320ms; }

        .incident-card {
          border: 1px solid rgba(226, 232, 240, .9);
          background: rgba(255, 255, 255, .88);
          box-shadow: 0 8px 30px rgba(30, 64, 175, .045);
          backdrop-filter: blur(14px);
          transition:
            transform 250ms ease,
            box-shadow 250ms ease,
            border-color 250ms ease;
        }

        .incident-card:hover {
          transform: translateY(-3px);
          border-color: rgba(147, 197, 253, .9);
          box-shadow: 0 16px 36px rgba(30, 64, 175, .09);
        }

        .incident-icon {
          transition: transform 250ms ease;
        }

        .incident-card:hover .incident-icon {
          transform: scale(1.08);
        }

        @media (prefers-reduced-motion: reduce) {
          .incident-animate,
          .incident-delay-1,
          .incident-delay-2,
          .incident-delay-3,
          .incident-delay-4 {
            animation: none;
          }

          .incident-card,
          .incident-icon {
            transition: none;
          }

          .incident-card:hover {
            transform: none;
          }
        }
      `}</style>

      {/* Soft background decorations */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-28 h-96 w-96 rounded-full bg-sky-200/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-7xl">
        {/* Navigation */}
        <div className="incident-animate mb-7 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={backUrl}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <ArrowLeft
              size={17}
              className="transition-transform group-hover:-translate-x-1"
            />
            Back to{" "}
            {role === "RESPONDER"
              ? "Response Center"
              : role === "ADMIN"
                ? "Incidents"
                : "Dashboard"}
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-blue-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            ResQAI Incident Tracking
          </div>
        </div>

        {/* Incident header */}
        <section className="incident-animate incident-delay-1 relative mb-7 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-white via-white to-blue-50 p-5 shadow-[0_12px_45px_rgba(30,64,175,0.07)] sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-blue-100/70 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-700">
                <ShieldAlert size={14} />
                {isOwner
                  ? "Your Reported Emergency"
                  : "Incident Tracking Review"}
              </div>

              <h1 className="break-words text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {incident.title || "Emergency Incident"}
              </h1>

              <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
                <FileText size={15} className="text-blue-500" />
                Incident ID:
                <span className="break-all font-mono font-semibold text-slate-700">
                  {incident.id}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-wider ${severityStyle}`}
              >
                <Activity size={15} />
                {severity} PRIORITY
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-wider ${statusStyle}`}
              >
                {isClosed ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <Clock size={15} />
                )}
                {status.replaceAll("_", " ")}
              </span>
            </div>
          </div>
        </section>

        {/* Main layout */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,.75fr)]">
          <section className="min-w-0 space-y-6">
            {/* Incident information */}
            <div className="incident-card incident-animate incident-delay-1 rounded-3xl p-5 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="incident-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <FileText size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Incident Information
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Report details and emergency information
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Description
                </p>
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {incident.description || "No description provided."}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Info
                  icon={<Activity size={18} />}
                  label="Incident type"
                  value={
                    incident.incident_type?.replaceAll("_", " ") ||
                    "GENERAL"
                  }
                />

                <Info
                  icon={<CalendarDays size={18} />}
                  label="Reported at"
                  value={reportedAt}
                />

                <Info
                  icon={<MapPin size={18} />}
                  label="Address"
                  value={
                    incident.address ||
                    "Coordinates logged via PostGIS point"
                  }
                />

                <Info
                  icon={<Users size={18} />}
                  label="People affected"
                  value={String(
                    incident.affected_people ?? "Not specified"
                  )}
                />

                <Info
                  icon={<HeartPulse size={18} />}
                  label="Medical assistance"
                  value={incident.medical_required ? "Required" : "Not specified"}
                />

                <Info
                  icon={<Activity size={18} />}
                  label="Evacuation"
                  value={
                    incident.evacuation_required
                      ? "Required"
                      : "Not specified"
                  }
                />
              </div>
            </div>

            {/* AI analysis */}
            {incident.ai_analysis && (
              <div className="incident-card incident-animate incident-delay-2 rounded-3xl p-5 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="incident-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                    <ShieldAlert size={21} />
                  </div>

                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      AI Classification & Intelligence
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Analysis recorded for this incident
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-blue-50/60 p-4 sm:p-5">
                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                    {typeof incident.ai_analysis === "string"
                      ? incident.ai_analysis
                      : JSON.stringify(incident.ai_analysis, null, 2)}
                  </p>

                  {incident.ai_confidence != null && (
                    <div className="mt-5 border-t border-indigo-100 pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Confidence Score
                        </span>
                        <span className="text-lg font-black text-indigo-700">
                          {Number(incident.ai_confidence) <= 1
                            ? `${(
                                Number(incident.ai_confidence) * 100
                              ).toFixed(1)}%`
                            : `${Number(incident.ai_confidence).toFixed(1)}%`}
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-700"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                Number(incident.ai_confidence) <= 1
                                  ? Number(incident.ai_confidence) * 100
                                  : Number(incident.ai_confidence)
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dispatch status */}
            <div className="incident-card incident-animate incident-delay-2 rounded-3xl p-5 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="incident-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                  <Truck size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Emergency Dispatch
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Resource association for this incident
                  </p>
                </div>
              </div>

              {dispatchedResource ? (
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="incident-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <Truck size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                          Associated Resource
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                          {dispatchedResource.status || "ASSIGNED"}
                        </span>
                      </div>

                      <h3 className="mt-2 break-words text-base font-extrabold text-slate-900">
                        {dispatchedResource.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {String(
                          dispatchedResource.resource_type || "Emergency unit"
                        ).replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600">
                    A resource is associated with this incident. Its displayed
                    status comes from the resource record.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="incident-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <Search size={22} />
                    </div>

                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                        No Associated Resource
                      </span>
                      <h3 className="mt-2 text-base font-extrabold text-slate-900">
                        Awaiting Resource Assignment
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        No resource is currently linked to this incident.
                        Authorized staff can review available resources below.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Resource assignment */}
            {isAuthorizedResponderOrAdmin && !isClosed && (
              <div className="incident-card incident-animate incident-delay-3 rounded-3xl p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-3 px-1">
                  <div className="incident-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Resource Assignment
                    </h2>
                    <p className="text-sm text-slate-500">
                      Manage resources for this incident
                    </p>
                  </div>
                </div>

                <ResourceAssignmentBox
                  incidentId={incident.id}
                  incidentType={incident.incident_type}
                  medicalRequired={incident.medical_required}
                  evacuationRequired={incident.evacuation_required}
                  availableResources={availableResources}
                  assignedResources={assignedResources}
                />
              </div>
            )}
          </section>

          {/* Right sidebar */}
          <aside className="incident-animate incident-delay-3 min-w-0 space-y-6 lg:sticky lg:top-6">
            <div className="incident-card rounded-3xl p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="incident-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Activity size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Response Status
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Incident progress and actions
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current Status
                </p>

                <p className="mt-2 break-words text-xl font-black text-blue-800">
                  {status.replaceAll("_", " ")}
                </p>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className={`h-full rounded-full ${
                      isClosed
                        ? "w-full bg-emerald-500"
                        : status === "IN_PROGRESS"
                          ? "w-2/3 bg-blue-500"
                          : status === "DISPATCHED"
                            ? "w-1/2 bg-blue-500"
                            : "w-1/4 bg-amber-400"
                    }`}
                  />
                </div>
              </div>

              {isAuthorizedResponderOrAdmin ? (
                !isClosed ? (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <h3 className="mb-3 text-sm font-bold text-slate-800">
                      Update Incident
                    </h3>

                    <div className="incident-actions-theme">
                      <IncidentStatusActions
                        incidentId={incident.id}
                        currentStatus={incident.status}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <CheckCircle2
                      size={20}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">
                        Incident Closed
                      </p>
                      <p className="mt-1 text-xs leading-5 text-emerald-700">
                        This incident has been resolved or cancelled. Status
                        actions are no longer available.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-sm leading-6 text-slate-600">
                    Your report is registered with the ResQAI command center.
                    This page displays the latest incident information
                    available when it was loaded.
                  </p>
                </div>
              )}
            </div>

            {/* Report summary */}
            <div className="incident-card incident-animate incident-delay-4 rounded-3xl p-5 sm:p-6">
              <h3 className="text-base font-extrabold text-slate-900">
                Incident Summary
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Quick reference
              </p>

              <div className="mt-5 space-y-4">
                <SummaryRow
                  label="Priority"
                  value={severity}
                  dot={
                    severity === "HIGH" || severity === "CRITICAL"
                      ? "bg-red-500"
                      : severity === "LOW"
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                  }
                />

                <SummaryRow
                  label="Resource linked"
                  value={dispatchedResource ? "Yes" : "No"}
                  dot={
                    dispatchedResource ? "bg-emerald-500" : "bg-slate-400"
                  }
                />

                <SummaryRow
                  label="Incident status"
                  value={isClosed ? "Closed" : "Active"}
                  dot={isClosed ? "bg-emerald-500" : "bg-blue-500"}
                />

                <SummaryRow
                  label="AI analysis"
                  value={incident.ai_analysis ? "Available" : "Unavailable"}
                  dot={incident.ai_analysis ? "bg-indigo-500" : "bg-slate-400"}
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-10 flex flex-col gap-3 border-t border-slate-200/80 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} ResQAI. All rights reserved.
          </p>

          <p>
            Developed by{" "}
            <a
              href="https://github.com/dev-prashant-kumar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-blue-600 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-800"
            >
              Shant
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="group flex min-w-0 items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-colors hover:border-blue-100 hover:bg-blue-50/40">
      <span className="incident-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 break-words text-sm font-bold capitalize leading-6 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-500">{label}</span>

      <span className="inline-flex items-center gap-2 text-right text-xs font-extrabold text-slate-700">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        {value}
      </span>
    </div>
  );
}
