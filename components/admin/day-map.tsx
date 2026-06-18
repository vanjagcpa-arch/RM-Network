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

const memCache = new Map<string, { lat: number; lng: number } | null>();

function lsKey(addr: string) { return `geo_v1:${addr}`; }

function readCache(addr: string): { lat: number; lng: number } | null | undefined {
  if (memCache.has(addr)) return memCache.get(addr)!;
  try {
    const v = localStorage.getItem(lsKey(addr));
    if (v) { const p = JSON.parse(v); memCache.set(addr, p); return p; }
  } catch {}
  return undefined;
}

function writeCache(addr: string, result: { lat: number; lng: number } | null) {
  memCache.set(addr, result);
  try { if (result) localStorage.setItem(lsKey(addr), JSON.stringify(result)); } catch {}
}

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const cached = readCache(address);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=au&limit=1`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const result = data[0] ? { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) } : null;
    writeCache(address, result);
    return result;
  } catch {
    return null;
  }
}

function ensureLeafletCSS() {
  if (typeof document === "undefined") return;
  const id = "leaflet-css";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  link.crossOrigin = "";
  document.head.appendChild(link);
}

export function DayMap({ jobs }: { jobs: MapJob[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletMap = useRef<any>(null);
  const [geocoded, setGeocoded] = useState<GeocodedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(0);

  // Geocode all job addresses
  useEffect(() => {
    const jobsWithAddr = jobs.filter((j) => j.property?.address);
    if (jobsWithAddr.length === 0) { setGeocoded([]); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    setGeocoded([]);

    (async () => {
      const results: GeocodedJob[] = [];
      let failCount = 0;

      // Check how many need actual network requests
      const needsFetch = jobsWithAddr.filter((j) => {
        const addr = `${j.property!.address}${j.property!.suburb ? `, ${j.property!.suburb}` : ""}, Australia`;
        return readCache(addr) === undefined;
      });

      for (const job of jobsWithAddr) {
        if (cancelled) return;
        const addr = `${job.property!.address}${job.property!.suburb ? `, ${job.property!.suburb}` : ""}, Australia`;
        const coords = await geocode(addr);
        if (coords) results.push({ ...job, lat: coords.lat, lng: coords.lng });
        else failCount++;
        // Rate-limit only for uncached addresses (Nominatim: max 1 req/s)
        if (needsFetch.includes(job)) await new Promise((r) => setTimeout(r, 1100));
      }

      if (!cancelled) {
        setGeocoded(results);
        setFailed(failCount);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(jobs.map((j) => j.id))]);

  // Build / rebuild Leaflet map
  useEffect(() => {
    if (loading || geocoded.length === 0 || !mapRef.current) return;

    ensureLeafletCSS();

    // Small delay so the CSS link has a chance to parse
    const timer = setTimeout(() => {
      import("leaflet").then((L) => {
        if (!mapRef.current) return;

        if (leafletMap.current) {
          leafletMap.current.remove();
          leafletMap.current = null;
        }

        const map = L.map(mapRef.current, { zoomControl: true });
        leafletMap.current = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);

        const latLngs: [number, number][] = [];

        geocoded.forEach((job, i) => {
          const color = job.technician?.color ?? "#3b82f6";

          const icon = L.divIcon({
            className: "",
            html: `<div style="background:${color};color:#fff;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);font-size:12px;font-weight:800">${i + 1}</span></div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            popupAnchor: [0, -32],
          });

          const time = job.scheduledTimeStart
            ? new Date(`2000-01-01T${job.scheduledTimeStart}`).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
            : "Time TBC";

          L.marker([job.lat, job.lng], { icon })
            .addTo(map)
            .bindPopup(`<div style="font-family:-apple-system,sans-serif;font-size:13px;min-width:190px;line-height:1.5">
              <div style="font-weight:700;margin-bottom:3px">${job.title}</div>
              <div style="color:#64748b;font-size:12px">${job.property?.name ?? ""}</div>
              <div style="color:#94a3b8;font-size:11px;margin-bottom:6px">${job.property?.address ?? ""}</div>
              <span style="background:${color};color:#fff;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600">${time}</span>
              ${job.technician ? `<span style="color:#64748b;font-size:11px;margin-left:6px">${job.technician.name}</span>` : ""}
            </div>`);

          latLngs.push([job.lat, job.lng]);
        });

        if (latLngs.length === 1) {
          map.setView(latLngs[0], 15);
        } else {
          map.fitBounds(latLngs as L.LatLngBoundsExpression, { padding: [40, 40] });
        }
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, [geocoded, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-52 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
        <p className="text-xs text-slate-400">Locating addresses on the map…</p>
        <p className="text-[10px] text-slate-300">First visit may take a few seconds</p>
      </div>
    );
  }

  if (geocoded.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 gap-2 text-slate-300">
        <MapPin className="h-8 w-8" />
        <p className="text-xs text-slate-400 text-center">Could not locate addresses for these jobs</p>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm"
        style={{ height: 260 }}
      />
      {failed > 0 && (
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          {failed} address{failed > 1 ? "es" : ""} could not be located
        </p>
      )}
      <div className="mt-3 space-y-1.5">
        {geocoded.map((job, i) => (
          <div key={job.id} className="flex items-center gap-2 text-xs">
            <span
              className="h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
              style={{ backgroundColor: job.technician?.color ?? "#3b82f6" }}
            >
              {i + 1}
            </span>
            <span className="font-medium text-slate-800 truncate">{job.title}</span>
            {job.technician && (
              <span className="text-slate-400 flex-shrink-0">— {job.technician.name}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
