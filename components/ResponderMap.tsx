import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// Fix Leaflet's default marker icon paths in Next.js
const customIcon = L.divIcon({
  className: "custom-map-marker",
  html: `
    <div style="
      background-color: #ef4444; 
      width: 28px; 
      height: 28px; 
      border-radius: 50%; 
      border: 2px solid white; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.7);
    ">
      <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
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

export default function ResponderMap({ incidents }: { incidents: Incident[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex h-[650px] w-full items-center justify-center rounded-3xl border border-white/10 bg-[#101115] text-zinc-500 font-mono text-xs">
        INITIALIZING TACTICAL MAP RADAR...
      </div>
    );
  }

  const defaultCenter: [number, number] = [20.5937, 78.9629];

  const validIncident = incidents.find(
    (i): i is Incident & { latitude: number; longitude: number } =>
      i.latitude !== null && i.longitude !== null
  );

  const mapCenter: [number, number] = validIncident
    ? [validIncident.latitude, validIncident.longitude]
    : defaultCenter;

  return (
    <div className="relative h-[650px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
      <MapContainer
        center={mapCenter}
        zoom={validIncident ? 13 : 5}
        scrollWheelZoom={true}
        zoomControl={false} // Disable default top-left zoom controls
        className="h-full w-full z-10"
      >
        {/* Move zoom controls to top-right to avoid badge overlap */}
        <ZoomControl position="topright" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-map-tiles"
        />

        {incidents.map((incident) => {
          if (!incident.latitude || !incident.longitude) return null;

          return (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={customIcon}
            >
              <Popup className="custom-leaflet-popup">
                <div className="p-2 text-zinc-900 min-w-[200px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 text-red-600">
                      {incident.severity}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      {incident.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-zinc-900 mb-1">
                    {incident.title || "Untitled Incident"}
                  </h4>

                  <p className="text-xs text-zinc-600 mb-3 line-clamp-2">
                    {incident.address || "Coordinates logged"}
                  </p>

                  <Link
                    href={`/dashboard/incidents/${incident.id}`}
                    className="flex items-center justify-center gap-1.5 w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-1.5 text-xs font-semibold transition"
                  >
                    <span>View Incident Details</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Overlay Badge stays comfortably in top-left */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none rounded-2xl border border-white/10 bg-[#060709]/80 px-4 py-2.5 backdrop-blur-md">
        <p className="text-xs font-bold text-white flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
          PostGIS Spatial Overlay Active
        </p>
        <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
          Showing {incidents.filter((i) => i.latitude && i.longitude).length} geolocated sectors
        </p>
      </div>

      <style jsx global>{`
        .dark-map-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        /* Style Leaflet zoom controls to fit dark theme */
        .leaflet-control-zoom a {
          background-color: #101115 !important;
          color: white !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .leaflet-control-zoom a:hover {
          background-color: #1f2028 !important;
        }
      `}</style>
    </div>
  );
}