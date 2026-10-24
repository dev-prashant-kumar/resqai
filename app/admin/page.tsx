"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Sparkles,
} from "lucide-react";

type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

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

type ApiResponse = {
  success?: boolean;
  message?: string;
  reviewer_role?: string;
  applications?: Application[];
  total?: number;
  signed_url?: string;
};

type Filter = "ALL" | ApplicationStatus;

function formatDate(value: string | null) {
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
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

const panelClass =
  "rounded-2xl border border-slate-200/80 bg-white/85 shadow-lg shadow-slate-200/40 backdrop-blur-xl transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewerRole, setReviewerRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [documentBusy, setDocumentBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

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
        setError(
          "Access denied. This dashboard is for authorized ResQAI staff only.",
        );
        setApplications([]);
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load verification applications.",
        );
      }

      const nextApplications = result.applications ?? [];

      setApplications(nextApplications);
      setReviewerRole(result.reviewer_role ?? "");

      setSelectedId((currentId) => {
        if (
          currentId &&
          nextApplications.some((item) => item.id === currentId)
        ) {
          return currentId;
        }

        return null;
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Defer the initial request until after the effect callback finishes.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadApplications();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadApplications]);

  const pendingCount = applications.filter(
    (item) => item.application_status.toUpperCase() === "PENDING",
  ).length;

  const approvedCount = applications.filter(
    (item) => item.application_status.toUpperCase() === "APPROVED",
  ).length;

  const rejectedCount = applications.filter(
    (item) => item.application_status.toUpperCase() === "REJECTED",
  ).length;

  const visibleApplications = applications.filter((item) => {
    if (filter === "ALL") return true;
    return item.application_status.toUpperCase() === filter;
  });

  const selectedApplication =
    applications.find((item) => item.id === selectedId) ?? null;

  async function previewDocument(
    applicationId: string,
    type: "authorization" | "identity",
  ) {
    const key = `${applicationId}:${type}`;

    setDocumentBusy(key);
    setError("");
    setNotice("");

    // Open the tab synchronously to reduce the chance of popup blocking.
    const previewTab = window.open("about:blank", "_blank");

    try {
      const response = await fetch(
        `/api/admin/applications/${applicationId}/documents?type=${type}`,
        {
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.signed_url) {
        previewTab?.close();
        throw new Error(result.message || "Unable to open the document.");
      }

      if (previewTab) {
        previewTab.location.href = result.signed_url;
      } else {
        // The signed URL is external/private storage, not an app route.
        window.location.href = result.signed_url;
      }
    } catch (err) {
      previewTab?.close();

      setError(
        err instanceof Error
          ? err.message
          : "Unable to preview the document.",
      );
    } finally {
      setDocumentBusy(null);
    }
  }

  async function reviewApplication(
    application: Application,
    decision: "APPROVE" | "REJECT",
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
        `Approve "${application.organization_name || "this organization"}"? This will mark the organization as verified.`,
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
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            decision,
            review_notes: reviewNotes || null,
            ...(decision === "REJECT"
              ? { rejection_reason: rejectionReason }
              : {}),
          }),
        },
      );

      const result = (await response.json()) as ApiResponse;

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to review this application.",
        );
      }

      setNotice(
        decision === "APPROVE"
          ? "Application approved successfully."
          : "Application rejected successfully.",
      );

      await loadApplications();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected review error occurred.",
      );
    } finally {
      setBusyId(null);
    }
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
      {/* Animated blue background */}
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-100 shadow-sm shadow-blue-100">
              <ShieldCheck className="h-7 w-7 text-blue-600" />
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                ResQ<span className="text-blue-600">AI</span>{" "}
                <span className="text-slate-500">Admin</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Responder verification center
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {reviewerRole && (
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold tracking-wide text-blue-700">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                {reviewerRole}
              </span>
            )}

            <button
              type="button"
              onClick={() => void loadApplications()}
              disabled={loading}
              className="group inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition duration-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 text-blue-600 ${
                  loading
                    ? "animate-spin"
                    : "transition-transform group-hover:rotate-45"
                }`}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              <LogOut className="h-4 w-4" />
              Home
            </button>
          </div>
        </header>

        {/* Page heading */}
        <section className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-700 shadow-sm shadow-blue-100/50">
            <Sparkles className="h-4 w-4" />
            Administration
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Verification{" "}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              dashboard
            </span>
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Review responder organization applications, inspect submitted
            documents, and record your decision securely.
          </p>
        </section>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-5 rounded-2xl border border-red-200 bg-red-50/95 p-4 text-sm text-red-700 shadow-sm shadow-red-100/50"
          >
            <span className="font-bold">Something went wrong: </span>
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50/95 p-4 text-sm text-emerald-700 shadow-sm shadow-emerald-100/50"
          >
            <CheckCircle2 className="mr-2 inline h-4 w-4" />
            {notice}
          </div>
        )}

        {/* Statistics */}
        <section className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-lg shadow-slate-200/35 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-100/70"
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent} opacity-70 transition-opacity group-hover:opacity-100`}
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </span>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconBg} transition duration-300 group-hover:scale-110`}
                  >
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </span>
                </div>

                <p className="mt-4 text-3xl font-extrabold tabular-nums text-slate-900">
                  {loading ? "—" : stat.count}
                </p>

                <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full w-1/3 rounded-full bg-gradient-to-r ${stat.accent} transition-all duration-500 group-hover:w-2/3`}
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* Application list heading and filters */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Applications</h3>
            <p className="mt-1 text-sm text-slate-500">
              Select an application to view its full details.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white/80 p-1.5 shadow-sm backdrop-blur-xl">
            {(["ALL", "PENDING", "APPROVED", "REJECTED"] as Filter[]).map(
              (value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-xl px-3 py-2 text-xs font-bold transition-all duration-300 ${
                    filter === value
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200"
                      : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {value === "ALL" ? "All" : value}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Main content */}
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
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                    <Activity className="h-7 w-7 text-blue-500" />
                  </div>
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
                    className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-100/60 sm:p-5 ${
                      selectedId === application.id
                        ? "border-blue-300 bg-blue-50/80 shadow-md shadow-blue-100/70"
                        : "border-slate-200 bg-white/85 hover:border-blue-200 hover:bg-white"
                    }`}
                  >
                    <div
                      className={`absolute bottom-0 left-0 top-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-400 transition-opacity ${
                        selectedId === application.id
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                    />

                    <div className="flex flex-wrap items-start justify-between gap-3 pl-1">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 transition duration-300 group-hover:scale-105">
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
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${statusClasses(application.application_status)}`}
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
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <FileCheck2 className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-slate-800">
                    Application details
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                    Select an application to inspect its details and review
                    its verification documents.
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
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusClasses(selectedApplication.application_status)}`}
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
                            "authorization",
                          )
                        }
                        className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left text-xs font-semibold text-slate-600 transition-all duration-300 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-blue-600" />
                          Authorization document
                        </span>
                        {documentBusy ===
                        `${selectedApplication.id}:authorization` ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
                            "identity",
                          )
                        }
                        className="group flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left text-xs font-semibold text-slate-600 transition-all duration-300 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 shrink-0 text-indigo-600" />
                          Representative identity
                        </span>
                        {documentBusy ===
                        `${selectedApplication.id}:identity` ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
                            "APPROVE",
                          )
                        }
                        className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyId === selectedApplication.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                        )}
                        Approve
                      </button>

                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() =>
                          void reviewApplication(
                            selectedApplication,
                            "REJECT",
                          )
                        }
                        className="group flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:shadow-lg hover:shadow-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
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

        <footer className="mt-10 border-t border-blue-100/80 py-6 text-center text-xs text-slate-500">
          <ShieldCheck className="mr-1 inline h-4 w-4 text-blue-500" />
          ResQAI • Authorized responder verification workflow
        </footer>
      </div>
    </main>
  );
}
