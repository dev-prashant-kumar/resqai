import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Activity,
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  Globe,
  Headphones,
  Info,
  LogOut,
  MapPin,
  MapPinned,
  ShieldCheck,
  Siren,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

type Organization = {
  id: string;
  owner_user_id: string;
  organization_name: string;
  organization_type: string;
  government_level: string;
  state: string;
  district: string;
  official_email: string;
  official_phone: string;
  verification_status: string;
  department_name: string | null;
  headquarters_address: string | null;
  official_website: string | null;
  control_room_number: string | null;
  operational_areas: string[] | null;
  emergency_capabilities: string[] | null;
  verified_by: string | null;
  verified_at: string | null;
  rejection_reason: string | null;
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
};

type OrganizationApplication = {
  id: string;
  organization_id: string;
  submitted_by: string;
  application_status: string;
  organization_name: string | null;
  organization_type: string | null;
  organization_registration_number: string | null;
  organization_email: string | null;
  organization_phone: string | null;
  organization_website: string | null;
  organization_address: string | null;
  organization_city: string | null;
  organization_state: string | null;
  organization_postal_code: string | null;
  authorization_document_path: string | null;
  representative_identity_document_path: string | null;
  verification_contact_name: string | null;
  verification_contact_email: string | null;
  verification_contact_phone: string | null;
  verification_contact_designation: string | null;
  applicant_declaration: boolean | null;
  review_notes: string | null;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  updated_at: string;
};

const organizationStatusStyles: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  UNDER_REVIEW: "border-blue-200 bg-blue-50 text-blue-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  SUSPENDED: "border-slate-200 bg-slate-100 text-slate-700",
};

const applicationStatusStyles: Record<string, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  UNDER_REVIEW: "border-blue-200 bg-blue-50 text-blue-700",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  RESUBMISSION_REQUIRED:
    "border-orange-200 bg-orange-50 text-orange-700",
  NOT_SUBMITTED: "border-slate-200 bg-slate-100 text-slate-600",
};

const cardStyle =
  "group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.035)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(37,99,235,0.12)]";

const detailStyle =
  "min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-[0_8px_22px_rgba(37,99,235,0.08)]";

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not provided";

  const knownLabels: Record<string, string> = {
    PENDING: "Pending Review",
    UNDER_REVIEW: "Under Review",
    APPROVED: "Verified",
    REJECTED: "Rejected",
    SUSPENDED: "Suspended",
    RESUBMISSION_REQUIRED: "Resubmission Required",
    NOT_SUBMITTED: "Not Submitted",
  };

  if (knownLabels[value]) return knownLabels[value];

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getOrganizationStatusDescription(status: string) {
  switch (status) {
    case "APPROVED":
      return "Your organization has been approved. Access to operational responder features still depends on the permissions assigned by an authorized administrator.";

    case "PENDING":
      return "Your verification application has been submitted and is awaiting administrator review. No action is needed unless the administrator requests additional information.";

    case "UNDER_REVIEW":
      return "Your organization information is under review. You can check your application details and verification progress here.";

    case "REJECTED":
      return "Your organization has not been approved. Review the administrator's feedback and follow the instructions for any permitted resubmission.";

    case "SUSPENDED":
      return "Your organization's verification is suspended. Contact an authorized ResQAI administrator for clarification.";

    default:
      return "Your organization registration has been received. Submit the verification form and required supporting information to begin the review process.";
  }
}

function getApplicationStatusDescription(status: string) {
  switch (status) {
    case "PENDING":
      return "Your verification application has been submitted successfully and is awaiting administrator review.";
    case "UNDER_REVIEW":
      return "An administrator is reviewing your verification application.";
    case "APPROVED":
      return "Your verification application has been approved. Operational access remains subject to permissions granted by an authorized administrator.";
    case "REJECTED":
      return "Your application was rejected. Review the administrator feedback below for further instructions.";
    case "RESUBMISSION_REQUIRED":
      return "Your application requires changes. Review the administrator feedback and update the requested information.";
    case "NOT_SUBMITTED":
      return "You have not submitted a verification application yet.";
    default:
      return "Check your application details below for the latest verification status.";
  }
}

