"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  MapPin,
  Flame,
  Waves,
  HeartPulse,
  Car,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Navigation,
  Users,
  AlertTriangle,
  ImagePlus,
  X,
} from "lucide-react";
import Link from "next/link";

type IncidentType =
  | "MEDICAL"
  | "FIRE"
  | "FLOOD"
  | "ROAD_ACCIDENT"
  | "EVACUATION"
  | "OTHER";

const incidentTypes: {
  id: IncidentType;
  label: string;
  description: string;
  icon: typeof HeartPulse;
}[] = [
  { id: "MEDICAL", label: "Medical", description: "Injury or urgent medical help", icon: HeartPulse },
  { id: "FIRE", label: "Fire", description: "Fire, smoke or explosion risk", icon: Flame },
  { id: "FLOOD", label: "Flood / Water", description: "Flooding or waterlogging", icon: Waves },
  { id: "ROAD_ACCIDENT", label: "Road accident", description: "Collision or road emergency", icon: Car },
  { id: "EVACUATION", label: "Evacuation", description: "People need to move to safety", icon: Users },
  { id: "OTHER", label: "Other", description: "Another urgent incident", icon: AlertTriangle },
];

export default function ReportEmergencyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState<IncidentType>("MEDICAL");
  const [affectedCount, setAffectedCount] = useState(1);
  const [medicalRequired, setMedicalRequired] = useState(true);
  const [evacuationRequired, setEvacuationRequired] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    if (!file) {
      setImageFile(null);
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("The image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setImageFile(file);
  };

  const handleGetLocation = () => {
    setFetchingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Location services are not supported by this browser.");
      setFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        setLatitude(lat);
        setLongitude(lng);
        setAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`);
        setFetchingLocation(false);
      },
      (locationError) => {
        console.error("Location error:", locationError);
        const message =
          locationError.code === locationError.PERMISSION_DENIED
            ? "Location permission was denied. Allow location access in your browser settings and try again."
            : locationError.code === locationError.TIMEOUT
              ? "Getting your location took too long. Please try again."
              : "We couldn't get your location. Check your device location settings and try again.";
        setError(message);
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setError(null);

    if (!title.trim()) {
      setError("Please enter a short incident title.");
      return;
    }
    if (!description.trim()) {
      setError("Please describe what is happening.");
      return;
    }
    if (!Number.isInteger(affectedCount) || affectedCount < 1) {
      setError("Enter a valid number of people affected (at least 1).");
      return;
    }
    if (latitude === null || longitude === null) {
      setError("Capture your GPS location before submitting this report.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        router.push("/login?next=/report");
        return;
      }

      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        const extension = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("incident-images")
          .upload(imagePath, imageFile, {
            cacheControl: "3600",
            upsert: false,
            contentType: imageFile.type,
          });
        if (uploadError) {
          throw new Error(
            `Image upload failed: ${uploadError.message}. Check that the private incident-images storage bucket exists and its upload policies allow authenticated users.`
          );
        }
        // Store the private storage path, not a public URL. A trusted server
        // endpoint can create a short-lived signed URL for AI/reviewer access.
        uploadedImageUrl = imagePath;
      }

      // Match the known incidents schema: user_id / reported_by, location,
      // image_url, and flags are supported. Avoid unverified boolean columns.
      const flags = {
        medical_required: medicalRequired,
        evacuation_required: evacuationRequired,
      };

      const { error: insertError } = await supabase.from("incidents").insert({
        reported_by: user.id,
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        incident_type: incidentType,
        severity: "HIGH",
        status: "REPORTED",
        affected_people: affectedCount,
        flags,
        image_url: uploadedImageUrl,
        location: `POINT(${longitude} ${latitude})`,
        address: address || null,
      });

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw insertError;
      }

      // ----------------------------------------------
      // Success
      // ----------------------------------------------

      setSuccess(true);

      window.setTimeout(() => {
        router.push("/dashboard?reported=true");
        router.refresh();
      }, 1800);
    } catch (submissionError: unknown) {
      console.error("Emergency report error:", submissionError);
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We couldn't submit your report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="report-page relative min-h-screen overflow-hidden bg-white px-4 py-5 text-slate-900 sm:px-6 sm:py-8">
      <style jsx global>{`
        .report-page {
          background: #fff;
          isolation: isolate;
        }
        .report-page::before,
        .report-page::after {
          content: "";
          position: fixed;
          z-index: -1;
          width: 32rem;
          height: 32rem;
          border-radius: 9999px;
          pointer-events: none;
          filter: blur(70px);
          opacity: .45;
          animation: report-blue-drift 15s ease-in-out infinite alternate;
        }
        .report-page::before {
          top: -10rem;
          left: -9rem;
          background: radial-gradient(circle, rgba(96,165,250,.42), rgba(191,219,254,.12) 55%, transparent 72%);
        }
        .report-page::after {
          right: -10rem;
          bottom: -10rem;
          background: radial-gradient(circle, rgba(37,99,235,.24), rgba(147,197,253,.10) 55%, transparent 72%);
          animation-delay: -7s;
        }
        .report-page .report-glow-card {
          position: relative;
          isolation: isolate;
          transition: transform 240ms ease, border-color 240ms ease,
            box-shadow 240ms ease;
        }
        .report-page .report-glow-card::before {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            115deg,
            transparent 15%,
            rgba(59, 130, 246, 0.04) 30%,
            rgba(59, 130, 246, 0.95) 48%,
            rgba(56, 189, 248, 0.8) 53%,
            transparent 72%
          );
          background-size: 240% 100%;
          background-position: 100% 0;
          -webkit-mask: linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          pointer-events: none;
          transition: opacity 220ms ease;
        }
        .report-page .report-glow-card:hover::before,
        .report-page .report-glow-card:focus-within::before {
          opacity: 1;
          animation: report-border-sweep 1.8s linear infinite;
        }
        .report-page .report-glow-card:hover,
        .report-page .report-glow-card:focus-within {
          transform: translateY(-2px);
          border-color: rgba(59, 130, 246, 0.42);
          box-shadow: 0 14px 40px rgba(37, 99, 235, 0.09);
        }
        .report-page button,
        .report-page input,
        .report-page textarea {
          -webkit-tap-highlight-color: transparent;
        }
        .report-page button:focus-visible,
        .report-page input:focus-visible,
        .report-page textarea:focus-visible {
          outline: 2px solid rgba(96, 165, 250, 0.95);
          outline-offset: 3px;
        }
        @keyframes report-border-sweep {
          from { background-position: 100% 0; }
          to { background-position: -100% 0; }
        }
        @keyframes report-blue-drift {
          from { transform: translate3d(-2%, -1%, 0) scale(.94); }
          to { transform: translate3d(3%, 4%, 0) scale(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .report-page *,
          .report-page *::before,
          .report-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-[28rem] h-80 w-80 rounded-full bg-blue-600/[0.08] blur-3xl" />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Citizen Dashboard
          </Link>
        </div>

        <header className="report-glow-card relative mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-sky-50 p-5 shadow-2xl shadow-blue-950/5 backdrop-blur-xl sm:mb-8 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-blue-100 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-blue-100 blur-3xl" />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" />
              </span>
              ResQAI · Emergency Reporting
            </div>

            <div className="flex items-start gap-4">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100 text-blue-700 sm:flex">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Report an Emergency
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Share what is happening and where help is needed. Provide
                  accurate details so the response team can review your report.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 sm:text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              If someone is in immediate danger, contact local emergency
              services too. Do not wait for an online report to be reviewed.
            </div>
          </div>
        </header>

        {success ? (
          <section className="report-glow-card rounded-3xl border border-emerald-200 bg-emerald-50 p-7 text-center backdrop-blur-xl sm:p-12">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-600 sm:h-16 sm:w-16" />
            <h2 className="text-xl font-bold sm:text-2xl">
              Report submitted successfully
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Your report has been saved. We&apos;re taking you back to your
              dashboard.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Please remember that this confirmation does not mean responders
              have already been dispatched.
            </p>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="report-glow-card space-y-6 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-2xl shadow-blue-950/5 backdrop-blur-xl sm:p-7"
          >
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.08] p-4 text-sm leading-6 text-rose-700"
              >
                <p className="font-semibold">We couldn&apos;t submit the report</p>
                <p className="mt-1 break-words">{error}</p>
              </div>
            )}

            <section>
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900">What happened?</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Give your report a clear, short title.
                </p>
              </div>
              <label htmlFor="incident-title" className="sr-only">
                Incident title
              </label>
              <input
                id="incident-title"
                type="text"
                required
                maxLength={120}
                autoComplete="off"
                placeholder="e.g. Vehicle collision near the railway crossing"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/15"
              />
              <p className="mt-1 text-right text-[11px] text-slate-500">
                {title.length}/120
              </p>
            </section>

            <section>
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900">Emergency type</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose the category that best matches the situation.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {incidentTypes.map((item) => {
                  const Icon = item.icon;
                  const selected = incidentType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setIncidentType(item.id)}
                      className={`report-glow-card flex min-h-[88px] items-center gap-3 rounded-2xl border p-3 text-left transition ${
                        selected
                          ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-100"
                          : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-xs leading-4 text-slate-500">
                          {item.description}
                        </span>
                      </span>
                      {selected && (
                        <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-blue-700" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900">
                  Describe the situation
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Include useful landmarks and immediate risks. Do not put
                  passwords or other sensitive account information here.
                </p>
              </div>
              <label htmlFor="incident-description" className="sr-only">
                Emergency description
              </label>
              <textarea
                id="incident-description"
                required
                minLength={5}
                maxLength={3000}
                rows={5}
                placeholder="What happened? Is anyone injured or trapped? Mention nearby landmarks if you know them."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-36 w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-base leading-6 text-slate-900 placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/15"
              />
              <p className="mt-1 text-right text-[11px] text-slate-500">
                {description.length}/3000
              </p>
            </section>

            <section className="report-glow-card rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <MapPin className="h-4 w-4 text-blue-700" />
                    Where is help needed?
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Capture GPS coordinates. Your browser may ask permission.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={fetchingLocation || loading}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 transition hover:border-blue-300/50 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {fetchingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LocateFixedIcon />
                  )}
                  {fetchingLocation ? "Getting location…" : "Capture GPS"}
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {latitude !== null && longitude !== null ? (
                  <>
                    <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Location captured
                    </p>
                    <p className="mt-2 break-all font-mono text-xs leading-5 text-slate-600">
                      Latitude: {latitude.toFixed(6)} · Longitude:{" "}
                      {longitude.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-blue-700 hover:text-blue-700"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Preview on map
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    GPS location has not been captured yet.
                  </p>
                )}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Location is required for this report. GPS coordinates identify
                the point; they do not automatically provide a street address.
              </p>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label
                  htmlFor="affected-count"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  People affected
                </label>
                <input
                  id="affected-count"
                  type="number"
                  min={1}
                  max={100000}
                  step={1}
                  required
                  value={affectedCount}
                  onChange={(event) => {
                    const value = event.target.value;
                    setAffectedCount(value === "" ? 0 : Number(value));
                  }}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-blue-400/30">
                <span>Medical assistance needed</span>
                <input
                  type="checkbox"
                  checked={medicalRequired}
                  onChange={(event) => setMedicalRequired(event.target.checked)}
                  className="h-5 w-5 shrink-0 accent-blue-500"
                />
              </label>

              <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-blue-400/30">
                <span>Evacuation needed</span>
                <input
                  type="checkbox"
                  checked={evacuationRequired}
                  onChange={(event) => setEvacuationRequired(event.target.checked)}
                  className="h-5 w-5 shrink-0 accent-blue-500"
                />
              </label>
            </section>

            <section className="report-glow-card rounded-2xl border border-blue-200 bg-white p-4 sm:p-5">
              <div className="mb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ImagePlus className="h-4 w-4 text-blue-600" />
                  Add an incident photo <span className="font-medium text-slate-500">(optional)</span>
                </h2>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  A clear photo may help a human reviewer understand the scene. Never approach danger or delay getting help to take a picture.
                </p>
              </div>

              {imagePreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-50">
                  <img src={imagePreview} alt="Selected incident preview" className="max-h-64 w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    aria-label="Remove selected image"
                    className="absolute right-2 top-2 inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white/95 px-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-rose-50 hover:text-rose-700"
                  >
                    <X className="h-4 w-4" /> Remove
                  </button>
                  <p className="break-all border-t border-blue-100 bg-white px-3 py-2 text-xs text-slate-600">
                    {imageFile?.name} · {((imageFile?.size ?? 0) / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/70 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50">
                  <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                    <ImagePlus className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-slate-800">Choose a photo or take one</span>
                  <span className="mt-1 text-xs text-slate-500">JPG, PNG or WebP · Up to 5 MB</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handleImageChange} className="sr-only" aria-label="Upload incident image" />
                </label>
              )}
              <p className="mt-3 text-[11px] leading-5 text-slate-500">
                Please avoid including identifiable faces or sensitive personal details when possible. The image is uploaded with your report.
              </p>
            </section>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs leading-5 text-blue-800">
                A photo is supporting evidence, not a final decision. AI analysis and automatic dispatch are not connected to this form yet; a responder must review the report.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || fetchingLocation}
              className="group relative flex min-h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 px-5 py-4 text-sm font-bold text-slate-900 shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:from-blue-600 hover:via-blue-500 hover:to-sky-400 hover:shadow-xl hover:shadow-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting report…
                </>
              ) : (
                <>
                  <ShieldAlert className="h-5 w-5" />
                  Submit Emergency Report
                </>
              )}
            </button>
          </form>
        )}
        <footer className="py-6 text-center text-xs text-slate-500">
          ResQAI · Emergency information and community safety
        </footer>
      </div>
    </main>
  );
}

function LocateFixedIcon() {
  return <MapPin className="h-4 w-4" />;
}
