"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, MapPin, Loader2 } from "lucide-react";

interface Property {
  id: string;
  name: string;
  address: string;
  suburb: string | null;
  postcode: string | null;
  buildingName: string | null;
  pendingRequests: number;
}

export default function AgentPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent/properties")
      .then((r) => r.json())
      .then((data) => { setProperties(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Properties</h1>
        <p className="text-slate-500 text-sm mt-1">Properties assigned to you. Click any to submit a maintenance request.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
          <Building2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No properties assigned</p>
          <p className="text-slate-400 text-sm mt-1">Contact your admin to be assigned properties.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/agent/properties/${p.id}`}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between group"
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  {p.buildingName && (
                    <p className="text-xs text-slate-400 mt-0.5">{p.buildingName}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3" />
                    {p.address}{p.suburb ? `, ${p.suburb}` : ""}{p.postcode ? ` ${p.postcode}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                {p.pendingRequests > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    {p.pendingRequests} pending
                  </span>
                )}
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