function getVerificationActionLabel(status: string) {
  if (status === "PENDING" || status === "UNDER_REVIEW") return "View Application";
  if (status === "APPROVED") return "View Verification";
  if (status === "REJECTED" || status === "RESUBMISSION_REQUIRED") return "Update Application";
  return "Start Verification";
}

async function signOutAction() {
  "use server";

  const supabase = await createClient();

  await supabase.auth.signOut();

  redirect("/login");
}

function StatusBadge({
  status,
  styles,
}: {
  status: string;
  styles: Record<string, string>;
}) {
  const approved = status === "APPROVED";

  const rejected =
    status === "REJECTED" || status === "SUSPENDED";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
        styles[status] ??
        "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      {approved ? (
        <CheckCircle2 size={14} />
      ) : rejected ? (
        <XCircle size={14} />
      ) : (
        <Clock3 size={14} />
      )}

      {formatLabel(status)}
    </span>
  );
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null | undefined;
  icon: typeof Building2;
}) {
  return (
    <div className={detailStyle}>
      <div className="flex items-center gap-2 text-slate-400 transition-colors group-hover:text-blue-600">
        <Icon size={16} />

        <span className="text-xs font-semibold">
          {label}
        </span>
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value?.trim() || "Not provided yet"}
      </p>
    </div>
  );
}

