"use client";

import dynamic from "next/dynamic";

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

const ResponderMapClient = dynamic(
  () => import("./ResponderMapClient"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[650px] w-full items-center justify-center rounded-3xl border border-white/10 bg-[#101115] font-mono text-xs text-zinc-500">
        INITIALIZING TACTICAL MAP RADAR...
      </div>
    ),
  }
);

export default function ResponderMap({
  incidents,
}: {
  incidents: Incident[];
}) {
  return <ResponderMapClient incidents={incidents} />;
}
