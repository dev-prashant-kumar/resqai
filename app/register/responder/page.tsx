"use client";

import { useState, type FormEvent, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Flame,
  HeartPulse,
  Landmark,
  LoaderCircle,
  LockKeyhole,
  Mail,
  MapPin,
  Shield,
  ShieldCheck,
  Siren,
  Users,
  Waves,
  Phone,
  Sparkles,
  BadgeCheck,
  Globe2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ORGANIZATION_TYPES = [
  {
    value: "POLICE",
    label: "Police & Law Enforcement",
    description: "Police departments and law enforcement agencies",
    icon: ShieldCheck,
    color: "#60a5fa",
  },
  {
    value: "FIRE_RESCUE",
    label: "Fire & Emergency Services",
    description: "Fire departments and rescue services",
    icon: Flame,
    color: "#fb923c",
  },
  {
    value: "DISASTER_RESPONSE",
    label: "Disaster Response Forces",
    description: "SDRF, NDRF and disaster response units",
    icon: Siren,
    color: "#c084fc",
  },
  {
    value: "MEDICAL",
    label: "Government Medical Services",
    description: "Government hospitals and emergency medical teams",
    icon: HeartPulse,
    color: "#fb7185",
  },
  {
    value: "CIVIL_DEFENCE",
    label: "Civil Defence",
    description: "Civil defence and emergency preparedness",
    icon: Users,
    color: "#34d399",
  },
  {
    value: "DISTRICT_ADMINISTRATION",
    label: "District Administration",
    description: "District authorities and government administration",
    icon: Landmark,
    color: "#fbbf24",
  },
  {
    value: "SEARCH_RESCUE",
    label: "Search & Rescue",
    description: "Government search and rescue units",
    icon: Waves,
    color: "#22d3ee",
  },
  {
    value: "OTHER_GOVERNMENT",
    label: "Other Government Emergency Unit",
    description: "Other authorized government emergency services",
    icon: Building2,
    color: "#a5b4fc",
  },
];

const GOVERNMENT_LEVELS = [
  { value: "DISTRICT", label: "District Government" },
  { value: "STATE", label: "State Government" },
  { value: "NATIONAL", label: "National Government" },
];

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

type RegistrationForm = {
  organizationName: string;
  organizationType: string;
  governmentLevel: string;
  state: string;
  district: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  authorized: boolean;
};

const INITIAL_FORM: RegistrationForm = {
  organizationName: "",
  organizationType: "",
  governmentLevel: "DISTRICT",
  state: "",
  district: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  authorized: false,
};

function Field({
  label,
  icon: Icon,
  children,
  className = "",
}: {
  label: string;
  icon: typeof Building2;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`field-group ${className}`}>
      <label className="field-label">
        <Icon size={15} strokeWidth={1.8} />
        <span>{label}</span>
      </label>
      {children}
    </div>
  );
}

