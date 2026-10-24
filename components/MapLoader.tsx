"use client";

import dynamic from "next/dynamic";

// Dynamic import with ssr: false is fully allowed inside Client Components
const ResponderMap = dynamic(() => import("@/components/ResponderMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[650px] w-full items-center justify-center rounded-3xl border border-white/10 bg-[#101115] text-zinc-500 font-mono text-xs">
      INITIALIZING TACTICAL MAP RADAR...
    </div>
  ),
});

interface Incident {
  id: string;
  title: string;
  incident_type: string;
  severity: string;
  status: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export default function MapLoader({ incidents }: { incidents: Incident[] }) {
  return <ResponderMap incidents={incidents} />;
}