"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  LoaderCircle,
  LogOut,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";
type Filter = "ALL" | ApplicationStatus;
type IncidentFilter = "ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
type DashboardSection = "INCIDENTS" | "VERIFICATION";

type Application = {
  id: string;
  organization_id: string | null;
  submitted_by: string;
  application_status: string;
  organization_registration_number: string | null;
  organization_type: string | null;
  organization_name: string | null;
  organization_email: string | null;
  organization_phone: string | null;
  organization_website: string | null;
  organization_address: string | null;
  organization_city: string | null;
  organization_state: string | null;
  organization_postal_code: string | null;
  representative_contact_name: string | null;
  representative_contact_email: string | null;
  representative_contact_phone: string | null;
  representative_designation: string | null;
  official_directory_url: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string | null;
  updated_at: string | null;
  has_authorization_document: boolean;
  has_representative_identity_document: boolean;
};

type Incident = {
  id: string;
  reported_by: string | null;
  title: string;
  description: string;
  incident_type: string;
  severity: string;
  status: string;
  affected_people: number | null;
  medical_required: boolean | null;
  evacuation_required: boolean | null;
  image_url: string | null;
  address: string | null;
  ai_confidence: number | null;
  ai_analysis: {
    analysis?: {
      detected_type?: string;
      severity?: string;
      risk_score?: number;
      risk_factors?: string[];
      recommended_resource_types?: string[];
      analysis_method?: string;
      requires_human_review?: boolean;
      explanation?: string;
    };
    responsePlan?: {
      priority?: string;
      immediate_actions?: string[];
      recommended_resources?: string[];
      operator_notes?: string[];
    };
    generated_at?: string;
    review_status?: string;
  } | null;
  created_at: string;
  updated_at: string;
};

type AvailableResource = {
  id: string;
  name: string;
  resource_type: string;
  status: string;
  capacity: number | null;
  skills: string[] | null;
  distance_km: number | null;
  organization_id: string | null;
};

type AssignedResource = {
  id: string;
  incident_id: string;
  resource_id: string;
  responder_id: string | null;
  status: string;
  distance_km: number | null;
  estimated_response_minutes: number | null;
  allocation_score: number | null;
  assigned_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  resources: {
    id: string;
    name: string;
    resource_type: string;
    capacity: number | null;
    skills: string[] | null;
    contact_phone: string | null;
    organization: string | null;
  } | null;
};

type AvailableResponder = {
  id: string;
  full_name: string | null;
  phone: string | null;
  organization_id: string;
  organization_name: string | null;
  designation: string | null;
  employee_id: string | null;
  membership_role: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  reviewer_role?: string;
  applications?: Application[];
  incidents?: Incident[];
  total?: number;
  signed_url?: string;
  resources?: AvailableResource[];
  assignments?: AssignedResource[];
  responders?: AvailableResponder[];
};