export default function ResponderRegistrationPage() {
  const [form, setForm] = useState<RegistrationForm>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const updateField = <K extends keyof RegistrationForm>(
    key: K,
    value: RegistrationForm[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError("");
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const organizationName = form.organizationName.trim();
    const district = form.district.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (
      !organizationName ||
      !form.organizationType ||
      !form.governmentLevel ||
      !form.state ||
      !district ||
      !email ||
      !phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^[+]?[\d\s()-]{7,20}$/.test(phone)) {
      setError("Please enter a valid contact number.");
      return;
    }

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      setError("Use at least one letter and one number in your password.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (!form.authorized) {
      setError("Please confirm that you are authorized to register this organization.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: organizationName,
            organization_name: organizationName,
            organization_type: form.organizationType,
            government_level: form.governmentLevel,
            state: form.state,
            district,
            phone,
            requested_role: "RESPONDER",
            account_type: "GOVERNMENT_ORGANIZATION",
            organization_application_status: "PENDING_VERIFICATION",
            registration_source: "RESPONDER_ORGANIZATION_REGISTRATION",
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      if (!data.user) {
        throw new Error("Your account could not be created. Please try again.");
      }

      setSuccess(
        data.session
          ? "Your account has been created. Your organization must complete verification before responder access can be granted."
          : "Your registration has been received. Check your email for a verification link, then sign in to continue your organization verification.",
      );

      setForm(INITIAL_FORM);
    } catch (caughtError: unknown) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong. Please try again.";

      if (message.toLowerCase().includes("already registered")) {
        setError(
          "An account with this email already exists. Please sign in instead.",
        );
      } else if (
        message.toLowerCase().includes("password should") ||
        message.toLowerCase().includes("weak password")
      ) {
        setError("Please choose a stronger password.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    "--field-accent": "#38bdf8",
  } as CSSProperties;

  return (
    <main className="registration-page">
      <style jsx global>{`
         /* WHITE + BLUE ANIMATED BACKGROUND THEME */
         
         * {
           box-sizing: border-box;
         }
         
         html {
           scroll-behavior: smooth;
         }
         
         body {
           margin: 0;
           background: #f4f8ff;
         }
         
         .registration-page {
           --bg: #f4f8ff;
           --panel: rgba(255, 255, 255, 0.88);
           --text: #172554;
           --muted: #64748b;
           --border: rgba(59, 130, 246, 0.16);
         
           position: relative;
           isolation: isolate;
           min-height: 100vh;
           overflow: hidden;
           padding: 24px;
           color: var(--text);
         
           background:
             radial-gradient(
               ellipse at 12% 8%,
               rgba(96, 165, 250, 0.20),
               transparent 38%
             ),
             radial-gradient(
               ellipse at 92% 78%,
               rgba(129, 140, 248, 0.18),
               transparent 42%
             ),
             linear-gradient(135deg, #f8fbff 0%, #edf5ff 48%, #f7f9ff 100%);
         
           font-family: Arial, Helvetica, sans-serif;
         }
         
         .ambient-grid {
           position: absolute;
           inset: 0;
           z-index: -2;
           pointer-events: none;
           opacity: 0.42;
         
           background-image:
             linear-gradient(rgba(59, 130, 246, 0.055) 1px, transparent 1px),
             linear-gradient(90deg, rgba(59, 130, 246, 0.055) 1px, transparent 1px);
         
           background-size: 48px 48px;
           mask-image: linear-gradient(to bottom, black, transparent 90%);
         }
         
         .ambient-orb {
           position: absolute;
           z-index: -1;
           width: 340px;
           height: 340px;
           border-radius: 50%;
           filter: blur(85px);
           pointer-events: none;
           opacity: 0.42;
           animation: orbFloat 13s ease-in-out infinite alternate;
         }
         
         .orb-one {
           top: 7%;
           left: -180px;
           background: #60a5fa;
         }
         
         .orb-two {
           top: 48%;
           right: -190px;
           background: #818cf8;
           animation-delay: -5s;
         }
         
         .orb-three {
           bottom: -250px;
           left: 32%;
           background: #38bdf8;
           animation-delay: -8s;
         }
         
         .page-shell {
           width: 100%;
           max-width: 1100px;
           margin: 0 auto;
         }
         
         .topbar {
           display: flex;
           align-items: center;
           justify-content: space-between;
           gap: 16px;
           margin: 0 auto 28px;
           max-width: 1000px;
         }
         
         .brand {
           display: inline-flex;
           align-items: center;
           gap: 12px;
           color: #172554;
           text-decoration: none;
         }
         
         .brand-mark {
           display: grid;
           width: 46px;
           height: 46px;
           flex-shrink: 0;
           place-items: center;
           border: 1px solid rgba(59, 130, 246, 0.22);
           border-radius: 15px;
           background: linear-gradient(
             145deg,
             rgba(96, 165, 250, 0.18),
             rgba(129, 140, 248, 0.16)
           );
           color: #2563eb;
           box-shadow: 0 8px 28px rgba(37, 99, 235, 0.10);
         }
         
         .brand-name {
           font-size: 20px;
           font-weight: 900;
           letter-spacing: 0.12em;
         }
         
         .brand-subtitle {
           margin-top: 4px;
           color: #64748b;
           font-size: 10px;
           font-weight: 700;
           letter-spacing: 0.19em;
         }
         
         .secure-badge {
           display: inline-flex;
           align-items: center;
           gap: 7px;
           padding: 10px 13px;
           border: 1px solid rgba(37, 99, 235, 0.15);
           border-radius: 999px;
           background: rgba(255, 255, 255, 0.72);
           color: #1d4ed8;
           font-size: 12px;
           font-weight: 600;
           box-shadow: 0 4px 18px rgba(37, 99, 235, 0.05);
         }
         
         .layout {
           display: grid;
           grid-template-columns: 0.84fr 1.3fr;
           gap: 24px;
           align-items: start;
         }
         
         .intro-panel {
           position: sticky;
           top: 24px;
           overflow: hidden;
           padding: 32px 27px;
           border: 1px solid rgba(96, 165, 250, 0.20);
           border-radius: 26px;
         
           background:
             radial-gradient(
               circle at 0 0,
               rgba(96, 165, 250, 0.15),
               transparent 42%
             ),
             linear-gradient(
               145deg,
               rgba(255, 255, 255, 0.94),
               rgba(239, 246, 255, 0.92)
             );
         
           box-shadow:
             0 25px 70px rgba(30, 64, 175, 0.08),
             inset 0 1px 0 rgba(255, 255, 255, 0.95);
         }
         
         .intro-panel::before {
           position: absolute;
           top: -100px;
           right: -100px;
           width: 250px;
           height: 250px;
           border: 1px solid rgba(59, 130, 246, 0.12);
           border-radius: 50%;
           content: "";
           box-shadow:
             0 0 0 25px rgba(59, 130, 246, 0.035),
             0 0 0 55px rgba(59, 130, 246, 0.025);
           pointer-events: none;
         }
         
         .eyebrow {
           display: inline-flex;
           align-items: center;
           gap: 7px;
           padding: 8px 11px;
           border: 1px solid rgba(37, 99, 235, 0.14);
           border-radius: 999px;
           background: rgba(219, 234, 254, 0.75);
           color: #1d4ed8;
           font-size: 10px;
           font-weight: 800;
           letter-spacing: 0.11em;
           text-transform: uppercase;
         }
         
         .intro-title {
           margin: 26px 0 16px;
           font-size: clamp(30px, 3vw, 43px);
           font-weight: 850;
           line-height: 1.13;
           letter-spacing: -0.055em;
           color: #172554;
         }
         
         .gradient-text {
           background: linear-gradient(100deg, #0284c7 0%, #2563eb 50%, #6366f1 100%);
           background-clip: text;
           -webkit-background-clip: text;
           -webkit-text-fill-color: transparent;
         }
         
         .intro-description {
           margin: 0;
           color: #64748b;
           font-size: 14px;
           line-height: 1.85;
         }
         
         .benefit-list {
           display: grid;
           gap: 19px;
           margin-top: 35px;
         }
         
         .benefit {
           display: flex;
           align-items: flex-start;
           gap: 12px;
         }
         
         .benefit-icon {
           display: grid;
           width: 36px;
           height: 36px;
           flex-shrink: 0;
           place-items: center;
           border: 1px solid rgba(59, 130, 246, 0.15);
           border-radius: 11px;
           background: linear-gradient(145deg, #eff6ff, #dbeafe);
           color: #2563eb;
         }
         
         .benefit-title {
           margin: 1px 0 5px;
           color: #1e3a8a;
           font-size: 13px;
           font-weight: 750;
         }
         
         .benefit-description {
           margin: 0;
           color: #64748b;
           font-size: 12px;
           line-height: 1.65;
         }
         
         .verification-note {
           display: flex;
           align-items: flex-start;
           gap: 11px;
           margin-top: 32px;
           padding: 15px;
           border: 1px solid rgba(245, 158, 11, 0.23);
           border-radius: 15px;
           background: rgba(255, 251, 235, 0.88);
           color: #b45309;
         }
         
         .verification-note p {
           margin: 0;
           color: #475569;
           font-size: 12px;
           line-height: 1.7;
         }
         
         .verification-note strong {
           color: #92400e;
         }
         
         .form-panel {
           position: relative;
           padding: 30px;
           border: 1px solid rgba(96, 165, 250, 0.19);
           border-radius: 26px;
           background: var(--panel);
         
           box-shadow:
             0 28px 80px rgba(30, 64, 175, 0.09),
             inset 0 1px 0 rgba(255, 255, 255, 0.95);
         
           backdrop-filter: blur(24px);
           -webkit-backdrop-filter: blur(24px);
           animation: panelEnter 0.65s cubic-bezier(0.2, 0.7, 0.2, 1) both;
         }
         
         .form-heading {
           margin-bottom: 25px;
         }
         
         .form-heading h2 {
           margin: 0;
           color: #172554;
           font-size: 25px;
           font-weight: 800;
           letter-spacing: -0.035em;
         }
         
         .form-heading p {
           margin: 9px 0 0;
           color: #64748b;
           font-size: 13px;
           line-height: 1.7;
         }
         
         .section-heading {
           display: flex;
           align-items: center;
           gap: 10px;
           margin: 27px 0 15px;
           color: #1e40af;
           font-size: 12px;
           font-weight: 800;
           letter-spacing: 0.075em;
           text-transform: uppercase;
         }
         
         .section-number {
           display: grid;
           width: 25px;
           height: 25px;
           place-items: center;
           border: 1px solid rgba(59, 130, 246, 0.18);
           border-radius: 8px;
           background: #eff6ff;
           color: #2563eb;
           font-size: 11px;
         }
         
         .organization-grid {
           display: grid;
           grid-template-columns: repeat(2, minmax(0, 1fr));
           gap: 10px;
         }
         
         .organization-option {
           --org-accent: #2563eb;
           position: relative;
           display: flex;
           min-height: 102px;
           align-items: flex-start;
           gap: 10px;
           padding: 13px 12px;
           overflow: hidden;
           border: 1px solid #e2e8f0;
           border-radius: 15px;
           background: rgba(255, 255, 255, 0.86);
           color: #1e293b;
           text-align: left;
           cursor: pointer;
           transition:
             transform 0.23s ease,
             border-color 0.23s ease,
             background 0.23s ease,
             box-shadow 0.23s ease;
         }
         
         .organization-option::after {
           position: absolute;
           top: 0;
           left: -110%;
           width: 75%;
           height: 100%;
           background: linear-gradient(
             100deg,
             transparent,
             rgba(59, 130, 246, 0.06),
             transparent
           );
           content: "";
           transform: skewX(-18deg);
           transition: left 0.5s ease;
           pointer-events: none;
         }
         
         .organization-option:hover {
           z-index: 1;
           transform: translateY(-3px);
           border-color: color-mix(in srgb, var(--org-accent) 52%, white);
           background: white;
           box-shadow: 0 9px 26px rgba(37, 99, 235, 0.09);
         }
         
         .organization-option:hover::after {
           left: 150%;
         }
         
         .organization-option.selected {
           border-color: color-mix(in srgb, var(--org-accent) 65%, white);
           background: color-mix(in srgb, var(--org-accent) 6%, white);
           box-shadow:
             0 0 0 1px color-mix(in srgb, var(--org-accent) 10%, transparent),
             0 7px 25px rgba(37, 99, 235, 0.06);
         }
         
         .org-icon {
           display: grid;
           width: 34px;
           height: 34px;
           flex-shrink: 0;
           place-items: center;
           border: 1px solid color-mix(in srgb, var(--org-accent) 22%, white);
           border-radius: 10px;
           background: color-mix(in srgb, var(--org-accent) 9%, white);
           color: var(--org-accent);
           transition: transform 0.23s ease;
         }
         
         .organization-option:hover .org-icon {
           transform: scale(1.08) rotate(-3deg);
         }
         
         .org-copy {
           min-width: 0;
           flex: 1;
         }
         
         .org-label {
           display: block;
           color: #1e293b;
           font-size: 11px;
           font-weight: 750;
           line-height: 1.55;
         }
         
         .org-description {
           display: block;
           margin-top: 5px;
           color: #64748b;
           font-size: 10px;
           line-height: 1.55;
         }
         
         .org-check {
           position: absolute;
           top: 8px;
           right: 8px;
           display: grid;
           width: 18px;
           height: 18px;
           place-items: center;
           border-radius: 50%;
           background: var(--org-accent);
           color: white;
           animation: checkPop 0.2s ease both;
         }
         
         .field-grid {
           display: grid;
           grid-template-columns: repeat(2, minmax(0, 1fr));
           gap: 17px 13px;
         }
         
         .field-group {
           min-width: 0;
         }
         
         .field-label {
           display: flex;
           align-items: center;
           gap: 7px;
           margin-bottom: 9px;
           color: #334155;
           font-size: 12px;
           font-weight: 650;
         }
         
         .field-label :global(svg) {
           color: #2563eb;
         }
         
         .input-shell {
           position: relative;
           border-radius: 12px;
           padding: 1px;
           background: #dbeafe;
           transition:
             background 0.23s ease,
             box-shadow 0.23s ease,
             transform 0.23s ease;
         }
         
         .input-shell:hover {
           background: #93c5fd;
         }
         
         .input-shell:focus-within {
           background: linear-gradient(110deg, #38bdf8, #6366f1);
           box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.11);
         }
         
         .input-shell input,
         .input-shell select {
           display: block;
           width: 100%;
           height: 45px;
           min-width: 0;
           border: 0;
           outline: none;
           border-radius: 11px;
           padding: 0 12px;
           background: #fff;
           color: #172554;
           font-family: inherit;
           font-size: 12px;
           transition: background 0.2s ease;
         }
         
         .input-shell input::placeholder {
           color: #94a3b8;
         }
         
         .input-shell input:focus,
         .input-shell select:focus {
           background: #fff;
         }
         
         .input-shell select {
           appearance: none;
           -webkit-appearance: none;
           padding-right: 31px;
           cursor: pointer;
         }
         
         .input-shell select option {
           background: white;
           color: #172554;
         }
         
         .select-chevron {
           position: absolute;
           top: 50%;
           right: 12px;
           color: #2563eb;
           pointer-events: none;
           transform: translateY(-50%);
         }
         
         .password-shell input {
           padding-right: 44px;
         }
         
         .password-toggle {
           position: absolute;
           top: 0;
           right: 0;
           display: grid;
           width: 42px;
           height: 45px;
           place-items: center;
           border: 0;
           border-radius: 10px;
           background: transparent;
           color: #64748b;
           cursor: pointer;
           transition: color 0.2s ease;
         }
         
         .password-toggle:hover {
           color: #2563eb;
         }
         
         .field-hint {
           margin-top: 7px;
           color: #64748b;
           font-size: 10px;
           line-height: 1.6;
         }
         
         .authorization-box {
           display: flex;
           align-items: flex-start;
           gap: 11px;
           margin-top: 23px;
           padding: 15px;
           border: 1px solid #dbeafe;
           border-radius: 14px;
           background: rgba(239, 246, 255, 0.75);
           cursor: pointer;
           transition:
             border-color 0.2s ease,
             background 0.2s ease;
         }
         
         .authorization-box:hover {
           border-color: #93c5fd;
           background: #eff6ff;
         }
         
         .authorization-box input {
           width: 17px;
           height: 17px;
           flex-shrink: 0;
           margin: 2px 0 0;
           accent-color: #2563eb;
           cursor: pointer;
         }
         
         .authorization-copy {
           color: #475569;
           font-size: 11px;
           line-height: 1.8;
         }
         
         .authorization-copy strong {
           color: #1e3a8a;
         }
         
         .notice {
           display: flex;
           align-items: flex-start;
           gap: 10px;
           margin-top: 16px;
           padding: 13px;
           border: 1px solid;
           border-radius: 12px;
           font-size: 12px;
           line-height: 1.7;
           overflow-wrap: anywhere;
           animation: panelEnter 0.25s ease both;
         }
         
         .notice-error {
           border-color: #fecaca;
           background: #fef2f2;
           color: #b91c1c;
         }
         
         .notice-success {
           border-color: #a7f3d0;
           background: #ecfdf5;
           color: #047857;
         }
         
         .submit-button {
           position: relative;
           display: flex;
           width: 100%;
           min-height: 49px;
           align-items: center;
           justify-content: center;
           gap: 10px;
           margin-top: 20px;
           overflow: hidden;
           border: 1px solid rgba(59, 130, 246, 0.32);
           border-radius: 13px;
           background: linear-gradient(105deg, #0284c7, #2563eb 58%, #4f46e5);
           color: white;
           font-size: 13px;
           font-weight: 800;
           cursor: pointer;
           box-shadow: 0 10px 28px rgba(37, 99, 235, 0.18);
           transition:
             transform 0.22s ease,
             box-shadow 0.22s ease,
             filter 0.22s ease;
         }
         
         .submit-button::before {
           position: absolute;
           top: 0;
           left: -120%;
           width: 65%;
           height: 100%;
           background: linear-gradient(
             100deg,
             transparent,
             rgba(255, 255, 255, 0.25),
             transparent
           );
           content: "";
           transform: skewX(-20deg);
           transition: left 0.55s ease;
         }
         
         .submit-button:hover:not(:disabled) {
           transform: translateY(-2px);
           box-shadow: 0 15px 35px rgba(37, 99, 235, 0.28);
           filter: brightness(1.06);
         }
         
         .submit-button:hover:not(:disabled)::before {
           left: 150%;
         }
         
         .submit-button:active:not(:disabled) {
           transform: translateY(0) scale(0.99);
         }
         
         .submit-button:disabled {
           opacity: 0.65;
           cursor: not-allowed;
         }
         
         .login-link {
           margin: 21px 0 0;
           color: #64748b;
           text-align: center;
           font-size: 12px;
         }
         
         .login-link a {
           color: #2563eb;
           font-weight: 750;
           text-decoration: none;
           transition: color 0.2s ease;
         }
         
         .login-link a:hover {
           color: #1e40af;
         }
         
         .footer {
           display: flex;
           align-items: center;
           justify-content: center;
           gap: 7px;
           margin: 25px 0 4px;
           color: #64748b;
           font-size: 11px;
           text-align: center;
         }
         
         .footer :global(svg) {
           color: #2563eb;
         }
         
         @keyframes orbFloat {
           from {
             transform: translate3d(0, -15px, 0) scale(1);
           }
         
           to {
             transform: translate3d(25px, 30px, 0) scale(1.12);
           }
         }
         
         @keyframes panelEnter {
           from {
             opacity: 0;
             transform: translateY(12px);
           }
         
           to {
             opacity: 1;
             transform: translateY(0);
           }
         }
         
         @keyframes checkPop {
           from {
             opacity: 0;
             transform: scale(0.5);
           }
         
           to {
             opacity: 1;
             transform: scale(1);
           }
         }
         
         @media (max-width: 850px) {
           .layout {
             grid-template-columns: 1fr;
             max-width: 650px;
             margin: 0 auto;
           }
         
           .intro-panel {
             position: relative;
             top: auto;
             padding: 25px;
           }
         
           .intro-title {
             max-width: 500px;
             margin-top: 18px;
             font-size: 34px;
           }
         
           .benefit-list {
             grid-template-columns: repeat(2, minmax(0, 1fr));
             gap: 18px;
           }
         
           .verification-note {
             margin-top: 23px;
           }
         
           .form-panel {
             padding: 26px;
           }
         }
         
         @media (max-width: 520px) {
           .registration-page {
             padding: 15px;
           }
         
           .topbar {
             margin-bottom: 19px;
           }
         
           .brand-mark {
             width: 40px;
             height: 40px;
             border-radius: 12px;
           }
         
           .brand-name {
             font-size: 17px;
           }
         
           .brand-subtitle {
             font-size: 8px;
           }
         
           .secure-badge {
             gap: 5px;
             padding: 8px 9px;
             font-size: 10px;
           }
         
           .intro-panel {
             padding: 22px 19px;
             border-radius: 20px;
           }
         
           .intro-title {
             font-size: 31px;
           }
         
           .intro-description {
             font-size: 13px;
           }
         
           .benefit-list {
             grid-template-columns: 1fr;
             gap: 14px;
             margin-top: 24px;
           }
         
           .benefit-description {
             font-size: 11px;
           }
         
           .verification-note {
             margin-top: 21px;
             padding: 12px;
           }
         
           .form-panel {
             padding: 21px 16px;
             border-radius: 20px;
           }
         
           .form-heading h2 {
             font-size: 22px;
           }
         
           .form-heading p {
             font-size: 12px;
           }
         
           .organization-grid {
             gap: 8px;
           }
         
           .organization-option {
             min-height: 112px;
             gap: 8px;
             padding: 11px 9px;
           }
         
           .org-icon {
             width: 30px;
             height: 30px;
           }
         
           .org-label {
             font-size: 10px;
           }
         
           .org-description {
             font-size: 9px;
           }
         
           .field-grid {
             grid-template-columns: 1fr;
             gap: 15px;
           }
         
           .section-heading {
             margin-top: 23px;
           }
         }
         
         @media (prefers-reduced-motion: reduce) {
           *,
           *::before,
           *::after {
             scroll-behavior: auto !important;
             animation-duration: 0.01ms !important;
             animation-iteration-count: 1 !important;
             transition-duration: 0.01ms !important;
           }
         }
         `}</style>
         
      <div className="ambient-grid" aria-hidden="true" />
      <div className="ambient-orb orb-one" aria-hidden="true" />
      <div className="ambient-orb orb-two" aria-hidden="true" />
      <div className="ambient-orb orb-three" aria-hidden="true" />

      <div className="page-shell">
        <header className="topbar">
          <Link href="/" className="brand" aria-label="ResQAI home">
            <span className="brand-mark">
              <Shield size={25} strokeWidth={2.1} />
            </span>

            <span>
              <span className="brand-name">ResQAI</span>
              <span className="brand-subtitle" style={{ display: "block" }}>
                EMERGENCY RESPONSE
              </span>
            </span>
          </Link>

          <div className="secure-badge">
            <ShieldCheck size={15} />
            <span>Secure Registration</span>
          </div>
        </header>

        <div className="layout">
          <aside className="intro-panel">
            <div className="eyebrow">
              <Sparkles size={13} />
              Government Response Network
            </div>

            <h1 className="intro-title">
              Together, we can
              <br />
              respond <span className="gradient-text">faster.</span>
            </h1>

            <p className="intro-description">
              Connect your government organization with ResQAI to strengthen
              emergency coordination, improve response management, and help
              communities when every second matters.
            </p>

            <div className="benefit-list">
              <div className="benefit">
                <span className="benefit-icon">
                  <Building2 size={18} />
                </span>

                <div>
                  <h3 className="benefit-title">Organization-first access</h3>
                  <p className="benefit-description">
                    Register your department or government emergency unit.
                  </p>
                </div>
              </div>

              <div className="benefit">
                <span className="benefit-icon">
                  <BadgeCheck size={18} />
                </span>

                <div>
                  <h3 className="benefit-title">Verified organizations</h3>
                  <p className="benefit-description">
                    Complete official verification after creating your account.
                  </p>
                </div>
              </div>

              <div className="benefit">
                <span className="benefit-icon">
                  <MapPin size={18} />
                </span>

                <div>
                  <h3 className="benefit-title">Location-based coordination</h3>
                  <p className="benefit-description">
                    Establish your primary government operating jurisdiction.
                  </p>
                </div>
              </div>

              <div className="benefit">
                <span className="benefit-icon">
                  <Users size={18} />
                </span>

                <div>
                  <h3 className="benefit-title">Manage your response team</h3>
                  <p className="benefit-description">
                    Organization members and stations can be managed after
                    approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="verification-note">
              <ShieldCheck size={20} style={{ flexShrink: 0 }} />

              <p>
                <strong>Verification required</strong>
                <br />
                Registration creates an account, not automatic responder
                authorization. Official details and documents will be reviewed
                separately.
              </p>
            </div>
          </aside>

          <section className="form-panel">
            <div className="form-heading">
              <h2>Create organization account</h2>
              <p>
                Start with a few essential details. You can complete your
                organization profile and verification after registration.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div className="section-heading">
                <span className="section-number">01</span>
                Organization details
              </div>

              <Field label="Official Organization Name" icon={Building2}>
                <div className="input-shell" style={inputStyle}>
                  <input
                    type="text"
                    autoComplete="organization"
                    placeholder="e.g. District Emergency Services"
                    value={form.organizationName}
                    onChange={(event) =>
                      updateField("organizationName", event.target.value)
                    }
                    maxLength={150}
                    required
                  />
                </div>
              </Field>

              <div className="section-heading">
                <span className="section-number">02</span>
                Organization type
              </div>

              <div className="organization-grid">
                {ORGANIZATION_TYPES.map((organization) => {
                  const Icon = organization.icon;
                  const selected =
                    form.organizationType === organization.value;

                  return (
                    <button
                      key={organization.value}
                      type="button"
                      aria-pressed={selected}
                      className={`organization-option ${
                        selected ? "selected" : ""
                      }`}
                      style={
                        {
                          "--org-accent": organization.color,
                        } as CSSProperties
                      }
                      onClick={() =>
                        updateField("organizationType", organization.value)
                      }
                    >
                      <span className="org-icon">
                        <Icon size={17} strokeWidth={1.9} />
                      </span>

                      <span className="org-copy">
                        <span className="org-label">
                          {organization.label}
                        </span>

                        <span className="org-description">
                          {organization.description}
                        </span>
                      </span>

                      {selected && (
                        <span className="org-check">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!form.organizationType && (
                <p className="field-hint">
                  Select the category that best describes your organization.
                </p>
              )}

              <div className="section-heading">
                <span className="section-number">03</span>
                Government jurisdiction
              </div>

              <div className="field-grid">
                <Field label="Government Level" icon={Landmark}>
                  <div className="input-shell">
                    <select
                      value={form.governmentLevel}
                      onChange={(event) =>
                        updateField("governmentLevel", event.target.value)
                      }
                      required
                    >
                      {GOVERNMENT_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="select-chevron" size={15} />
                  </div>
                </Field>

                <Field label="Primary State / UT" icon={MapPin}>
                  <div className="input-shell">
                    <select
                      value={form.state}
                      onChange={(event) => updateField("state", event.target.value)}
                      required
                    >
                      <option value="">Select state / UT</option>

                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="select-chevron" size={15} />
                  </div>
                </Field>

                <Field label="Primary District" icon={Globe2} className="full-field">
                  <div className="input-shell">
                    <input
                      type="text"
                      placeholder="Enter district name"
                      value={form.district}
                      onChange={(event) =>
                        updateField("district", event.target.value)
                      }
                      maxLength={100}
                      required
                    />
                  </div>

                  <p className="field-hint">
                    You can add other operating districts from your dashboard.
                  </p>
                </Field>
              </div>

              <div className="section-heading">
                <span className="section-number">04</span>
                Official contact
              </div>

              <div className="field-grid">
                <Field label="Official Email Address" icon={Mail}>
                  <div className="input-shell">
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="department@example.gov.in"
                      value={form.email}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      maxLength={254}
                      required
                    />
                  </div>

                  <p className="field-hint">
                    Use an official organization email when available.
                  </p>
                </Field>

                <Field label="Official Contact Number" icon={Phone}>
                  <div className="input-shell">
                    <input
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      maxLength={20}
                      required
                    />
                  </div>
                </Field>
              </div>

              <div className="section-heading">
                <span className="section-number">05</span>
                Secure your account
              </div>

              <div className="field-grid">
                <Field label="Create Password" icon={LockKeyhole}>
                  <div className="input-shell password-shell">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                      value={form.password}
                      onChange={(event) =>
                        updateField("password", event.target.value)
                      }
                      minLength={8}
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>

                  <p className="field-hint">Use letters and numbers.</p>
                </Field>

                <Field label="Confirm Password" icon={LockKeyhole}>
                  <div className="input-shell password-shell">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter password"
                      value={form.confirmPassword}
                      onChange={(event) =>
                        updateField("confirmPassword", event.target.value)
                      }
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </Field>
              </div>

              <label className="authorization-box">
                <input
                  type="checkbox"
                  checked={form.authorized}
                  onChange={(event) =>
                    updateField("authorized", event.target.checked)
                  }
                  required
                />

                <span className="authorization-copy">
                  I confirm that I am <strong>authorized to submit this
                  registration</strong> on behalf of the named organization and
                  that the information provided is accurate. I understand that
                  responder privileges require separate verification and
                  approval.
                </span>
              </label>

              {error && (
                <div className="notice notice-error" role="alert">
                  <Shield size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="notice notice-success" role="status">
                  <CheckCircle2 size={19} style={{ flexShrink: 0 }} />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Organization Account
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <p className="login-link">
                Already registered?{" "}
                <Link href="/login">Sign in to your account</Link>
              </p>
            </form>
          </section>
        </div>

        <footer className="footer">
          <ShieldCheck size={14} />
          <span>
            ResQAI Emergency Response Platform · Organization verification
            required
          </span>
        </footer>
      </div>
    </main>
  );
}