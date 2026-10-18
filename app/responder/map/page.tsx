import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Map as MapIcon } from "lucide-react";
import MapLoader from "@/components/MapLoader";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper function to extract lat/lng from strings like "Lat: 29.916720, Lng: 78.063753"
function parseCoordinates(addressText: string | null) {
  if (!addressText) return { latitude: null, longitude: null };

  try {
    const latMatch = addressText.match(/Lat:\s*([-\d.]+)/i);
    const lngMatch = addressText.match(/Lng:\s*([-\d.]+)/i);

    const latitude = latMatch ? parseFloat(latMatch[1]) : null;
    const longitude = lngMatch ? parseFloat(lngMatch[1]) : null;

    return { latitude, longitude };
  } catch {
    return { latitude: null, longitude: null };
  }
}

export default async function ResponderMapPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch incidents from Supabase
  const { data: rawIncidents, error } = await supabase
    .from("incidents")
    .select("id, title, incident_type, severity, status, address")
    .order("created_at", { ascending: false })
    .limit(100);

  // Map raw incidents and attach parsed coordinates
  const incidents = (rawIncidents ?? []).map((incident) => {
    const { latitude, longitude } = parseCoordinates(incident.address);
    return {
      ...incident,
      latitude,
      longitude,
    };
  });

  return (
    <main className="min-h-screen bg-[#060709] pb-24 text-zinc-100 antialiased selection:bg-red-500 selection:text-white md:pb-0">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#060709]/90 px-4 py-3.5 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/responder"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/30 bg-red-600/20 text-red-400">
            <MapIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Tactical Map View</h1>
            <p className="text-[11px] text-zinc-400 font-mono">PostGIS Spatial Feed</p>
          </div>
        </div>

        <Link
          href="/responder"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10"
        >
          Back to Queue
        </Link>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-black text-white">Live Incident Radar</h2>
          <p className="text-sm text-zinc-400">
            Interactive spatial visualization of emergency incidents across regional dispatch zones.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-8 text-center text-rose-300">
            Failed to load incidents from Supabase.
          </div>
        ) : (
          <MapLoader incidents={incidents} />
        )}
      </div>
    </main>
  );
}