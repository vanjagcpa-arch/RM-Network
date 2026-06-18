"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

interface MapJob {
  id: string;
  title: string;
  scheduledTimeStart: string | null;
  property: { name: string; address: string; suburb: string | null } | null;
  technician: { name: string; color: string } | null;
  jobCategory: string;
}

interface GeocodedJob extends MapJob {
  lat: number;
  lng: number;
}

const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(address)) return geocodeCache.get(address)!;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=au&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const result = data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
    geocodeCache.set(address, result);
    return result;
  } catch {
    return null;
  }
}

export function DayMap({ jobs }: { jobs: MapJob[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMap = useRef<any>(null);
  const [geocoded, setGeocoded] = useState<GeocodedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setGeocoded([]);

    const unique = jobs.filter((j) => j.property?.address);
    (async () => {
      const results: GeocodedJob[] = [];
      let failCount = 0;
      for (const job of unique) {
        const addr = `${job.property!.address}${job.property!.suburb ? `, ${job.property!.suburb}` : ""}, Australia`;
        const coords = await geocodeAddress(addr);
        if (coords) results.push({ ...job, ...coords });
        else failCount++;
        // Nominatim rate limit: 1 req/s
        await new Promise((r) => setTimeout(r, 250));
      }
      if (!cancelled) {
        setGeocoded(results);
        setFailed(failCount);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [jobs]);

  useEffect(() => {
    if (loading || geocoded.length === 0 || !mapRef.current) return;

    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then((L) => {
      // Clean up old map
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }

      const map = L.map(mapRef.current!, { zoomControl: true });
      leafletMap.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      const bounds: [number, number][] = [];

      geocoded.forEach((job, i) => {
        const color = job.technician?.color ?? "#3b82f6";
        const label = i + 1;

        const icon = L.divIcon({
          className: "",
          html: `<div style="
            background:${color};
            color:#fff;
            width:28px;height:28px;
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            display:flex;align-items:center;justify-content:center;
            border:2px solid #fff;
            box-shadow:0 2px 6px rgba(0,0,0,.25);
          "><span style="transform:rotate(45deg);font-size:11px;font-weight:700">${label}</span></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
          popupAnchor: [0, -30],
        });

        const timeLabel = job.scheduledTimeStart
          ? new Date(`2000-01-01T${job.scheduledTimeStart}`).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
          : "Time TBC";

        L.marker([job.lat, job.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:-apple-system,sans-serif;font-size:13px;min-width:180px">
              <div style="font-weight:700;margin-bottom:4px">${job.title}</div>
              <div style="color:#64748b;margin-bottom:2px">${job.property?.name}</div>
              <div style="color:#64748b;margin-bottom:4px">${job.property?.address}</div>
              <div style="display:flex;align-items:center;gap:6px">
                <span style="background:${color};color:#fff;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600">${timeLabel}</span>
                ${job.technician ? `<span style="color:#475569;font-size:11px">${job.technician.name}</span>` : ""}
              </div>
            </div>
          `);

        bounds.push([job.lat, job.lng]);
      });

      if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [30, 30] });
      }
    });

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, [geocoded, loading]);

  if (loading && jobs.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <p className="text-xs">Locating addresses…</p>
      </div>
    );
  }

  if (geocoded.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400">
        <MapPin className="h-6 w-6" />
        <p className="text-xs text-center">Could not locate addresses for these jobs</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div ref={mapRef} className="w-full rounded-lg overflow-hidden border border-slate-200" style={{ height: 260 }} />
      {failed > 0 && (
        <p className="text-[10px] text-slate-400 mt-1 text-center">{failed} address{failed > 1 ? "es" : ""} could not be located</p>
      )}
      <div className="mt-2 space-y-1">
        {geocoded.map((job, i) => (
          <div key={job.id} className="flex items-center gap-2 text-xs">
            <span
              className="h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white"
              style={{ backgroundColor: job.technician?.color ?? "#3b82f6" }}
            >
              {i + 1}
            </span>
            <span className="font-medium text-slate-700 truncate">{job.title}</span>
            {job.technician && <span className="text-slate-400 truncate">— {job.technician.name}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
