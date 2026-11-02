
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
  FileText,
  CalendarDays,
  HeartPulse,
  ClipboardCheck,
  AlertCircle,
  Building2,
  UserCheck,
} from "lucide-react";

import IncidentStatusActions from "@/components/IncidentStatusActions";
import ResourceAssignmentBox from "@/components/ResourceAssignmentBox";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

interface Resource {
  id: string;
  name: string;
  resource_type: string;
  status: string;
}

interface IncidentIntelligence {
  analysis?: {
    detected_type?: string;
    severity?: string;
    recommended_resource_types?: string[];
    requires_human_review?: boolean;
    review_status?: string;
    analysis_method?: string;
  };
  responsePlan?: {
    priority?: string;
    immediate_actions?: string[];
    recommended_resources?: string[];
    operator_notes?: string[];
  };
}

const severityStyles: Record<string, string> = {
  LOW: "border-emerald-200 bg-emerald-50 text-emerald-700",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-red-200 bg-red-50 text-red-700",
};

const statusStyles: Record<string, string> = {
  REPORTED: "border-amber-200 bg-amber-50 text-amber-700",
  ANALYZING: "border-blue-200 bg-blue-50 text-blue-700",
  VERIFIED: "border-indigo-200 bg-indigo-50 text-indigo-700",
  ASSIGNED: "border-purple-200 bg-purple-50 text-purple-700",
  IN_PROGRESS: "border-blue-200 bg-blue-50 text-blue-700",
  RESOLVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

const incidentTypeLabels: Record<string, string> = {
  FLOOD: "Flood",
  FIRE: "Fire",
  ROAD_ACCIDENT: "Road accident",
  MEDICAL: "Medical emergency",
  EVACUATION: "Evacuation",
  OTHER: "Other emergency",
};

const resourceLabels: Record<string, string> = {
  AMBULANCE: "Ambulance",
  RESCUE_TEAM: "Rescue team",
  VOLUNTEER: "Emergency volunteers",
  EMERGENCY_VEHICLE: "Emergency vehicle",
  MEDICAL_TEAM: "Medical team",
  SHELTER: "Emergency shelter",
};

function formatLabel(value?: string | null) {
  if (!value) return "Not available";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getIntelligence(value: unknown): IncidentIntelligence | null {
  if (!value) return null;

  try {
    const parsed =
      typeof value === "string" ? JSON.parse(value) : value;

    if (!parsed || typeof parsed !== "object") return null;

    return parsed as IncidentIntelligence;
  } catch {
    return null;
  }
}

export default async function IncidentDetailsPage({
  params,
}: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;

  if (!id) notFound();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get the current user's role.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/login");

  const role = String(profile.role ?? "CITIZEN").toUpperCase();

  // Fetch the incident.
  const { data: incident, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !incident) {
    console.error("Incident fetch error:", error);
    notFound();
  }

  // Check incident ownership.
  const isOwner =
    incident.reported_by === user.id ||
    incident.user_id === user.id;

  const isStaff = ["ADMIN", "RESPONDER"].includes(role);

  // Citizens can only view their own reports.
  if (role === "CITIZEN" && !isOwner) {
    notFound();
  }

  if (!isStaff && role !== "CITIZEN") {
    redirect("/login");
  }

  const status = String(incident.status ?? "REPORTED").toUpperCase();

const intelligence = getIntelligence(incident.ai_analysis);
const analysis = intelligence?.analysis;
const responsePlan = intelligence?.responsePlan;

const severity = String(
  analysis?.severity ?? incident.severity ?? "MEDIUM"
).toUpperCase();

  const isClosed = ["RESOLVED", "CANCELLED"].includes(status);

  const backUrl =
    role === "RESPONDER"
      ? "/responder"
      : role === "ADMIN"
        ? "/incidents"
        : "/dashboard";

  // Fetch available and assigned resources separately.
  const [availableResResult, assignedResResult] =
    await Promise.all([
      supabase
        .from("resources")
        .select("id, name, resource_type, status")
        .eq("status", "AVAILABLE"),

      supabase
        .from("resources")
        .select("id, name, resource_type, status")
        .eq("assigned_incident_id", id),
    ]);

  const availableResources: Resource[] =
    availableResResult.data ?? [];

  const assignedResources: Resource[] =
    assignedResResult.data ?? [];

  if (availableResResult.error) {
    console.error(
      "Available resources fetch error:",
      availableResResult.error
    );
  }

  if (assignedResResult.error) {
    console.error(
      "Assigned resources fetch error:",
      assignedResResult.error
    );
  }

  // Read the saved rule-based assessment.


  const assessedSeverity = String(
    analysis?.severity ?? severity
  ).toUpperCase();

  const detectedType = analysis?.detected_type;

  const recommendedTypes =
    analysis?.recommended_resource_types ??
    responsePlan?.recommended_resources ??
    [];

  const immediateActions =
    responsePlan?.immediate_actions ?? [];

  const requiresHumanReview =
    analysis?.requires_human_review ?? true;

  const reportedAt = incident.created_at
    ? new Date(incident.created_at).toLocaleString()
    : "Unavailable";

  const severityStyle =
    severityStyles[severity] ??
    "border-slate-200 bg-slate-50 text-slate-600";

  const statusStyle =
    statusStyles[status] ??
    "border-slate-200 bg-slate-50 text-slate-600";

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

        .incident-animate {
          animation: incidentFadeUp 650ms cubic-bezier(.2,.7,.2,1) both;
        }

        .incident-delay-1 { animation-delay: 80ms; }
        .incident-delay-2 { animation-delay: 160ms; }
        .incident-delay-3 { animation-delay: 240ms; }
        .incident-delay-4 { animation-delay: 320ms; }

        .incident-card {
          border: 1px solid rgba(226, 232, 240, .9);
          background: rgba(255, 255, 255, .92);
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
          .incident-animate {
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

      {/* Background decorations */}
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
                  : "Incident Tracking"}
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
                {formatLabel(severity)} Priority
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold uppercase tracking-wider ${statusStyle}`}
              >
                {isClosed ? (
                  <CheckCircle2 size={15} />
                ) : (
                  <Clock size={15} />
                )}
                {formatLabel(status)}
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
                    Your report details and emergency information
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
                  value={formatLabel(incident.incident_type)}
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
                    "Location coordinates recorded"
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
                  value={
                    incident.medical_required
                      ? "Required"
                      : "Not specified"
                  }
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

            {/* Citizen-friendly incident intelligence */}
            <section className="incident-card incident-animate incident-delay-2 overflow-hidden rounded-3xl">
              <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
                <div className="incident-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <ShieldAlert size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    ResQAI Incident Assessment
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Initial assessment to guide emergency response
                  </p>
                </div>
              </div>

              {analysis ? (
                <div className="space-y-6 p-5 sm:p-6">

                  {/* Assessment summary */}
                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Initial assessment
                    </p>

                    <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                      {incidentTypeLabels[detectedType ?? ""] ??
                        "Emergency incident identified"}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Based on the information provided in your
                      report, ResQAI has generated an initial
                      assessment and identified potentially relevant
                      emergency support.
                    </p>
                  </div>

                  {/* Severity */}
                  <div>
                    <p className="mb-3 text-sm font-bold text-slate-800">
                      Assessed severity
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`rounded-full border px-4 py-2 text-sm font-extrabold ${
                          severityStyles[assessedSeverity] ??
                          "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        {formatLabel(assessedSeverity)} Priority
                      </span>

                      <span className="text-xs text-slate-500">
                        Preliminary assessment
                      </span>
                    </div>
                  </div>

                  {/* Recommended resources */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Recommended emergency support
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      These are recommendations, not confirmation
                      of dispatch.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {recommendedTypes.length > 0 ? (
                        recommendedTypes.map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700"
                          >
                            <CheckCircle2 size={16} />
                            {resourceLabels[type] ?? formatLabel(type)}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">
                          Support requirements are still being assessed.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Next steps */}
                  <div className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <ClipboardCheck
                        size={18}
                        className="text-blue-600"
                      />
                      What happens next?
                    </h3>

                    <div className="mt-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <CheckCircle2 size={17} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Initial assessment generated
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Your report has been assessed using
                            ResQAI's AI based analysis system.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                          <Clock size={17} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {requiresHumanReview
                              ? "Human verification required"
                              : "Assessment available for review"}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            An authorized response team member
                            must review the assessment before
                            response decisions are made.
                          </p>
                        </div>
                      </div>

                      {immediateActions.length > 0 && (
                        <div className="border-t border-slate-100 pt-4">
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Suggested response steps
                          </p>

                          <ul className="space-y-2">
                            {immediateActions.map((action, index) => (
                              <li
                                key={`${index}-${action}`}
                                className="flex items-start gap-2 text-sm leading-6 text-slate-600"
                              >
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Human review notice */}
                  <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/70 p-4">
                    <AlertCircle
                      size={20}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <p className="text-xs leading-5 text-amber-800">
                      This is a preliminary automated assessment,
                      not a confirmed emergency response or dispatch.
                      Final decisions are made by authorized personnel.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-5">
                    <Clock
                      size={21}
                      className="mt-0.5 shrink-0 text-amber-600"
                    />

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Assessment pending
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        An initial assessment has not been generated
                        for this report yet. Your incident remains
                        available for review by authorized personnel.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Emergency dispatch */}
            <section className="incident-card incident-animate incident-delay-2 rounded-3xl p-5 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="incident-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100">
                  <Truck size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Emergency Response
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Actual resources assigned to your incident
                  </p>
                </div>
              </div>

              {assignedResources.length > 0 ? (
                <div className="space-y-3">
                  {assignedResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4 sm:p-5"
                    >
                      <div className="flex items-start gap-4">
                        <div className="incident-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <Truck size={23} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                              Assigned resource
                            </span>

                            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                              {formatLabel(resource.status)}
                            </span>
                          </div>

                          <h3 className="mt-2 break-words text-base font-extrabold text-slate-900">
                            {resource.name}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            {resourceLabels[resource.resource_type] ??
                              formatLabel(resource.resource_type)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <p className="text-xs leading-5 text-slate-500">
                    These resources are currently linked to your
                    incident. Their displayed status comes from
                    the resource records.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="incident-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <Clock size={22} />
                    </div>

                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                        Awaiting assignment
                      </span>

                      <h3 className="mt-2 text-base font-extrabold text-slate-900">
                        No response resource assigned yet
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Your report does not currently have an
                        associated response resource. Authorized
                        personnel can review and assign available
                        resources.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Resource assignment for staff */}
            {isStaff && !isClosed && (
              <section className="incident-card incident-animate incident-delay-3 rounded-3xl p-4 sm:p-6">
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
              </section>
            )}
          </section>

          {/* Right sidebar */}
          <aside className="incident-animate incident-delay-3 min-w-0 space-y-6 lg:sticky lg:top-6">

            {/* Response status */}
            <section className="incident-card rounded-3xl p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="incident-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                  <Activity size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Response Status
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Current incident progress
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Current status
                </p>

                <p className="mt-2 break-words text-xl font-black text-blue-800">
                  {formatLabel(status)}
                </p>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className={`h-full rounded-full ${
                      isClosed
                        ? "w-full bg-emerald-500"
                        : status === "IN_PROGRESS"
                          ? "w-2/3 bg-blue-500"
                          : status === "ASSIGNED"
                            ? "w-1/2 bg-blue-500"
                            : "w-1/4 bg-amber-400"
                    }`}
                  />
                </div>
              </div>

              {isStaff ? (
                !isClosed ? (
                  <div className="mt-5 border-t border-slate-100 pt-5">
                    <h3 className="mb-3 text-sm font-bold text-slate-800">
                      Update incident
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
                        This incident has been resolved or cancelled.
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-sm leading-6 text-slate-600">
                    Your report is registered with the ResQAI
                    command center. The status shown here reflects
                    the latest saved incident status when this
                    page was loaded.
                  </p>
                </div>
              )}
            </section>

            {/* Incident summary */}
            <section className="incident-card incident-animate incident-delay-4 rounded-3xl p-5 sm:p-6">
              <h3 className="text-base font-extrabold text-slate-900">
                Incident Summary
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Quick reference
              </p>

              <div className="mt-5 space-y-4">
                <SummaryRow
                  label="Priority"
                  value={formatLabel(severity)}
                  dot={
                    severity === "HIGH" || severity === "CRITICAL"
                      ? "bg-red-500"
                      : severity === "LOW"
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                  }
                />

                <SummaryRow
                  label="Resources assigned"
                  value={String(assignedResources.length)}
                  dot={
                    assignedResources.length > 0
                      ? "bg-emerald-500"
                      : "bg-slate-400"
                  }
                />

                <SummaryRow
                  label="Incident status"
                  value={isClosed ? "Closed" : "Active"}
                  dot={
                    isClosed
                      ? "bg-emerald-500"
                      : "bg-blue-500"
                  }
                />

                <SummaryRow
                  label="Assessment"
                  value={analysis ? "Available" : "Pending"}
                  dot={
                    analysis
                      ? "bg-indigo-500"
                      : "bg-slate-400"
                  }
                />
              </div>
            </section>

            {/* Helpful information */}
            <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <UserCheck size={20} />
                </div>

                <h3 className="font-extrabold text-slate-900">
                  Response information
                </h3>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                ResQAI provides preliminary decision support.
                Emergency response and resource allocation decisions
                are reviewed by authorized personnel.
              </p>
            </section>
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

// Reusable information card.
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
        <p className="text-xs font-medium text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold capitalize leading-6 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

// Reusable summary row.
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
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="inline-flex items-center gap-2 text-right text-xs font-extrabold text-slate-700">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        {value}
      </span>
    </div>
  );
}