export default async function ResponderOrganizationDashboard() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Only load the organization owned by the authenticated user.
  const {
    data: organizationData,
    error: organizationError,
  } = await supabase
    .from("responder_organizations")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (organizationError) {
    console.error(
      "Failed to load responder organization:",
      organizationError.message
    );

    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10 text-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-blue-200/40 blur-3xl"
        />

        <section className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_20px_70px_rgba(37,99,235,0.12)]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <CircleAlert size={28} />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Unable to load your organization
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            ResQAI could not retrieve your organization information.
            Check your Supabase table, owner-based Row Level Security
            policies, and server configuration.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/responder"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
            >
              Try again
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  if (!organizationData) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10 text-slate-900">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 animate-pulse rounded-full bg-blue-200/40 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl"
        />

        <section className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-[0_20px_70px_rgba(37,99,235,0.12)] sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Building2 size={31} />
          </div>

          <h1 className="mt-6 text-2xl font-extrabold sm:text-3xl">
            Organization not found
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            We couldn&apos;t find an organization registered to this account.
            Sign in using the account used during government organization
            registration, or register your organization first.
          </p>

          <Link
            href="/register/responder"
            className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-blue-600/30"
          >
            Register Organization
            <ArrowRight size={18} />
          </Link>

          <form action={signOutAction}>
            <button
              type="submit"
              className="mt-4 block w-full py-3 text-sm font-semibold text-slate-500 transition hover:text-blue-700"
            >
              Sign out
            </button>
          </form>
        </section>
      </main>
    );
  }

  const organization = organizationData as Organization;

  const {
    data: applicationData,
    error: applicationError,
  } = await supabase
    .from("responder_organization_applications")
    .select("*")
    .eq("organization_id", organization.id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const application =
    applicationData as OrganizationApplication | null;

  // Verification details may be stored in the application table rather than
  // copied into responder_organizations. Prefer the profile value, then fall
  // back to the latest submitted application so the dashboard shows what the
  // organization actually submitted.
  const profileOrganizationName =
    organization.organization_name?.trim() ||
    application?.organization_name?.trim() ||
    "";
  const profileOrganizationType =
    organization.organization_type?.trim() ||
    application?.organization_type?.trim() ||
    "";
  const profileState =
    organization.state?.trim() || application?.organization_state?.trim() || "";
  const profileDistrict =
    organization.district?.trim() || application?.organization_city?.trim() || "";
  const profileEmail =
    organization.official_email?.trim() || application?.organization_email?.trim() || "";
  const profilePhone =
    organization.official_phone?.trim() || application?.organization_phone?.trim() || "";
  const profileHeadquartersAddress =
    organization.headquarters_address?.trim() ||
    [
      application?.organization_address,
      application?.organization_city,
      application?.organization_state,
      application?.organization_postal_code,
    ]
      .map((value) => value?.trim())
      .filter(Boolean)
      .join(", ");
  const profileWebsite =
    organization.official_website?.trim() || application?.organization_website?.trim() || "";

  const organizationStatus = organization.verification_status;

  const applicationStatus =
    application?.application_status ?? "NOT_SUBMITTED";

  const profileFields = [
    profileOrganizationName,
    profileOrganizationType,
    organization.government_level,
    profileState,
    profileDistrict,
    profileEmail,
    profilePhone,
    organization.department_name,
    profileHeadquartersAddress,
    profileWebsite,
    organization.control_room_number,
  ];

  const completedFields = profileFields.filter(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0
  ).length;

  const profileCompletion = Math.round(
    (completedFields / profileFields.length) * 100
  );

  const hasAuthorizationDocument = Boolean(
    application?.authorization_document_path
  );

  const hasOrganizationRegistrationNumber = Boolean(
    application?.organization_registration_number?.trim()
  );

  const hasRepresentativeIdentityDocument = Boolean(
    application?.representative_identity_document_path
  );

  const hasVerificationContact = Boolean(
    application?.verification_contact_name?.trim() &&
      application?.verification_contact_email?.trim()
  );

  // Core profile readiness is based on required identity, contact, and
  // headquarters information. Optional fields such as website, department,
  // and control-room number still contribute to the overall completion score.
  const isOrganizationProfileComplete = Boolean(
    profileOrganizationName &&
      profileOrganizationType &&
      profileState &&
      profileDistrict &&
      profileEmail &&
      profilePhone &&
      profileHeadquartersAddress
  );

  const verificationChecklist = [
    {
      label: "Organization registration",
      description: "Your organization record exists in ResQAI.",
      complete: true,
    },
    {
      label: "Organization profile",
      description: "Organization identity, contact, and headquarters information are available.",
      complete: isOrganizationProfileComplete,
    },
    {
      label: "Authorization document",
      description: "Your organization authorization document has been submitted.",
      complete: hasAuthorizationDocument,
    },
    {
      label: "Organization registration number",
      description: "Provide your official organization registration number.",
      complete: hasOrganizationRegistrationNumber,
    },
    {
      label: "Representative identity document",
      description: "Submit identification for the authorized representative.",
      complete: hasRepresentativeIdentityDocument,
    },
    {
      label: "Verification contact",
      description: "Provide the authorized representative's contact information.",
      complete: hasVerificationContact,
    },
  ];

  const completedChecklistCount = verificationChecklist.filter(
    (item) => item.complete
  ).length;

  const verificationProgress = Math.round(
    (completedChecklistCount / verificationChecklist.length) * 100
  );

  const organizationName = profileOrganizationName || "Organization";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8fbff] text-slate-900">
      {/* Animated blue background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-[-100px] h-[420px] w-[420px] animate-pulse rounded-full bg-blue-300/25 blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-100px] top-[650px] h-[380px] w-[380px] animate-pulse rounded-full bg-sky-300/20 blur-[100px]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-[1250px] h-[360px] w-[360px] rounded-full bg-indigo-200/20 blur-[100px]"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-blue-100/80 bg-white/85 shadow-[0_4px_24px_rgba(37,99,235,0.045)] backdrop-blur-2xl">
        <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            href="/responder"
            className="group flex min-w-0 items-center gap-3"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-600/25 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-blue-600/40">
              <ShieldCheck size={25} />
            </span>

            <span className="min-w-0">
              <span className="block text-xl font-extrabold tracking-tight text-slate-900">
                ResQAI
              </span>

              <span className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:block">
                Government Organization Portal
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden max-w-48 truncate text-sm font-semibold text-slate-600 md:block">
              {organizationName}
            </span>

            <Link
              href="/responder/verification"
              className="hidden min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 sm:inline-flex"
            >
              <FileCheck2 size={17} />
              {getVerificationActionLabel(applicationStatus)}
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                aria-label="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        {/* Welcome */}
        <section className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs font-bold tracking-wide text-blue-700 shadow-sm shadow-blue-100">
            <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
            ORGANIZATION CONTROL CENTER
          </div>

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="min-w-0">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Welcome to your{" "}
                <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  organization portal.
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                Manage your government organization profile, complete
                verification, and track your application for authorized
                emergency-response operations.
              </p>
            </div>

            <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3 shadow-[0_8px_30px_rgba(37,99,235,0.07)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(37,99,235,0.14)]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Building2 size={23} />
              </span>

              <div className="min-w-0">
                <p className="max-w-56 truncate text-sm font-bold text-slate-900">
                  {organizationName}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {formatLabel(profileOrganizationType)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Verification banner */}
        <section className="group relative mb-7 overflow-hidden rounded-3xl border border-blue-200/70 bg-gradient-to-br from-white via-white to-blue-50 p-5 shadow-[0_12px_40px_rgba(37,99,235,0.09)] transition-all duration-300 hover:border-blue-300 hover:shadow-[0_20px_55px_rgba(37,99,235,0.15)] sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-blue-200/50 transition-transform duration-700 group-hover:scale-110"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-1 -top-10 h-44 w-44 rounded-full border border-blue-200/40 transition-transform duration-700 group-hover:scale-110"
          />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-blue-600">
                <ShieldCheck size={19} />
                ORGANIZATION VERIFICATION
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-extrabold sm:text-3xl">
                  {formatLabel(
                    organizationStatus === "PENDING" &&
                      (applicationStatus === "PENDING" ||
                        applicationStatus === "UNDER_REVIEW")
                      ? applicationStatus
                      : organizationStatus
                  )}
                </h2>

                <StatusBadge
                  status={organizationStatus}
                  styles={organizationStatusStyles}
                />
              </div>

              <p className="mt-3 text-sm leading-7 text-slate-500">
                {application &&
                (applicationStatus === "PENDING" ||
                  applicationStatus === "UNDER_REVIEW")
                  ? getApplicationStatusDescription(applicationStatus)
                  : getOrganizationStatusDescription(organizationStatus)}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/responder/verification"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
              >
                <FileCheck2 size={18} />
                {getVerificationActionLabel(applicationStatus)}
                <ArrowRight size={18} />
              </Link>

              <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white/80 px-4 py-3 text-xs font-semibold text-slate-500">
                <CalendarDays size={16} className="text-blue-500" />
                Registered {formatDate(organization.created_at)}
              </div>
            </div>
          </div>
        </section>

        {/* Overview cards */}
        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={cardStyle}>
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-blue-100/70 blur-2xl transition-all duration-500 group-hover:bg-blue-200/80" />

            <div className="relative p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-500">
                  Profile Completion
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-100">
                  <Activity size={21} />
                </span>
              </div>

              <p className="mt-4 text-3xl font-extrabold text-slate-900">
                {profileCompletion}%
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {completedFields} of {profileFields.length} fields completed
              </p>
            </div>
          </div>

          <div className={cardStyle}>
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-indigo-100/70 blur-2xl transition-all duration-500 group-hover:bg-indigo-200/80" />

            <div className="relative p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-500">
                  Verification Progress
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-indigo-100">
                  <FileCheck2 size={21} />
                </span>
              </div>

              <p className="mt-4 text-3xl font-extrabold text-slate-900">
                {verificationProgress}%
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
                  style={{ width: `${verificationProgress}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                {completedChecklistCount} of {verificationChecklist.length} items completed
              </p>
            </div>
          </div>

          <div className={cardStyle}>
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-amber-100/70 blur-2xl transition-all duration-500 group-hover:bg-amber-200/80" />

            <div className="relative p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-500">
                  Application Status
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-amber-100">
                  <FileText size={21} />
                </span>
              </div>

              <div className="mt-4">
                <StatusBadge
                  status={applicationStatus}
                  styles={applicationStatusStyles}
                />
              </div>

              <p className="mt-3 text-xs text-slate-400">
                {application
                  ? `Submitted ${formatDate(application.submitted_at)}`
                  : "No application record found"}
              </p>
            </div>
          </div>

          <div className={cardStyle}>
            <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-100/70 blur-2xl transition-all duration-500 group-hover:bg-sky-200/80" />

            <div className="relative p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-500">
                  Government Level
                </span>

                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-sky-100">
                  <MapPinned size={21} />
                </span>
              </div>

              <p className="mt-4 break-words text-xl font-extrabold text-slate-900">
                {formatLabel(organization.government_level)}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {profileDistrict || "Not provided yet"}, {profileState || "Not provided yet"}
              </p>
            </div>
          </div>
        </section>

        {/* Main dashboard grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-6">
            {/* Organization details */}
            <section className={cardStyle}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Organization Information
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Details collected during registration and profile setup.
                  </p>
                </div>

                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:rotate-3 group-hover:scale-105">
                  <Building2 size={22} />
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
                <DetailItem
                  label="Organization Name"
                  value={profileOrganizationName || "Not provided yet"}
                  icon={Building2}
                />

                <DetailItem
                  label="Organization Type"
                  value={formatLabel(profileOrganizationType)}
                  icon={ShieldCheck}
                />

                <DetailItem
                  label="Government Level"
                  value={formatLabel(organization.government_level)}
                  icon={Users}
                />

                <DetailItem
                  label="Department Name"
                  value={organization.department_name}
                  icon={Building2}
                />

                <DetailItem
                  label="Official Email"
                  value={profileEmail}
                  icon={FileText}
                />

                <DetailItem
                  label="Official Phone"
                  value={profilePhone}
                  icon={Headphones}
                />

                <DetailItem
                  label="State"
                  value={profileState || "Not provided yet"}
                  icon={MapPin}
                />

                <DetailItem
                  label="District"
                  value={profileDistrict || "Not provided yet"}
                  icon={MapPinned}
                />

                <DetailItem
                  label="Headquarters Address"
                  value={profileHeadquartersAddress}
                  icon={MapPin}
                />

                <DetailItem
                  label="Control Room Number"
                  value={organization.control_room_number}
                  icon={Siren}
                />

                <div className={`${detailStyle} sm:col-span-2`}>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Globe size={16} />

                    <span className="text-xs font-semibold">
                      Official Website
                    </span>
                  </div>

                  {profileWebsite ? (
                    <a
                      href={profileWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all text-sm font-semibold text-blue-600 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-800"
                    >
                      {profileWebsite}
                    </a>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      Not provided yet
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-6">
                <p className="break-all text-xs leading-5 text-slate-400">
                  Organization ID: {organization.id}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Last updated: {formatDate(organization.updated_at)}
                </p>
              </div>
            </section>

            {/* Verification checklist */}
            <section className={cardStyle}>
              <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileCheck2 size={22} />
                </span>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Verification Checklist
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Track the information needed for organization verification.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 px-5 sm:px-6">
                {verificationChecklist.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 py-4 transition-colors hover:bg-blue-50/40"
                  >
                    {item.complete ? (
                      <CheckCircle2
                        size={21}
                        className="mt-0.5 shrink-0 text-emerald-500"
                      />
                    ) : (
                      <Clock3
                        size={21}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">
                        {item.label}
                      </p>

                      <p className="mt-1 text-xs leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        item.complete
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.complete ? "Complete" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 p-5 sm:p-6">
                <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <Info
                    size={19}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-blue-900">
                      Complete your verification
                    </p>

                    <p className="mt-1 text-xs leading-6 text-blue-800/75">
                      Open the verification page to complete the organization
                      profile, provide official references, and submit
                      supporting documents.
                    </p>

                    <Link
                      href="/responder/verification"
                      className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                    >
                      {getVerificationActionLabel(applicationStatus)}
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Verification application */}
            <section className={cardStyle}>
              <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileText size={22} />
                </span>

                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Verification Application
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Review your submitted application and administrator feedback.
                  </p>
                </div>
              </div>

              {applicationError ? (
                <div className="p-5 sm:p-6">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-900">
                      Application details could not be loaded.
                    </p>

                    <p className="mt-2 text-xs leading-6 text-amber-800">
                      Check the application table&apos;s SELECT policy for the
                      current submitter and organization owner.
                    </p>
                  </div>
                </div>
              ) : !application ? (
                <div className="p-6 text-center sm:p-8">
                  <FileText
                    size={30}
                    className="mx-auto text-slate-300"
                  />

                  <h3 className="mt-3 font-bold text-slate-800">
                    No application details available
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Your organization record exists, but no associated
                    verification application was returned by the database.
                  </p>

                  <Link
                    href="/responder/verification"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    Open Verification Page
                    <ArrowRight size={17} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-500">
                      Current application status
                    </span>

                    <StatusBadge
                      status={application.application_status}
                      styles={applicationStatusStyles}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <DetailItem
                      label="Verification Contact"
                      value={application.verification_contact_name}
                      icon={UserRound}
                    />
                    <DetailItem
                      label="Contact Email"
                      value={application.verification_contact_email}
                      icon={FileText}
                    />
                    <DetailItem
                      label="Contact Phone"
                      value={application.verification_contact_phone}
                      icon={Headphones}
                    />
                    <DetailItem
                      label="Contact Designation"
                      value={application.verification_contact_designation}
                      icon={Users}
                    />
                    <DetailItem
                      label="Organization Registration Number"
                      value={application.organization_registration_number}
                      icon={ShieldCheck}
                    />
                    <DetailItem
                      label="Authorization Document"
                      value={application.authorization_document_path ? "Document submitted" : "Not submitted"}
                      icon={FileCheck2}
                    />
                    <DetailItem
                      label="Representative Identity Document"
                      value={application.representative_identity_document_path ? "Document submitted" : "Not submitted"}
                      icon={FileCheck2}
                    />
                    <DetailItem
                      label="Organization Email"
                      value={application.organization_email}
                      icon={FileText}
                    />
                    <DetailItem
                      label="Organization Phone"
                      value={application.organization_phone}
                      icon={Headphones}
                    />
                    <DetailItem
                      label="Organization Address"
                      value={[
                        application.organization_address,
                        application.organization_city,
                        application.organization_state,
                        application.organization_postal_code,
                      ].filter(Boolean).join(", ")}
                      icon={MapPin}
                    />
                  </div>

                  {application.organization_website && (
                    <div className={detailStyle}>
                      <p className="text-xs font-semibold text-slate-400">
                        Organization Website
                      </p>
                      <a
                        href={application.organization_website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all text-sm font-semibold text-blue-600 underline underline-offset-4 hover:text-blue-800"
                      >
                        {application.organization_website}
                      </a>
                    </div>
                  )}

                  <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                    <p className="text-sm font-bold text-blue-900">
                      {getApplicationStatusDescription(application.application_status)}
                    </p>
                  </div>

                  {application.applicant_declaration !== null && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                      {application.applicant_declaration ? (
                        <CheckCircle2
                          size={17}
                          className="text-emerald-500"
                        />
                      ) : (
                        <CircleAlert
                          size={17}
                          className="text-amber-500"
                        />
                      )}

                      Applicant declaration:

                      <span className="font-bold text-slate-800">
                        {application.applicant_declaration
                          ? "Confirmed"
                          : "Not confirmed"}
                      </span>
                    </div>
                  )}

                  {application.review_notes && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        Administrator Review Notes
                      </p>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {application.review_notes}
                      </p>
                    </div>
                  )}

                  {(application.rejection_reason ||
                    organization.rejection_reason) && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-red-700">
                        <CircleAlert size={18} />
                        Verification Feedback
                      </p>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-red-800">
                        {application.rejection_reason ||
                          organization.rejection_reason}
                      </p>
                    </div>
                  )}

                  {application.reviewed_at && (
                    <p className="text-xs text-slate-400">
                      Last reviewed: {formatDate(application.reviewed_at)}
                    </p>
                  )}

                  <p className="text-xs text-slate-400">
                    Application submitted:{" "}
                    {formatDate(application.submitted_at)}
                  </p>

                  <Link
                    href="/responder/verification"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-bold text-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md hover:shadow-blue-100"
                  >
                    View Verification Details
                    <ArrowRight size={17} />
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-5">
            {/* Jurisdiction */}
            <section className={`${cardStyle} p-5 sm:p-6`}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover:scale-110">
                  <MapPin size={22} />
                </span>

                <div>
                  <h2 className="font-extrabold text-slate-900">
                    Jurisdiction
                  </h2>

                  <p className="text-xs text-slate-400">
                    Registered operating location
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-lg font-extrabold text-slate-900">
                  {profileDistrict || "Not provided yet"}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {profileState || "Not provided yet"}, India
                </p>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-xs font-medium text-slate-400">
                    Government Level
                  </p>

                  <p className="mt-1 text-sm font-bold text-blue-600">
                    {formatLabel(organization.government_level)}
                  </p>
                </div>

                {organization.operational_areas &&
                  organization.operational_areas.length > 0 && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <p className="text-xs font-medium text-slate-400">
                        Operational Areas
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {organization.operational_areas.map((area) => (
                          <span
                            key={area}
                            className="rounded-lg border border-blue-100 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:bg-blue-50"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </section>

            {/* Emergency capabilities */}
            <section className={`${cardStyle} p-5 sm:p-6`}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition-all duration-300 group-hover:scale-110">
                  <Siren size={22} />
                </span>

                <div>
                  <h2 className="font-extrabold text-slate-900">
                    Emergency Capabilities
                  </h2>

                  <p className="text-xs text-slate-400">
                    Registered response services
                  </p>
                </div>
              </div>

              {organization.emergency_capabilities &&
              organization.emergency_capabilities.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {organization.emergency_capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-100"
                    >
                      {formatLabel(capability)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-700">
                    No capabilities added
                  </p>

                  <p className="mt-2 text-xs leading-6 text-slate-500">
                    Emergency capabilities will appear here once they have
                    been saved to your organization profile.
                  </p>

                  <Link
                    href="/responder/verification"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    Complete your profile
                    <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </section>

            {/* Verification reminder */}
            <section className="group relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-white via-white to-amber-50 p-5 shadow-[0_8px_28px_rgba(245,158,11,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(245,158,11,0.12)] sm:p-6">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-200/40 blur-2xl transition-transform duration-500 group-hover:scale-150"
              />

              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <CircleAlert size={22} />
              </span>

              <h2 className="relative mt-4 font-extrabold text-slate-900">
                Important Notice
              </h2>

              <p className="relative mt-2 text-sm leading-7 text-slate-600">
                Organization registration alone does not authorize
                emergency-response access. Verification and the appropriate
                permissions must be granted by an authorized administrator.
              </p>

              <div className="relative mt-4 flex items-start gap-2 border-t border-amber-200/70 pt-4 text-xs leading-6 text-slate-500">
                <ShieldCheck
                  size={16}
                  className="mt-1 shrink-0 text-amber-600"
                />

                Submit genuine official information and keep your contact
                details accurate.
              </div>
            </section>

            {/* Support */}
            <section className={`${cardStyle} p-5 sm:p-6`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-all duration-300 group-hover:scale-110">
                <Headphones size={22} />
              </span>

              <h2 className="mt-4 font-extrabold text-slate-900">
                Verification Support
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                If your information is incorrect or your verification is
                delayed, contact the authorized ResQAI administrator through
                your official support channel.
              </p>

              <Link
                href="/responder/verification"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-600 transition hover:gap-3 hover:text-blue-800"
              >
                Open Verification Page
                <ArrowRight size={16} />
              </Link>
            </section>
          </aside>
        </div>

        {/* Mobile verification button */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-blue-100 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(37,99,235,0.10)] backdrop-blur-xl sm:hidden">
          <Link
            href="/responder/verification"
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.98]"
          >
            <FileCheck2 size={18} />
            {getVerificationActionLabel(applicationStatus)}
            <ArrowRight size={17} />
          </Link>
        </div>

        <footer className="pb-24 pt-9 text-center sm:pb-8">
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
            <ShieldCheck size={15} className="text-blue-500" />
            ResQAI Government Organization Portal
          </div>

          <p className="mt-2 text-xs text-slate-400">
            Secure organization information and verification tracking
          </p>
        </footer>
      </div>
    </main>
  );
}
