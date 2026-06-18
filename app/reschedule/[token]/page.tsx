"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Wrench, Calendar, Clock, MapPin, CheckCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JobInfo {
  id: string;
  title: string;
  scheduledDate: string | null;
  scheduledTimeStart: string | null;
  propertyName: string | null;
  propertyAddress: string | null;
  propertySuburb: string | null;
}

function fmtDate(s: string) {
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function fmtTime(t: string) {
  return new Date(`2000-01-01T${t}`).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
}

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function ReschedulePage() {
  const { token } = useParams<{ token: string }>();
  const [jobInfo, setJobInfo] = useState<JobInfo | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"form" | "success" | "error">("form");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    fetch(`/api/reschedule/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setLoadError(data.error);
        else {
          setJobInfo(data);
          setNewDate(data.scheduledDate ?? "");
          setNewTime(data.scheduledTimeStart ?? "");
        }
      })
      .catch(() => setLoadError("Unable to load your appointment."))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/reschedule/${token}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledDate: newDate, scheduledTimeStart: newTime }),
    });
    if (res.ok) {
      setStep("success");
    } else {
      const data = await res.json();
      setLoadError(data.error ?? "Reschedule failed. Please try again.");
      setStep("error");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
          <p className="text-sm text-slate-400 mt-4">Please contact your property manager for assistance.</p>
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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment rescheduled!</h2>
          <p className="text-slate-500 mb-5">Your new appointment details:</p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Date</span>
              <span className="font-semibold text-slate-900">{newDate ? fmtDate(newDate) : "—"}</span>
            </div>
            {newTime && (
              <div className="flex justify-between">
                <span className="text-slate-500">Time</span>
                <span className="font-semibold text-slate-900">{fmtTime(newTime)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Property</span>
              <span className="font-semibold text-slate-900">{jobInfo?.propertyName}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-5">Your property manager will be notified of the change.</p>
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
          <h1 className="text-2xl font-bold text-slate-900">Reschedule appointment</h1>
          <p className="text-slate-500 mt-1">Choose a new date and time for your service</p>
        </div>

        {/* Current appointment */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Current appointment</h2>
          <p className="font-semibold text-slate-900 mb-3">{jobInfo?.title}</p>
          <div className="space-y-1.5 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              <span>{jobInfo?.propertyName}{jobInfo?.propertySuburb ? `, ${jobInfo.propertySuburb}` : ""}</span>
            </div>
            {jobInfo?.scheduledDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span>{fmtDate(jobInfo.scheduledDate)}</span>
              </div>
            )}
            {jobInfo?.scheduledTimeStart && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span>{fmtTime(jobInfo.scheduledTimeStart)}</span>
              </div>
            )}
          </div>
        </div>

        {/* New time picker */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <RefreshCw className="h-4 w-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">New date & time</h2>
            </div>
            <div>
              <Label>New date *</Label>
              <Input type="date" min={getMinDate()} value={newDate} onChange={(e) => setNewDate(e.target.value)} required className="mt-1" />
            </div>
            <div>
              <Label>Preferred time (optional)</Label>
              <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="mt-1 w-40" />
            </div>
          </div>

          {step === "error" && (
            <p className="text-sm text-red-600 mb-4 text-center">{loadError}</p>
          )}

          <Button type="submit" loading={saving} disabled={!newDate} className="w-full h-11 text-base">
            Confirm new time
          </Button>
          <p className="text-center text-xs text-slate-400 mt-3">Your property manager will be notified of the change.</p>
        </form>
      </div>
    </div>
  );
}
