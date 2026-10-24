"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent, type ChangeEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  FileText,
  Fingerprint,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";

type VerificationForm = {
  organizationName: string;
  registrationNumber: string;
  organizationType: string;
  officialEmail: string;
  officialPhone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  representativeName: string;
  representativeDesignation: string;
  representativeEmail: string;
  representativePhone: string;
  declaration: boolean;
};

type TextFieldName = Exclude<keyof VerificationForm, "declaration">;

type Notification = {
  type: "error" | "success";
  title: string;
  message: string;
};

const initialForm: VerificationForm = {
  organizationName: "",
  registrationNumber: "",
  organizationType: "",
  officialEmail: "",
  officialPhone: "",
  website: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  representativeName: "",
  representativeDesignation: "",
  representativeEmail: "",
  representativePhone: "",
  declaration: false,
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100";

const labelClass = "text-sm font-semibold text-slate-700";

const cardClass =
  "relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_18px_45px_rgba(37,99,235,0.12)] sm:p-7";

function SectionHeading({
  icon: Icon,
  title,
  description,
  number,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
  number: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600 transition-transform duration-300 group-hover:scale-105">
        <Icon size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Section {number}
          </span>
        </div>

        <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  autoComplete,
  disabled = false,
}: {
  label: string;
  name: TextFieldName;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  autoComplete?: string;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className={labelClass}>
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        className={inputClass}
      />
    </div>
  );
}

function NotificationBanner({
  notification,
  onDismiss,
}: {
  notification: Notification;
  onDismiss: () => void;
}) {
  const isSuccess = notification.type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
      className={`animate-in fade-in slide-in-from-top-2 flex items-start gap-3 rounded-2xl border p-4 shadow-sm duration-300 ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isSuccess
            ? "bg-emerald-100 text-emerald-700"
            : "bg-rose-100 text-rose-700"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 size={20} />
        ) : (
          <CircleAlert size={20} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{notification.title}</p>
        <p className="mt-1 text-sm leading-6 opacity-90">
          {notification.message}
        </p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
          isSuccess
            ? "text-emerald-700 hover:bg-emerald-100"
            : "text-rose-700 hover:bg-rose-100"
        }`}
      >
        <X size={17} />
      </button>
    </div>
  );
}

