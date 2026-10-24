"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
      <div style="
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export default function ResponderMapClient({
  incidents,
}: {
  incidents: Incident[];
}) {
  const defaultCenter: [number, number] = [20.5937, 78.9629];

  // Keep valid coordinates, including latitude or longitude equal to 0.
  const geolocatedIncidents = incidents.filter(
    (
      incident
    ): incident is Incident & {
      latitude: number;
      longitude: number;
    } =>
      typeof incident.latitude === "number" &&
      Number.isFinite(incident.latitude) &&
      typeof incident.longitude === "number" &&
      Number.isFinite(incident.longitude)
  );

  const validIncident = geolocatedIncidents[0];

  const mapCenter: [number, number] = validIncident
    ? [validIncident.latitude, validIncident.longitude]
    : defaultCenter;

  return (
    <div className="relative h-[650px] w-full overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
      <MapContainer
        center={mapCenter}
        zoom={validIncident ? 13 : 5}
        scrollWheelZoom
        zoomControl={false}
        className="z-10 h-full w-full"
      >
        <ZoomControl position="topright" />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="dark-map-tiles"
        />

        {geolocatedIncidents.map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={customIcon}
          >
            <Popup className="custom-leaflet-popup">
              <div className="min-w-[200px] p-2 text-zinc-900">
                <div className="mb-1 flex items-center justify-between">
                  <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                    {incident.severity}
                  </span>

                  <span className="font-mono text-[10px] uppercase text-zinc-500">
                    {incident.status}
                  </span>
                </div>

                <h4 className="mb-1 text-sm font-bold text-zinc-900">
                  {incident.title || "Untitled Incident"}
                </h4>

                <p className="mb-3 line-clamp-2 text-xs text-zinc-600">
                  {incident.address || "Coordinates logged"}
                </p>

                <Link
                  href={`/dashboard/incidents/${incident.id}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-600 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  <span>View Incident Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl border border-white/10 bg-[#060709]/80 px-4 py-2.5 backdrop-blur-md">
        <p className="flex items-center gap-2 text-xs font-bold text-white">
          <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
          PostGIS Spatial Overlay Active
        </p>

        <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
          Showing {geolocatedIncidents.length} geolocated sectors
        </p>
      </div>

      <style jsx global>{`
        .dark-map-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%)
            contrast(90%);
        }

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