const panelClass =
  "rounded-2xl border border-slate-200/80 bg-white/85 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50";

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClasses(status: string) {
  switch (status.toUpperCase()) {
    case "APPROVED":
    case "RESOLVED":
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
    case "CANCELLED":
      return "border-red-200 bg-red-50 text-red-700";
    case "CRITICAL":
      return "border-red-200 bg-red-50 text-red-700";
    case "HIGH":
      return "border-orange-200 bg-orange-50 text-orange-700";
    case "MEDIUM":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "LOW":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ASSIGNED":
    case "IN_PROGRESS":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export default function AdminDashboardPage() {
  const router = useRouter();

  // Dashboard navigation
  const [activeSection, setActiveSection] =
    useState<DashboardSection>("INCIDENTS");

  // Verification state
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewerRole, setReviewerRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [documentBusy, setDocumentBusy] = useState<string | null>(null);

  // Incident state
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentLoading, setIncidentLoading] = useState(true);
  const [incidentError, setIncidentError] = useState("");
  const [incidentFilter, setIncidentFilter] = useState<IncidentFilter>("ALL");
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    null
  );
  const [assignedResources, setAssignedResources] = useState<
    AssignedResource[]
  >([]);
  const [assignedResourcesLoading, setAssignedResourcesLoading] =
    useState(false);
  const [assignedResourcesError, setAssignedResourcesError] = useState("");

  // Resource assignment state
  const [availableResources, setAvailableResources] = useState<
    AvailableResource[]
  >([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [availableResponders, setAvailableResponders] = useState<
    AvailableResponder[]
  >([]);
  const [selectedResponderId, setSelectedResponderId] = useState("");

  // Shared alerts
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/applications", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error("You are not authorized to view applications.");
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load verification applications."
        );
      }

      const nextApplications = result.applications ?? [];
      setApplications(nextApplications);
      setReviewerRole(result.reviewer_role ?? "");

      setSelectedId((currentId) =>
        currentId && nextApplications.some((item) => item.id === currentId)
          ? currentId
          : nextApplications[0]?.id ?? null
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load applications."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadIncidents = useCallback(async () => {
    setIncidentLoading(true);
    setIncidentError("");

    try {
      const response = await fetch("/api/admin/incidents", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 403) {
        throw new Error("You are not authorized to view incidents.");
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load incidents.");
      }

      const nextIncidents = result.incidents ?? [];
      setIncidents(nextIncidents);

      setSelectedIncidentId((currentId) =>
        currentId && nextIncidents.some((incident) => incident.id === currentId)
          ? currentId
          : nextIncidents[0]?.id ?? null
      );
    } catch (err) {
      setIncidentError(
        err instanceof Error ? err.message : "Unable to load incidents."
      );
    } finally {
      setIncidentLoading(false);
    }
  }, [router]);

  const loadAssignedResources = useCallback(async (incidentId: string) => {
    setAssignedResourcesLoading(true);
    setAssignedResourcesError("");

    try {
      const response = await fetch(
        `/api/admin/assignments?incidentId=${encodeURIComponent(incidentId)}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load assigned resources.");
      }

      setAssignedResources(result.assignments ?? []);
    } catch (error) {
      setAssignedResourcesError(
        error instanceof Error
          ? error.message
          : "Unable to load assigned resources."
      );
    } finally {
      setAssignedResourcesLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!selectedIncidentId) {
      setAssignedResources([]);
      return;
    }

    void loadAssignedResources(selectedIncidentId);
  }, [selectedIncidentId, loadAssignedResources]);

  const loadAvailableResources = useCallback(
    async (incidentId: string) => {
      setResourceLoading(true);
      setResourceError("");
      setAvailableResponders([]);
      setSelectedResponderId("");

      try {
        const response = await fetch(
          `/api/admin/assignments?incidentId=${encodeURIComponent(incidentId)}`,
          {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
          }
        );

        const result = (await response.json()) as ApiResponse;

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || "Unable to load available resources."
          );
        }

        const resources = result.resources ?? [];

        setAvailableResources(resources);
        setAvailableResponders(result.responders ?? []);
        setSelectedResourceId(resources[0]?.id ?? "");
      } catch (err) {
        setResourceError(
          err instanceof Error
            ? err.message
            : "Unable to load available resources."
        );
      } finally {
        setResourceLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!selectedIncidentId) {
      setAvailableResources([]);
      setSelectedResourceId("");
      return;
    }

    void loadAvailableResources(selectedIncidentId);
  }, [selectedIncidentId, loadAvailableResources]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadApplications();
      void loadIncidents();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadApplications, loadIncidents]);

  // Verification calculations
  const pendingCount = applications.filter(
    (item) => item.application_status.toUpperCase() === "PENDING"
  ).length;

  const approvedCount = applications.filter(
    (item) => item.application_status.toUpperCase() === "APPROVED"
  ).length;

  const rejectedCount = applications.filter(
    (item) => item.application_status.toUpperCase() === "REJECTED"
  ).length;

  const visibleApplications = applications.filter(
    (item) =>
      filter === "ALL" || item.application_status.toUpperCase() === filter
  );

  const selectedApplication =
    applications.find((item) => item.id === selectedId) ?? null;

  // Incident calculations: use rule-based severity when it exists.
  const getIncidentSeverity = (incident: Incident) =>
    incident.ai_analysis?.analysis?.severity || incident.severity;

  const visibleIncidents = useMemo(
    () =>
      incidents.filter((incident) => {
        if (incidentFilter === "ALL") return true;
        return getIncidentSeverity(incident).toUpperCase() === incidentFilter;
      }),
    [incidents, incidentFilter]
  );

  const selectedIncident =
    incidents.find((incident) => incident.id === selectedIncidentId) ?? null;
  const selectedResource = availableResources.find(
    (resource) => resource.id === selectedResourceId
  );

  const eligibleResponders = availableResponders.filter(
    (responder) =>
      responder.organization_id === selectedResource?.organization_id
  );

  const criticalCount = incidents.filter(
    (item) => getIncidentSeverity(item).toUpperCase() === "CRITICAL"
  ).length;

  const openIncidentCount = incidents.filter(
    (item) => !["RESOLVED", "CANCELLED"].includes(item.status.toUpperCase())
  ).length;

  async function previewDocument(
    applicationId: string,
    type: "authorization" | "identity"
  ) {
    const key = `${applicationId}:${type}`;
    setDocumentBusy(key);
    setError("");

    // Open immediately so the browser is less likely to block the new tab.
    const previewTab = window.open("about:blank", "_blank");

    try {
      const response = await fetch(
        `/api/admin/applications/${applicationId}/documents?type=${type}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        }
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.signed_url) {
        previewTab?.close();
        throw new Error(result.message || "Unable to open the document.");
      }

      if (previewTab) {
        previewTab.location.href = result.signed_url;
      } else {
        window.location.href = result.signed_url;
      }
    } catch (err) {
      previewTab?.close();
      setError(
        err instanceof Error ? err.message : "Unable to preview the document."
      );
    } finally {
      setDocumentBusy(null);
    }
  }

  async function assignSelectedResource() {
    if (!selectedIncident || !selectedResourceId || !selectedResponderId) {
      setError("Select an incident, resource, and responder.");
      return;
    }

    const resource = availableResources.find(
      (item) => item.id === selectedResourceId
    );

    const responder = availableResponders.find(
      (item) =>
        item.id === selectedResponderId &&
        item.organization_id === resource?.organization_id
    );

    if (!resource || !responder) {
      setError("The selected resource or eligible responder is invalid.");
      return;
    }

    const confirmed = window.confirm(
      `Assign "${resource.name}" to "${
        selectedIncident.title
      }"?\n\nResponder: ${
        responder.full_name || "Unnamed responder"
      }\nOrganization: ${responder.organization_name || "Unknown"}`
    );

    if (!confirmed) return;

    setAssignmentBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/assignments", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          resourceId: resource.id,
          responderId: responder.id,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (response.status === 409) {
        throw new Error(
          result.message || "This resource is no longer available."
        );
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to assign this resource.");
      }

      setNotice(
        `${resource.name} assigned to ${
          responder.full_name || "the selected responder"
        } successfully.`
      );

      setSelectedResponderId("");

      await Promise.all([
        loadAvailableResources(selectedIncident.id),
        loadAssignedResources(selectedIncident.id),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setAssignmentBusy(false);
    }
  }

  async function reviewApplication(
    application: Application,
    decision: "APPROVE" | "REJECT"
  ) {
    if (application.application_status.toUpperCase() !== "PENDING") {
      setError("Only pending applications can be reviewed.");
      return;
    }

    let rejectionReason: string | undefined;

    if (decision === "REJECT") {
      rejectionReason = window
        .prompt("Enter the reason for rejecting this application:")
        ?.trim();

      if (!rejectionReason) {
        setNotice("Rejection cancelled. A reason is required.");
        return;
      }
    } else {
      const confirmed = window.confirm(
        `Approve "${
          application.organization_name || "this organization"
        }"? This will mark the organization as verified.`
      );

      if (!confirmed) return;
    }

    const reviewNotes = window
      .prompt("Optional review notes (leave blank if none):")
      ?.trim();

    setBusyId(application.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/applications/${application.id}/review`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            review_notes: reviewNotes || null,
            ...(decision === "REJECT"
              ? { rejection_reason: rejectionReason }
              : {}),
          }),
        }
      );

      const result = (await response.json()) as ApiResponse;

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to review this application.");
      }

      setNotice(
        decision === "APPROVE"
          ? "Application approved successfully."
          : "Application rejected successfully."
      );

      await loadApplications();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function refreshDashboard() {
    setNotice("");
    await Promise.all([loadApplications(), loadIncidents()]);
  }

  const stats = [
    {
      label: "Loaded applications",
      count: applications.length,
      icon: Building2,
      color: "text-blue-600",
      iconBg: "bg-blue-50",
      accent: "from-blue-500 to-cyan-400",
    },
    {
      label: "Pending review",
      count: pendingCount,
      icon: Clock3,
      color: "text-amber-600",
      iconBg: "bg-amber-50",
      accent: "from-amber-400 to-orange-400",
    },
    {
      label: "Approved",
      count: approvedCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
      iconBg: "bg-emerald-50",
      accent: "from-emerald-400 to-teal-400",
    },
    {
      label: "Rejected",
      count: rejectedCount,
      icon: XCircle,
      color: "text-red-600",
      iconBg: "bg-red-50",
      accent: "from-red-400 to-rose-400",
    },
  ];

  return (
    <main className="admin-light-theme relative min-h-screen overflow-hidden bg-[#f7faff] text-slate-800">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="admin-orb absolute -left-40 -top-36 h-[430px] w-[430px] rounded-full bg-blue-300/25 blur-[110px]" />
        <div className="admin-orb admin-orb-delay absolute -right-36 top-[12%] h-[450px] w-[450px] rounded-full bg-sky-300/25 blur-[120px]" />
        <div className="admin-orb admin-orb-slow absolute -bottom-48 left-[25%] h-[470px] w-[470px] rounded-full bg-indigo-300/20 blur-[130px]" />
        <div className="admin-orb admin-orb-delay absolute bottom-[8%] -right-20 h-72 w-72 rounded-full bg-cyan-200/25 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37,99,235,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.045) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <style jsx>{`
        .admin-orb {
          animation: adminFloat 14s ease-in-out infinite alternate;
          will-change: transform;
        }
        .admin-orb-delay {
          animation-delay: -5s;
          animation-duration: 17s;
        }
        .admin-orb-slow {
          animation-duration: 21s;
        }
        @keyframes adminFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(28px, -24px, 0) scale(1.08);
          }
          100% {
            transform: translate3d(-20px, 26px, 0) scale(0.96);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .admin-orb {
            animation: none;
          }
        }
      `}</style>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/80 bg-white/75 p-4 shadow-lg shadow-blue-100/40 backdrop-blur-2xl sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-100 shadow-sm">
              <ShieldCheck className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                ResQ<span className="text-blue-600">AI</span>{" "}
                <span className="text-slate-500">Admin</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Emergency response administration
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {reviewerRole && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                {reviewerRole}
              </span>
            )}

            <button
              type="button"
              onClick={() => void refreshDashboard()}
              disabled={loading || incidentLoading}
              className="group inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 text-blue-600 ${
                  loading || incidentLoading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <LogOut className="h-4 w-4" />
              Home
            </button>
          </div>
        </header>

        {/* Page title */}
        <section className="mb-7">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-700 shadow-sm">
            <Sparkles className="h-4 w-4" />
            Administration
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Admin{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              dashboard
            </span>
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Monitor reported emergencies and manage responder organization
            verification from one place.
          </p>
        </section>

        {/* Section navigation */}
        <div className="mb-7 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-2 shadow-sm backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setActiveSection("INCIDENTS")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeSection === "INCIDENTS"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            Incidents
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeSection === "INCIDENTS"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {incidentLoading ? "…" : incidents.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection("VERIFICATION")}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeSection === "VERIFICATION"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200"
                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Responder verification
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeSection === "VERIFICATION"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {loading ? "…" : pendingCount}
            </span>
          </button>
        </div>

        {/* Shared alerts */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-red-200 bg-red-50/95 p-4 text-sm text-red-700"
          >
            <span className="font-bold">Something went wrong: </span>
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            {notice}
          </div>
        )}

        {/* INCIDENTS SECTION */}
        {activeSection === "INCIDENTS" && (
          <section>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className={`${panelClass} p-5`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Total incidents
                  </p>
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">
                  {incidentLoading ? "—" : incidents.length}
                </p>
              </div>

              <div className={`${panelClass} p-5`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Active incidents
                  </p>
                  <Clock3 className="h-5 w-5 text-amber-600" />
                </div>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">
                  {incidentLoading ? "—" : openIncidentCount}
                </p>
              </div>

              <div className={`${panelClass} p-5`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    Critical incidents
                  </p>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <p className="mt-3 text-3xl font-extrabold text-slate-900">
                  {incidentLoading ? "—" : criticalCount}
                </p>
              </div>
            </div>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Reported incidents
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Select an incident to inspect its report and AI-based
                  assessment.
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm">
                {(
                  [
                    "ALL",
                    "CRITICAL",
                    "HIGH",
                    "MEDIUM",
                    "LOW",
                  ] as IncidentFilter[]
                ).map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setIncidentFilter(value)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                      incidentFilter === value
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                        : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {value === "ALL" ? "All" : value}
                  </button>
                ))}
              </div>
            </div>

            {incidentError && (
              <div
                role="alert"
                className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {incidentError}
                <button
                  type="button"
                  onClick={() => void loadIncidents()}
                  className="ml-2 font-bold underline"
                >
                  Try again
                </button>
              </div>
            )}

            {incidentLoading ? (
              <div
                className={`${panelClass} flex min-h-64 items-center justify-center gap-3`}
              >
                <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-slate-500">
                  Loading incidents...
                </span>
              </div>
            ) : (
              <div className="grid items-start gap-6 xl:grid-cols-[1fr_1fr]">
                {/* Incident list */}
                <div className="space-y-3">
                  {visibleIncidents.length === 0 ? (
                    <div className={`${panelClass} p-10 text-center`}>
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                        <AlertTriangle className="h-7 w-7 text-blue-500" />
                      </div>
                      <p className="font-bold text-slate-800">
                        No incidents found
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        No incidents match this filter.
                      </p>
                    </div>
                  ) : (
                    visibleIncidents.map((incident) => {
                      const severity = getIncidentSeverity(incident);
                      const isSelected = selectedIncidentId === incident.id;

                      return (
                        <button
                          type="button"
                          key={incident.id}
                          onClick={() => setSelectedIncidentId(incident.id)}
                          className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5 ${
                            isSelected
                              ? "border-blue-300 bg-blue-50/80 shadow-md shadow-blue-100/70"
                              : "border-slate-200 bg-white/85 hover:border-blue-200"
                          }`}
                        >
                          <div
                            className={`absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-400 ${
                              isSelected
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          />

                          <div className="flex items-start justify-between gap-3 pl-1">
                            <div className="min-w-0">
                              <h4 className="break-words font-bold text-slate-900">
                                {incident.title}
                              </h4>
                              <p className="mt-1 text-xs text-slate-500">
                                {incident.incident_type.replaceAll("_", " ")}
                              </p>
                              <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                                {incident.description}
                              </p>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusClasses(
                                  severity
                                )}`}
                              >
                                {severity}
                              </span>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClasses(
                                  incident.status
                                )}`}
                              >
                                {incident.status.replaceAll("_", " ")}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(incident.created_at)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {incident.affected_people ?? "Unknown"} affected
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Selected incident details */}
                <section className={`${panelClass} min-w-0 p-5 sm:p-6`}>
                  {!selectedIncident ? (
                    <div className="flex min-h-72 flex-col items-center justify-center text-center">
                      <AlertTriangle className="mb-4 h-10 w-10 text-blue-500" />
                      <h3 className="font-bold text-slate-800">
                        Incident details
                      </h3>
                      <p className="mt-2 max-w-xs text-sm text-slate-500">
                        Select an incident from the list to view its details.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-5 border-b border-slate-100 pb-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                              Selected incident
                            </p>
                            <h3 className="mt-2 break-words text-xl font-extrabold text-slate-900">
                              {selectedIncident.title}
                            </h3>
                          </div>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusClasses(
                              getIncidentSeverity(selectedIncident)
                            )}`}
                          >
                            {getIncidentSeverity(selectedIncident)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          {selectedIncident.incident_type.replaceAll("_", " ")}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Description
                          </p>
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                            {selectedIncident.description}
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              Incident status
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {selectedIncident.status.replaceAll("_", " ")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              People affected
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {selectedIncident.affected_people ??
                                "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              Medical assistance
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {selectedIncident.medical_required === null
                                ? "Not specified"
                                : selectedIncident.medical_required
                                ? "Required"
                                : "Not required"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              Evacuation
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {selectedIncident.evacuation_required === null
                                ? "Not specified"
                                : selectedIncident.evacuation_required
                                ? "Required"
                                : "Not required"}
                            </p>
                          </div>
                        </div>

                        {selectedIncident.address && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500">
                              Location
                            </p>
                            <p className="mt-1 flex items-start gap-2 text-sm text-slate-800">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                              {selectedIncident.address}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs font-semibold text-slate-500">
                            Reported at
                          </p>
                          <p className="mt-1 text-sm text-slate-800">
                            {formatDate(selectedIncident.created_at)}
                          </p>
                        </div>

                        {selectedIncident.image_url && (
                          <div>
                            <p className="mb-2 text-xs font-semibold text-slate-500">
                              Incident image
                            </p>
                            <a
                              href={selectedIncident.image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
                            >
                              View uploaded image
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Rule-based assessment */}
                      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="flex items-center gap-2 text-sm font-extrabold text-blue-900">
                            <Sparkles className="h-4 w-4" />
                            AI-based assessment
                          </h4>
                          <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[10px] font-bold text-blue-700">
                            {selectedIncident.ai_analysis?.analysis
                              ?.analysis_method || "ASSESSMENT PENDING"}
                          </span>
                        </div>

                        {selectedIncident.ai_analysis?.analysis ? (
                          <>
                            <div className="mt-4 grid grid-cols-2 gap-3">
                              <div className="rounded-xl border border-blue-100 bg-white p-3">
                                <p className="text-[11px] font-semibold text-slate-500">
                                  Detected type
                                </p>
                                <p className="mt-1 text-sm font-extrabold text-slate-900">
                                  {selectedIncident.ai_analysis.analysis.detected_type?.replaceAll(
                                    "_",
                                    " "
                                  ) || selectedIncident.incident_type}
                                </p>
                              </div>
                              <div className="rounded-xl border border-blue-100 bg-white p-3">
                                <p className="text-[11px] font-semibold text-slate-500">
                                  Risk score
                                </p>
                                <p className="mt-1 text-sm font-extrabold text-slate-900">
                                  {selectedIncident.ai_analysis.analysis
                                    .risk_score ?? "Not available"}
                                </p>
                              </div>
                            </div>

                            {selectedIncident.ai_analysis.analysis
                              .explanation && (
                              <p className="mt-4 text-sm leading-6 text-slate-700">
                                {
                                  selectedIncident.ai_analysis.analysis
                                    .explanation
                                }
                              </p>
                            )}

                            {!!selectedIncident.ai_analysis.analysis
                              .risk_factors?.length && (
                              <div className="mt-4">
                                <p className="text-xs font-bold text-slate-700">
                                  Risk factors
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                  {selectedIncident.ai_analysis.analysis.risk_factors.map(
                                    (factor, index) => (
                                      <li key={`${factor}-${index}`}>
                                        {factor}
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                            {!!selectedIncident.ai_analysis.analysis
                              .recommended_resource_types?.length && (
                              <div className="mt-4">
                                <p className="text-xs font-bold text-slate-700">
                                  Recommended resource types
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {selectedIncident.ai_analysis.analysis.recommended_resource_types.map(
                                    (resource) => (
                                      <span
                                        key={resource}
                                        className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700"
                                      >
                                        {resource.replaceAll("_", " ")}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            <p className="mt-4 text-xs text-slate-500">
                              Generated:{" "}
                              {formatDate(
                                selectedIncident.ai_analysis.generated_at
                              )}
                            </p>

                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                              <AlertTriangle className="mr-1 inline h-4 w-4" />
                              This is AI-based decision support. An authorized
                              admin must review the assessment before any
                              response or resource assignment.
                            </div>
                          </>
                        ) : (
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            Assessment pending. An initial assessment has not
                            been generated for this report yet.
                          </p>
                        )}
                      </div>

                      {/* Response plan */}
                      {selectedIncident.ai_analysis?.responsePlan && (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                          <h4 className="text-sm font-extrabold text-slate-800">
                            Suggested response plan
                          </h4>

                          {selectedIncident.ai_analysis.responsePlan
                            .priority && (
                            <p className="mt-2 text-sm text-slate-700">
                              <span className="font-semibold">Priority: </span>
                              {
                                selectedIncident.ai_analysis.responsePlan
                                  .priority
                              }
                            </p>
                          )}

                          {!!selectedIncident.ai_analysis.responsePlan
                            .immediate_actions?.length && (
                            <div className="mt-3">
                              <p className="text-xs font-bold text-slate-600">
                                Suggested immediate actions
                              </p>
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                {selectedIncident.ai_analysis.responsePlan.immediate_actions.map(
                                  (action, index) => (
                                    <li key={`${action}-${index}`}>{action}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                          {!!selectedIncident.ai_analysis.responsePlan
                            .operator_notes?.length && (
                            <div className="mt-3">
                              <p className="text-xs font-bold text-slate-600">
                                Admin notes
                              </p>
                              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                                {selectedIncident.ai_analysis.responsePlan.operator_notes.map(
                                  (note, index) => (
                                    <li key={`${note}-${index}`}>{note}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Assigned resources */}
                      <div className="mt-5 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 bg-blue-50/70 px-5 py-4">
                          <div>
                            <h4 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                              <Users className="h-4 w-4 text-blue-600" />
                              Assigned resources
                            </h4>
                            <p className="mt-1 text-xs text-slate-500">
                              Resources manually assigned to this incident
                            </p>
                          </div>

                          <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-bold text-blue-700">
                            {assignedResources.length} assigned
                          </span>
                        </div>

                        <div className="p-4">
                          {assignedResourcesLoading ? (
                            <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                              Loading assigned resources...
                            </div>
                          ) : assignedResourcesError ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                              {assignedResourcesError}
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedIncidentId) {
                                    void loadAssignedResources(
                                      selectedIncidentId
                                    );
                                  }
                                }}
                                className="ml-2 font-bold underline"
                              >
                                Retry
                              </button>
                            </div>
                          ) : assignedResources.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                              <Users className="mx-auto h-8 w-8 text-slate-300" />
                              <p className="mt-2 text-sm font-semibold text-slate-700">
                                No resources assigned yet
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Choose an available resource below to assign it.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {assignedResources.map((assignment) => {
                                const resource = assignment.resources;

                                return (
                                  <div
                                    key={assignment.id}
                                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div className="flex items-start gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                                          <Building2 className="h-5 w-5" />
                                        </div>

                                        <div>
                                          <p className="font-bold text-slate-900">
                                            {resource?.name ??
                                              "Resource details unavailable"}
                                          </p>

                                          <p className="mt-1 text-xs font-medium text-slate-500">
                                            {resource?.resource_type?.replaceAll(
                                              "_",
                                              " "
                                            ) ?? "Unknown resource type"}
                                          </p>

                                          {resource?.organization && (
                                            <p className="mt-1 text-xs text-slate-500">
                                              {resource.organization}
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <span
                                        className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClasses(
                                          assignment.status
                                        )}`}
                                      >
                                        {assignment.status.replaceAll("_", " ")}
                                      </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                                        <p className="text-xs text-slate-500">
                                          Assigned at
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                          {formatDate(assignment.assigned_at)}
                                        </p>
                                      </div>

                                      <div className="rounded-lg border border-slate-200 bg-white p-3">
                                        <p className="text-xs text-slate-500">
                                          Distance
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-800">
                                          {assignment.distance_km != null
                                            ? `${assignment.distance_km.toFixed(
                                                1
                                              )} km`
                                            : "Not available"}
                                        </p>
                                      </div>

                                      {assignment.estimated_response_minutes !=
                                        null && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                                          <p className="text-xs text-slate-500">
                                            Estimated response time
                                          </p>
                                          <p className="mt-1 text-sm font-semibold text-slate-800">
                                            {
                                              assignment.estimated_response_minutes
                                            }{" "}
                                            minutes
                                          </p>
                                        </div>
                                      )}

                                      {resource?.capacity != null && (
                                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                                          <p className="text-xs text-slate-500">
                                            Capacity
                                          </p>
                                          <p className="mt-1 text-sm font-semibold text-slate-800">
                                            {resource.capacity}
                                          </p>
                                        </div>
                                      )}
                                    </div>

                                    {!!resource?.skills?.length && (
                                      <div className="mt-3">
                                        <p className="mb-2 text-xs font-bold text-slate-500">
                                          Skills
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {resource.skills.map((skill) => (
                                            <span
                                              key={skill}
                                              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600"
                                            >
                                              {skill.replaceAll("_", " ")}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Manual resource assignment */}
                  <div className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="flex items-center gap-2 text-sm font-extrabold text-indigo-900">
                          <Users className="h-4 w-4" />
                          Resource assignment
                        </h4>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          Review the available recommendations and confirm
                          assignment manually.
                        </p>
                      </div>

                      <span className="rounded-full border border-indigo-200 bg-white px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                        ADMIN ACTION
                      </span>
                    </div>

                    {resourceLoading ? (
                      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                        <LoaderCircle className="h-4 w-4 animate-spin text-indigo-600" />
                        Loading available resources...
                      </div>
                    ) : resourceError ? (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {resourceError}

                        <button
                          type="button"
                          onClick={() => {
                            if (selectedIncident) {
                              void loadAvailableResources(selectedIncident.id);
                            }
                          }}
                          className="ml-2 font-bold underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : availableResources.length === 0 ? (
                      <p className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                        No available resources match the current
                        recommendations.
                      </p>
                    ) : (
                      <>
                        <div className="mt-4 space-y-3">
                          {availableResources.map((resource) => (
                            <label
                              key={resource.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                selectedResourceId === resource.id
                                  ? "border-indigo-300 bg-white shadow-sm"
                                  : "border-slate-200 bg-white/70 hover:border-indigo-200"
                              }`}
                            >
                              <input
                                type="radio"
                                name="selected-resource"
                                value={resource.id}
                                checked={selectedResourceId === resource.id}
                                onChange={() =>
                                  setSelectedResourceId(resource.id)
                                }
                                className="mt-1 accent-indigo-600"
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <p className="break-words text-sm font-bold text-slate-900">
                                    {resource.name}
                                  </p>

                                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    AVAILABLE
                                  </span>
                                </div>

                                <p className="mt-1 text-xs text-slate-600">
                                  {resource.resource_type.replaceAll("_", " ")}
                                  {resource.capacity !== null
                                    ? ` • Capacity: ${resource.capacity}`
                                    : ""}
                                </p>

                                {resource.distance_km !== null && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    <MapPin className="mr-1 inline h-3.5 w-3.5" />
                                    {Number(resource.distance_km).toFixed(1)} km
                                    away
                                  </p>
                                )}

                                {!!resource.skills?.length && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Skills: {resource.skills.join(", ")}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>

                        {selectedResourceId && (
                          <div className="mt-4 rounded-xl border border-indigo-200 bg-white p-4">
                            <label
                              htmlFor="selected-responder"
                              className="mb-2 block text-sm font-bold text-slate-800"
                            >
                              Select assigned responder
                            </label>

                            {(() => {
                              const selectedResource = availableResources.find(
                                (item) => item.id === selectedResourceId
                              );

                              const organizationResponders =
                                availableResponders.filter(
                                  (responder) =>
                                    responder.organization_id ===
                                    selectedResource?.organization_id
                                );

                              return organizationResponders.length > 0 ? (
                                <select
                                  id="selected-responder"
                                  value={selectedResponderId}
                                  onChange={(event) =>
                                    setSelectedResponderId(event.target.value)
                                  }
                                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                >
                                  <option value="">Choose a responder</option>

                                  {organizationResponders.map((responder) => (
                                    <option
                                      key={responder.id}
                                      value={responder.id}
                                    >
                                      {responder.full_name ||
                                        "Unnamed responder"}
                                      {responder.designation
                                        ? ` — ${responder.designation}`
                                        : ""}
                                      {responder.phone
                                        ? ` (${responder.phone})`
                                        : ""}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <p className="rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                                  No approved responders found in this
                                  resource's organization. Verify the
                                  organization and approve its responder
                                  memberships before assigning.
                                </p>
                              );
                            })()}
                          </div>
                        )}

                        <div className="mt-4">
                          <label
                            htmlFor="selected-responder"
                            className="mb-2 block text-sm font-bold text-slate-800"
                          >
                            Select responder
                          </label>

                          <select
                            id="selected-responder"
                            value={selectedResponderId}
                            onChange={(event) =>
                              setSelectedResponderId(event.target.value)
                            }
                            disabled={
                              !selectedResourceId ||
                              eligibleResponders.length === 0
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            <option value="">
                              Choose an eligible responder
                            </option>

                            {eligibleResponders.map((responder) => (
                              <option key={responder.id} value={responder.id}>
                                {responder.full_name || "Unnamed responder"}
                                {responder.designation
                                  ? ` — ${responder.designation}`
                                  : ""}
                              </option>
                            ))}
                          </select>

                          {selectedResourceId &&
                            eligibleResponders.length === 0 && (
                              <p className="mt-2 text-xs text-amber-700">
                                No approved responders are available in this
                                resource's organization.
                              </p>
                            )}
                        </div>

                        <button
                          type="button"
                          onClick={() => void assignSelectedResource()}
                          disabled={
                            !selectedResourceId ||
                            !selectedResponderId ||
                            assignmentBusy
                          }
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {assignmentBusy ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}

                          {assignmentBusy
                            ? "Assigning resource..."
                            : "Assign resource to responder"}
                        </button>
                      </>
                    )}

                    <p className="mt-3 text-[11px] leading-5 text-slate-500">
                      Assignment requires Admin confirmation. The AI system only
                      provides recommendations and does not dispatch resources
                      automatically.
                    </p>
                  </div>
                </section>
              </div>
            )}
          </section>
        )}

        {/* VERIFICATION SECTION */}
        {activeSection === "VERIFICATION" && (
          <section>
            <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900">
                Responder verification
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Review organization applications, inspect documents, and approve
                or reject verification requests.
              </p>
            </div>

            <section className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-lg shadow-slate-200/35 transition-all duration-300 hover:-translate-y-1 hover:border-blue-300"
                  >
                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-500">
                        {stat.label}
                      </span>
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </span>
                    </div>
                    <p className="mt-4 text-3xl font-extrabold tabular-nums text-slate-900">
                      {loading ? "—" : stat.count}
                    </p>
                  </div>
                );
              })}
            </section>

            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Applications
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Select an application to view its full details.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm">
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as Filter[]).map(
                  (value) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                        filter === value
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                          : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {value === "ALL" ? "All" : value}
                    </button>
                  )
                )}
              </div>
            </div>

            {loading ? (
              <div
                className={`${panelClass} flex min-h-64 items-center justify-center gap-3`}
              >
                <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-slate-500">
                  Loading applications...
                </span>
              </div>
            ) : (
              <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                {/* Application list */}
                <section className="space-y-3">
                  {visibleApplications.length === 0 ? (
                    <div className={`${panelClass} p-10 text-center`}>
                      <Activity className="mx-auto mb-4 h-8 w-8 text-blue-500" />
                      <p className="font-bold text-slate-800">
                        No applications found
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Try another filter or refresh the list.
                      </p>
                    </div>
                  ) : (
                    visibleApplications.map((application) => (
                      <button
                        type="button"
                        key={application.id}
                        onClick={() => setSelectedId(application.id)}
                        className={`w-full rounded-2xl border p-4 text-left shadow-sm transition hover:shadow-lg sm:p-5 ${
                          selectedId === application.id
                            ? "border-blue-300 bg-blue-50/80"
                            : "border-slate-200 bg-white/85 hover:border-blue-200"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="break-words font-bold text-slate-900">
                                {application.organization_name ||
                                  "Unnamed organization"}
                              </h4>
                              <p className="mt-1 break-all text-xs text-slate-500">
                                {application.organization_email ||
                                  "No organization email"}
                              </p>
                              <p className="mt-2 text-xs text-slate-400">
                                Submitted {formatDate(application.submitted_at)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusClasses(
                              application.application_status
                            )}`}
                          >
                            {application.application_status}
                          </span>
                        </div>
                      </button>
                    ))
                  )}
                </section>

                {/* Application details */}
                <section className={`${panelClass} min-w-0 p-5 sm:p-6`}>
                  {!selectedApplication ? (
                    <div className="flex min-h-72 flex-col items-center justify-center text-center">
                      <FileCheck2 className="mb-4 h-10 w-10 text-blue-500" />
                      <h3 className="font-bold text-slate-800">
                        Application details
                      </h3>
                      <p className="mt-2 max-w-xs text-sm text-slate-500">
                        Select an application to inspect its details and
                        verification documents.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6 flex items-start justify-between gap-3 border-b border-slate-100 pb-5">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                            Selected application
                          </p>
                          <h3 className="mt-2 break-words text-xl font-extrabold text-slate-900">
                            {selectedApplication.organization_name ||
                              "Unnamed organization"}
                          </h3>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusClasses(
                            selectedApplication.application_status
                          )}`}
                        >
                          {selectedApplication.application_status}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {[
                          [
                            "Organization type",
                            selectedApplication.organization_type,
                          ],
                          [
                            "Registration number",
                            selectedApplication.organization_registration_number,
                          ],
                          ["Email", selectedApplication.organization_email],
                          ["Phone", selectedApplication.organization_phone],
                          [
                            "Address",
                            [
                              selectedApplication.organization_address,
                              selectedApplication.organization_city,
                              selectedApplication.organization_state,
                              selectedApplication.organization_postal_code,
                            ]
                              .filter(Boolean)
                              .join(", "),
                          ],
                          ["Website", selectedApplication.organization_website],
                          [
                            "Representative",
                            selectedApplication.representative_contact_name,
                          ],
                          [
                            "Designation",
                            selectedApplication.representative_designation,
                          ],
                          [
                            "Representative email",
                            selectedApplication.representative_contact_email,
                          ],
                          [
                            "Representative phone",
                            selectedApplication.representative_contact_phone,
                          ],
                          [
                            "Official directory",
                            selectedApplication.official_directory_url,
                          ],
                          [
                            "Submitted at",
                            formatDate(selectedApplication.submitted_at),
                          ],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="grid grid-cols-1 gap-1 border-b border-slate-100 pb-3 sm:grid-cols-[140px_1fr] sm:gap-3"
                          >
                            <span className="text-xs font-medium text-slate-500">
                              {label}
                            </span>
                            <span className="break-words text-sm text-slate-800">
                              {value || "Not provided"}
                            </span>
                          </div>
                        ))}
                      </div>

                      {selectedApplication.review_notes && (
                        <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                          <p className="text-xs font-bold text-blue-700">
                            Previous review notes
                          </p>
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                            {selectedApplication.review_notes}
                          </p>
                        </div>
                      )}

                      {selectedApplication.rejection_reason && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                          <p className="text-xs font-bold text-red-700">
                            Rejection reason
                          </p>
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                            {selectedApplication.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* Documents */}
                      <div className="mt-6">
                        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-800">
                          <FileText className="h-4 w-4 text-blue-600" />
                          Verification documents
                        </h4>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            disabled={
                              !selectedApplication.has_authorization_document ||
                              documentBusy !== null
                            }
                            onClick={() =>
                              void previewDocument(
                                selectedApplication.id,
                                "authorization"
                              )
                            }
                            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                              Authorization document
                            </span>
                            {documentBusy ===
                            `${selectedApplication.id}:authorization` ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4 shrink-0" />
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={
                              !selectedApplication.has_representative_identity_document ||
                              documentBusy !== null
                            }
                            onClick={() =>
                              void previewDocument(
                                selectedApplication.id,
                                "identity"
                              )
                            }
                            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left text-xs font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4 shrink-0 text-indigo-600" />
                              Representative identity
                            </span>
                            {documentBusy ===
                            `${selectedApplication.id}:identity` ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4 shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Review actions */}
                      {selectedApplication.application_status.toUpperCase() ===
                      "PENDING" ? (
                        <div className="mt-7 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() =>
                              void reviewApplication(
                                selectedApplication,
                                "APPROVE"
                              )
                            }
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {busyId === selectedApplication.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={busyId !== null}
                            onClick={() =>
                              void reviewApplication(
                                selectedApplication,
                                "REJECT"
                              )
                            }
                            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                          <CheckCircle2 className="mr-2 inline h-4 w-4 text-blue-600" />
                          This application has already been reviewed.
                          {selectedApplication.reviewed_at && (
                            <p className="mt-2 text-xs text-slate-500">
                              Reviewed at{" "}
                              {formatDate(selectedApplication.reviewed_at)}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            )}
          </section>
        )}

        <footer className="mt-10 border-t border-blue-100/80 py-6 text-center text-xs text-slate-500">
          <ShieldCheck className="mr-1 inline h-4 w-4 text-blue-500" />
          ResQAI • Emergency response administration
        </footer>
      </div>
    </main>
  );
}
