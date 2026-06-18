"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { JOB_CATEGORIES } from "@/lib/utils";
import { Wrench, Calendar, Clock, User, Phone, Mail, Home, Sparkles, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LinkInfo {
  propertyName: string;
  propertyAddress: string;
  propertySuburb: string | null;
  propertyPostcode: string | null;
  jobCategory: string | null;
  label: string | null;
  allowedWeekdays: number[] | null;
}

interface Recommendation {
  date: string;
  score: number;
  reason: string;
  jobCount: number;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function isWeekdayAllowed(dateStr: string, allowed: number[] | null) {
  if (!allowed || allowed.length === 0) return true;
  const day = new Date(dateStr + "T00:00:00").getDay();
  return allowed.includes(day);
}

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function BookingPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "submitting" | "success" | "error">("form");
  const [form, setForm] = useState({
    jobCategory: "",
    scheduledDate: "",
    scheduledTimeStart: "",
    tenantName: "",
    tenantEmail: "",
    tenantPhone: "",
    unitNumber: "",
    notes: "",
  });

  useEffect(() => {
    fetch(`/api/booking-links/lookup?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setLoadError(data.error); }
        else {
          setLinkInfo(data);
          if (data.jobCategory) setForm((f) => ({ ...f, jobCategory: data.jobCategory }));
        }
      })
      .catch(() => setLoadError("Failed to load booking page"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!linkInfo || !form.scheduledDate) return;
    fetch(`/api/scheduling/recommendations?propertyId=lookup&token=${token}&daysAhead=30`)
      .then((r) => r.json())
      .then((data) => setRecommendations(Array.isArray(data) ? data.slice(0, 3) : []))
      .catch(() => {});
  }, [linkInfo, token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.scheduledDate) return;
    setSubmitting(true);
    setStep("submitting");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...form }),
    });

    if (res.ok) {
      setStep("success");
    } else {
      const data = await res.json();
      setLoadError(data.error ?? "Booking failed");
      setStep("error");
    }
    setSubmitting(false);
  }

  const selectedCat = form.jobCategory ? JOB_CATEGORIES[form.jobCategory as keyof typeof JOB_CATEGORIES] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-slate-600">Loading booking page…</p>
        </div>
      </div>
    );
  }

  if (loadError && step !== "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-md w-full text-center">
          <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Link unavailable</h2>
          <p className="text-slate-500">{loadError}</p>
          <p className="text-sm text-slate-400 mt-4">Please contact your property manager for a new booking link.</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 max-w-md w-full text-center">
          <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking confirmed!</h2>
          <p className="text-slate-500 mb-4">
            Your {selectedCat?.label ?? "maintenance"} booking has been received.
          </p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Property</span><span className="font-medium text-slate-900">{linkInfo?.propertyName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium text-slate-900">{new Date(form.scheduledDate + "T00:00:00").toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span></div>
            {form.scheduledTimeStart && <div className="flex justify-between"><span className="text-slate-500">Time</span><span className="font-medium text-slate-900">{form.scheduledTimeStart}</span></div>}
            {form.unitNumber && <div className="flex justify-between"><span className="text-slate-500">Unit</span><span className="font-medium text-slate-900">{form.unitNumber}</span></div>}
          </div>
          <p className="text-xs text-slate-400 mt-4">You will be contacted to confirm the appointment. Please ensure access to the property on the scheduled date.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200 mb-4">
            <Wrench className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Book a Service</h1>
          <p className="text-slate-500 mt-1">{linkInfo?.label ?? "Schedule your maintenance appointment"}</p>
        </div>

        {/* Property info */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Home className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">{linkInfo?.propertyName}</p>
              <p className="text-sm text-slate-500">{linkInfo?.propertyAddress}{linkInfo?.propertySuburb ? `, ${linkInfo.propertySuburb}` : ""}{linkInfo?.propertyPostcode ? ` ${linkInfo.propertyPostcode}` : ""}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Job type */}
          {!linkInfo?.jobCategory && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">What type of service do you need?</h2>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(JOB_CATEGORIES).map(([key, cat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, jobCategory: key }))}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${form.jobCategory === key ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0`} style={{ backgroundColor: cat.calColor }} />
                    <span className="text-sm font-medium text-slate-900">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {linkInfo?.jobCategory && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
              <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: selectedCat?.calColor }} />
              <span className="text-sm font-semibold text-slate-900">{selectedCat?.label}</span>
            </div>
          )}

          {/* Date selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Choose a date</h2>
            </div>

            {linkInfo?.allowedWeekdays && linkInfo.allowedWeekdays.length > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-700">
                Available days: <strong>{linkInfo.allowedWeekdays.map((d) => WEEKDAYS[d]).join(", ")}</strong>
              </div>
            )}

            <div>
              <Label>Preferred date</Label>
              <Input
                type="date"
                min={getMinDate()}
                value={form.scheduledDate}
                onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                required
                className="mt-1"
                onInput={(e) => {
                  const val = (e.target as HTMLInputElement).value;
                  if (val && linkInfo?.allowedWeekdays && !isWeekdayAllowed(val, linkInfo.allowedWeekdays)) {
                    (e.target as HTMLInputElement).setCustomValidity(`Please choose a ${linkInfo.allowedWeekdays.map((d) => WEEKDAYS[d]).join(" or ")}`);
                  } else {
                    (e.target as HTMLInputElement).setCustomValidity("");
                  }
                }}
              />
            </div>

            <div>
              <Label>Preferred time (optional)</Label>
              <Input type="time" value={form.scheduledTimeStart} onChange={(e) => setForm((f) => ({ ...f, scheduledTimeStart: e.target.value }))} className="mt-1 w-40" />
            </div>
          </div>

          {/* Contact details */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Your details</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Full name *</Label>
                <Input value={form.tenantName} onChange={(e) => setForm((f) => ({ ...f, tenantName: e.target.value }))} placeholder="Your full name" required className="mt-1" />
              </div>
              <div>
                <Label>Unit / apartment</Label>
                <Input value={form.unitNumber} onChange={(e) => setForm((f) => ({ ...f, unitNumber: e.target.value }))} placeholder="e.g. 5B" className="mt-1" />
              </div>
              <div>
                <Label>Phone *</Label>
                <Input value={form.tenantPhone} onChange={(e) => setForm((f) => ({ ...f, tenantPhone: e.target.value }))} placeholder="04xx xxx xxx" required className="mt-1" />
              </div>
              <div className="col-span-2">
                <Label>Email</Label>
                <Input type="email" value={form.tenantEmail} onChange={(e) => setForm((f) => ({ ...f, tenantEmail: e.target.value }))} placeholder="your@email.com" className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Any special instructions?</Label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Access code, parking info, pet warning…"
                className="mt-1 flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <Button
            type="submit"
            loading={submitting}
            disabled={!form.scheduledDate || !form.tenantName || !form.tenantPhone || (!linkInfo?.jobCategory && !form.jobCategory)}
            className="w-full h-11 text-base"
          >
            Confirm booking
          </Button>

          <p className="text-center text-xs text-slate-400">
            You will be contacted to confirm your appointment. Bookings are subject to availability.
          </p>
        </form>
      </div>
    </div>
  );
}