export default function ResponderVerificationPage() {
  const [form, setForm] = useState<VerificationForm>(initialForm);

  const [registrationDocument, setRegistrationDocument] =
    useState<File | null>(null);

  const [representativeDocument, setRepresentativeDocument] =
    useState<File | null>(null);

  const [notification, setNotification] = useState<Notification | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registrationInputRef = useRef<HTMLInputElement>(null);
  const representativeInputRef = useRef<HTMLInputElement>(null);

  const isSubmitted = notification?.type === "success";

  function clearNotification() {
    setNotification(null);
  }

  function handleChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    clearNotification();
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    documentType: "registration" | "representative",
  ) {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setNotification({
        type: "error",
        title: "Unsupported file type",
        message: "Choose a PDF, JPG, PNG, or WEBP document.",
      });

      event.target.value = "";
      return;
    }

    if (file.size === 0) {
      setNotification({
        type: "error",
        title: "Empty document",
        message: "The selected file is empty. Please choose another document.",
      });

      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setNotification({
        type: "error",
        title: "Document is too large",
        message: "Each document must be 5 MB or smaller.",
      });

      event.target.value = "";
      return;
    }

    if (documentType === "registration") {
      setRegistrationDocument(file);
    } else {
      setRepresentativeDocument(file);
    }

    clearNotification();
  }

  function removeFile(documentType: "registration" | "representative") {
    if (documentType === "registration") {
      setRegistrationDocument(null);

      if (registrationInputRef.current) {
        registrationInputRef.current.value = "";
      }
    } else {
      setRepresentativeDocument(null);

      if (representativeInputRef.current) {
        representativeInputRef.current.value = "";
      }
    }

    clearNotification();
  }

  function showValidationError(message: string) {
    setNotification({
      type: "error",
      title: "Please check your application",
      message,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    clearNotification();

    // Validate organization and representative details.
    const requiredFields: {
      key: TextFieldName;
      label: string;
    }[] = [
      { key: "organizationName", label: "organization name" },
      { key: "registrationNumber", label: "registration number" },
      { key: "organizationType", label: "organization type" },
      { key: "officialEmail", label: "official email address" },
      { key: "officialPhone", label: "official contact number" },
      { key: "address", label: "registered address" },
      { key: "city", label: "city" },
      { key: "state", label: "state or union territory" },
      { key: "postalCode", label: "postal code" },
      { key: "representativeName", label: "representative name" },
      {
        key: "representativeDesignation",
        label: "representative designation",
      },
      { key: "representativeEmail", label: "representative email" },
      { key: "representativePhone", label: "representative phone number" },
    ];

    const missingField = requiredFields.find(
      ({ key }) => !form[key].trim(),
    );

    if (missingField) {
      showValidationError(
        `Please enter the ${missingField.label} before submitting.`,
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.officialEmail.trim())) {
      showValidationError("Please enter a valid organization email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.representativeEmail.trim())) {
      showValidationError("Please enter a valid representative email address.");
      return;
    }

    if (form.website.trim()) {
      try {
        const websiteUrl = new URL(form.website.trim());

        if (!["http:", "https:"].includes(websiteUrl.protocol)) {
          showValidationError(
            "The organization website must begin with https:// or http://.",
          );
          return;
        }
      } catch {
        showValidationError(
          "Please enter a valid website URL, such as https://example.org.",
        );
        return;
      }
    }

    if (!registrationDocument) {
      showValidationError(
        "Please upload your organization's registration document.",
      );
      return;
    }

    if (!representativeDocument) {
      showValidationError(
        "Please upload an identity document for the authorized representative.",
      );
      return;
    }

    if (!form.declaration) {
      showValidationError(
        "Please confirm the verification declaration before submitting.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Organization details.
      formData.append("organizationName", form.organizationName.trim());
      formData.append("registrationNumber", form.registrationNumber.trim());
      formData.append("organizationType", form.organizationType);
      formData.append("officialEmail", form.officialEmail.trim());
      formData.append("officialPhone", form.officialPhone.trim());
      formData.append("website", form.website.trim());
      formData.append("address", form.address.trim());
      formData.append("city", form.city.trim());
      formData.append("state", form.state.trim());
      formData.append("postalCode", form.postalCode.trim());

      // Authorized representative details.
      formData.append("representativeName", form.representativeName.trim());
      formData.append(
        "representativeDesignation",
        form.representativeDesignation.trim(),
      );
      formData.append("representativeEmail", form.representativeEmail.trim());
      formData.append("representativePhone", form.representativePhone.trim());

      // Supporting documents.
      formData.append("registrationDocument", registrationDocument);
      formData.append("representativeDocument", representativeDocument);

      // The server must validate this declaration too.
      formData.append("declaration", String(form.declaration));

      const response = await fetch("/api/responder/verification", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });

      const result: {
        success?: boolean;
        message?: string;
        error?: string;
      } = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        let message =
          result.message ||
          result.error ||
          "We couldn't submit your verification application. Please try again.";

        if (response.status === 401) {
          message =
            "Your session may have expired. Please sign in again and retry.";
        } else if (response.status === 409) {
          message =
            result.message ||
            "A verification application may already exist or be under review. Check your current application status before submitting again.";
        } else if (response.status === 413) {
          message =
            "The uploaded documents are too large for the server to process. Use smaller files and try again.";
        } else if (response.status >= 500) {
          message =
            "The server encountered a problem while processing your application. Please try again later.";
        }

        setNotification({
          type: "error",
          title: "Submission unsuccessful",
          message,
        });

        return;
      }

      setNotification({
        type: "success",
        title: "Verification application submitted",
        message:
          result.message ||
          "Your application and documents have been submitted successfully. Your application is now awaiting administrator review. Your organization is not verified yet.",
      });

      // Clear the form only after the server confirms a successful submission.
      setForm(initialForm);
      setRegistrationDocument(null);
      setRepresentativeDocument(null);

      if (registrationInputRef.current) {
        registrationInputRef.current.value = "";
      }

      if (representativeInputRef.current) {
        representativeInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Responder verification submission failed:", error);

      setNotification({
        type: "error",
        title: "Connection problem",
        message:
          "We couldn't connect to the verification service. Check your internet connection and make sure the ResQAI server is running, then try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Animated ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] animate-pulse rounded-full bg-blue-400/15 blur-[100px]" />

        <div
          className="absolute -right-40 top-40 h-[32rem] w-[32rem] animate-pulse rounded-full bg-sky-400/15 blur-[120px]"
          style={{ animationDelay: "1.5s", animationDuration: "7s" }}
        />

        <div
          className="absolute -bottom-48 left-1/3 h-[30rem] w-[30rem] animate-pulse rounded-full bg-indigo-400/10 blur-[120px]"
          style={{ animationDelay: "2s", animationDuration: "8s" }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.055),transparent_50%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/responder"
            className="group inline-flex items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-80 focus-visible:ring-4 focus-visible:ring-blue-500/20"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
              <ShieldCheck size={23} />
            </div>

            <div>
              <p className="text-base font-extrabold tracking-tight text-slate-900">
                ResQAI
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
                Responder Portal
              </p>
            </div>
          </Link>

          <Link
            href="/responder"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:px-4"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Page heading */}
        <div className="mb-8 max-w-3xl animate-in fade-in slide-in-from-bottom-3 duration-700">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm shadow-blue-500/5">
            <Fingerprint size={15} />
            Organization verification
          </div>

          <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Complete your{" "}
            <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
              verification
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Provide your organization&apos;s official details and supporting
            documents. The ResQAI team will review your application before
            your organization can be verified.
          </p>
        </div>

        {/* Information banner */}
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-5 shadow-[0_10px_40px_rgba(37,99,235,0.07)] transition-all duration-300 hover:shadow-[0_16px_45px_rgba(37,99,235,0.12)] sm:p-6">
          <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-600 shadow-sm">
              <LockKeyhole size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">Before you begin</h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Keep your organization registration details and representative
                identity document ready. Files must be PDF, JPG, PNG, or WEBP
                and no larger than 5 MB each. Your application will remain
                pending until an authorized administrator reviews it.
              </p>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Main form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-busy={isSubmitting}
            className="space-y-6"
          >
            {/* Organization details */}
            <section className={`${cardClass} group`}>
              <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-400/[0.06] blur-3xl transition-all duration-500 group-hover:bg-blue-400/[0.12]" />

              <div className="relative">
                <SectionHeading
                  icon={Building2}
                  number="01"
                  title="Organization details"
                  description="Enter the official information associated with your responder organization."
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="organizationName" className={labelClass}>
                      Official organization name
                      <span className="ml-1 text-rose-500">*</span>
                    </label>

                    <input
                      id="organizationName"
                      name="organizationName"
                      value={form.organizationName}
                      onChange={handleChange}
                      placeholder="Enter your registered organization name"
                      autoComplete="organization"
                      required
                      disabled={isSubmitting || isSubmitted}
                      className={inputClass}
                    />
                  </div>

                  <Field
                    label="Registration number"
                    name="registrationNumber"
                    value={form.registrationNumber}
                    onChange={handleChange}
                    placeholder="Enter registration number"
                    required
                    disabled={isSubmitting || isSubmitted}
                  />

                  <div>
                    <label htmlFor="organizationType" className={labelClass}>
                      Organization type
                      <span className="ml-1 text-rose-500">*</span>
                    </label>

                    <select
                      id="organizationType"
                      name="organizationType"
                      value={form.organizationType}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting || isSubmitted}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="">Select organization type</option>
                      <option value="NGO">NGO / Non-profit</option>
                      <option value="GOVERNMENT">Government agency</option>
                      <option value="EMERGENCY_SERVICES">
                        Emergency services
                      </option>
                      <option value="HOSPITAL">
                        Hospital / Medical services
                      </option>
                      <option value="FIRE_AND_RESCUE">Fire and rescue</option>
                      <option value="DISASTER_RESPONSE">
                        Disaster response team
                      </option>
                      <option value="VOLUNTEER_GROUP">Volunteer group</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <Field
                    label="Official email address"
                    name="officialEmail"
                    type="email"
                    value={form.officialEmail}
                    onChange={handleChange}
                    placeholder="organization@example.org"
                    required
                    autoComplete="email"
                    disabled={isSubmitting || isSubmitted}
                  />

                  <Field
                    label="Official contact number"
                    name="officialPhone"
                    type="tel"
                    value={form.officialPhone}
                    onChange={handleChange}
                    placeholder="+91 00000 00000"
                    required
                    autoComplete="tel"
                    disabled={isSubmitting || isSubmitted}
                  />

                  <div className="sm:col-span-2">
                    <Field
                      label="Official website"
                      name="website"
                      type="url"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="https://example.org (optional)"
                      disabled={isSubmitting || isSubmitted}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Address details */}
            <section className={`${cardClass} group`}>
              <SectionHeading
                icon={MapPin}
                number="02"
                title="Registered address"
                description="Provide the registered or primary operating address for your organization."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClass}>
                    Street address
                    <span className="ml-1 text-rose-500">*</span>
                  </label>

                  <textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Building, street, area, or locality"
                    required
                    rows={3}
                    disabled={isSubmitting || isSubmitted}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                <Field
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Enter city"
                  required
                  autoComplete="address-level2"
                  disabled={isSubmitting || isSubmitted}
                />

                <Field
                  label="State / Union Territory"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="Enter state"
                  required
                  autoComplete="address-level1"
                  disabled={isSubmitting || isSubmitted}
                />

                <Field
                  label="Postal code"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  placeholder="Enter postal code"
                  required
                  autoComplete="postal-code"
                  disabled={isSubmitting || isSubmitted}
                />
              </div>
            </section>

            {/* Representative details */}
            <section className={`${cardClass} group`}>
              <SectionHeading
                icon={UserRound}
                number="03"
                title="Authorized representative"
                description="Enter the details of the person authorized to represent this organization."
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Representative full name"
                  name="representativeName"
                  value={form.representativeName}
                  onChange={handleChange}
                  placeholder="Enter full legal name"
                  required
                  autoComplete="name"
                  disabled={isSubmitting || isSubmitted}
                />

                <Field
                  label="Designation / role"
                  name="representativeDesignation"
                  value={form.representativeDesignation}
                  onChange={handleChange}
                  placeholder="e.g. Director, Coordinator"
                  required
                  disabled={isSubmitting || isSubmitted}
                />

                <Field
                  label="Representative email"
                  name="representativeEmail"
                  type="email"
                  value={form.representativeEmail}
                  onChange={handleChange}
                  placeholder="representative@example.org"
                  required
                  autoComplete="email"
                  disabled={isSubmitting || isSubmitted}
                />

                <Field
                  label="Representative contact number"
                  name="representativePhone"
                  type="tel"
                  value={form.representativePhone}
                  onChange={handleChange}
                  placeholder="+91 00000 00000"
                  required
                  autoComplete="tel"
                  disabled={isSubmitting || isSubmitted}
                />
              </div>
            </section>

            {/* Document uploads */}
            <section className={`${cardClass} group`}>
              <SectionHeading
                icon={FileCheck2}
                number="04"
                title="Supporting documents"
                description="Upload clear, valid documents that support your organization's identity and registration."
              />

              <div className="space-y-5">
                <DocumentUpload
                  title="Organization registration document"
                  description="Registration certificate or another official document confirming the organization's identity."
                  file={registrationDocument}
                  inputId="registrationDocument"
                  inputRef={registrationInputRef}
                  onChange={(event) =>
                    handleFileChange(event, "registration")
                  }
                  onRemove={() => removeFile("registration")}
                  required
                  disabled={isSubmitting || isSubmitted}
                />

                <DocumentUpload
                  title="Representative identity document"
                  description="A valid identity document for the authorized representative."
                  file={representativeDocument}
                  inputId="representativeDocument"
                  inputRef={representativeInputRef}
                  onChange={(event) =>
                    handleFileChange(event, "representative")
                  }
                  onRemove={() => removeFile("representative")}
                  required
                  disabled={isSubmitting || isSubmitted}
                />
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                <CircleAlert
                  size={19}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <p className="text-xs leading-6 text-amber-900">
                  Only upload documents you are authorized to share. Your files
                  are sent to the ResQAI server for processing. Do not submit
                  real sensitive identity documents while testing with
                  development data.
                </p>
              </div>
            </section>

            {/* Declaration */}
            <section className={`${cardClass} group`}>
              <SectionHeading
                icon={ShieldCheck}
                number="05"
                title="Verification declaration"
                description="Review and confirm the accuracy of the information you have provided."
              />

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50">
                <input
                  type="checkbox"
                  name="declaration"
                  checked={form.declaration}
                  onChange={(event) => {
                    setForm((previous) => ({
                      ...previous,
                      declaration: event.target.checked,
                    }));

                    clearNotification();
                  }}
                  disabled={isSubmitting || isSubmitted}
                  className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                />

                <span className="text-sm leading-6 text-slate-700">
                  I confirm that the information and documents provided are
                  accurate to the best of my knowledge. I am authorized to
                  submit this information on behalf of the organization, and I
                  understand that submission does not guarantee verification or
                  approval.
                  <span className="ml-1 text-rose-500">*</span>
                </span>
              </label>
            </section>

            {/* Notifications */}
            {notification && (
              <NotificationBanner
                notification={notification}
                onDismiss={clearNotification}
              />
            )}

            {/* Submit actions */}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/responder"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <ArrowLeft size={17} />
                Back to dashboard
              </Link>

              <button
                type="submit"
                disabled={isSubmitting || isSubmitted}
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all duration-300 hover:-translate-y-1 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-600/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Submitting application...
                  </>
                ) : isSubmitted ? (
                  <>
                    <CheckCircle2 size={18} />
                    Application submitted
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Submit for verification
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs leading-5 text-slate-400 sm:text-right">
              Your organization is not verified until an authorized
              administrator approves the application.
            </p>
          </form>

          {/* Right sidebar */}
          <aside className="space-y-5 lg:sticky lg:top-28">
            {/* Steps */}
            <div className={`${cardClass} group`}>
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FileText size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Verification steps
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Your verification journey
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {[
                  {
                    title: "Organization details",
                    description: "Registration and contact information",
                  },
                  {
                    title: "Representative details",
                    description: "Authorized contact information",
                  },
                  {
                    title: "Document review",
                    description: "Registration and identity documents",
                  },
                  {
                    title: "Admin review",
                    description: "Review and approval by authorized staff",
                  },
                ].map((step, index) => (
                  <div key={step.title} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-bold text-blue-700">
                        {index + 1}
                      </div>

                      {index < 3 && (
                        <div className="mt-1 h-full min-h-5 w-px bg-gradient-to-b from-blue-200 to-slate-200" />
                      )}
                    </div>

                    <div className="pb-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {step.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div className={`${cardClass} group`}>
              <h2 className="font-bold text-slate-900">Before submitting</h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Make sure you have everything ready.
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Official organization details",
                  "Valid registration number",
                  "Authorized representative details",
                  "Registration certificate",
                  "Representative identity document",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={17}
                      className="mt-0.5 shrink-0 text-blue-500"
                    />
                    <p className="text-sm leading-5 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Support card */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-[0_15px_45px_rgba(37,99,235,0.22)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(37,99,235,0.28)]">
              <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-3xl" />

              <div className="relative">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <ShieldCheck size={22} />
                </div>

                <h2 className="text-lg font-bold">Need assistance?</h2>

                <p className="mt-2 text-sm leading-6 text-blue-100">
                  If you have questions about the verification requirements,
                  contact your ResQAI administrator.
                </p>

                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-white/90">
                  <LockKeyhole size={15} />
                  Secure review process
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200/80 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-center text-xs text-slate-400 sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} ResQAI. All rights reserved.</p>

            <p className="inline-flex items-center gap-2">
              <ShieldCheck size={14} className="text-blue-500" />
              Responder organization verification
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

function DocumentUpload({
  title,
  description,
  file,
  inputId,
  inputRef,
  onChange,
  onRemove,
  required = false,
  disabled = false,
}: {
  title: string;
  description: string;
  file: File | null;
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 hover:border-blue-200 hover:bg-blue-50/30 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm">
          <FileText size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-800">
            {title}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600">
            <CheckCircle2 size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-emerald-800">
              {file.name}
            </p>
            <p className="mt-0.5 text-xs text-emerald-700">
              {(file.size / 1024 / 1024).toFixed(2)} MB · Selected locally
            </p>
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            aria-label={`Remove ${file.name}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={`group/upload flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center transition-all duration-300 ${
            disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-blue-400 hover:bg-blue-50/50"
          }`}
        >
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-all duration-300 group-hover/upload:scale-110 group-hover/upload:bg-blue-100">
            <Upload size={21} />
          </div>

          <p className="text-sm font-semibold text-slate-700">
            <span className="text-blue-600">Choose a file</span> to upload
          </p>

          <p className="mt-1 text-xs text-slate-400">
            PDF, JPG, PNG, or WEBP · Max 5 MB
          </p>

          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
          />
        </label>
      )}
    </div>
  );
}
