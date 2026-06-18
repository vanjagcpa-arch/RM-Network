import { db } from "@/db";
import { properties, jobs, bookingLinks } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { JobCategoryBadge } from "@/components/admin/job-category-badge";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, MapPin, Phone, Mail, ClipboardList, Link2, Plus, Calendar } from "lucide-react";
import { PropertyActions } from "./property-actions";

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;

  const [property, propJobs, propLinks] = await Promise.all([
    db.select().from(properties).where(eq(properties.id, id)).limit(1).then((r) => r[0]),
    db.select().from(jobs).where(eq(jobs.propertyId, id)).orderBy(desc(jobs.createdAt)).limit(20),
    db.select().from(bookingLinks).where(eq(bookingLinks.propertyId, id)).orderBy(desc(bookingLinks.createdAt)),
  ]);

  if (!property) notFound();

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to properties
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
          <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
            <MapPin className="h-3.5 w-3.5" />
            <span>{[property.address, property.suburb, property.state, property.postcode].filter(Boolean).join(", ")}</span>
          </div>
        </div>
        <PropertyActions property={property} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Contact</h2>
          <div className="space-y-2 text-sm text-slate-600">
            {property.contactName && <p className="font-medium text-slate-900">{property.contactName}</p>}
            {property.contactPhone && (
              <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" />{property.contactPhone}</div>
            )}
            {property.contactEmail && (
              <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" />{property.contactEmail}</div>
            )}
            {!property.contactName && !property.contactPhone && !property.contactEmail && (
              <p className="text-slate-400 italic">No contact info</p>
            )}
          </div>
          {property.notes && (
            <>
              <hr className="my-3 border-slate-100" />
              <p className="text-sm text-slate-500 whitespace-pre-line">{property.notes}</p>
            </>
          )}
        </div>

        {/* Jobs */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">Jobs ({propJobs.length})</h2>
              </div>
              <Link href={`/jobs/new?propertyId=${property.id}`} className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                <Plus className="h-3.5 w-3.5" /> New job
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {propJobs.length === 0 ? (
                <div className="px-5 py-6 text-center text-sm text-slate-500">No jobs for this property</div>
              ) : (
                propJobs.map((job) => (
                  <div key={job.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{job.title}</p>
                      {job.scheduledDate && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          <Calendar className="inline h-3 w-3 mr-0.5" />
                          {formatDate(job.scheduledDate)}{job.scheduledTimeStart && ` at ${formatTime(job.scheduledTimeStart)}`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={job.status} />
                      <JobCategoryBadge category={job.jobCategory} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Booking links */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">Booking Links ({propLinks.length})</h2>
              </div>
              <Link href={`/links?propertyId=${property.id}`} className="text-xs text-blue-600 hover:underline">Manage →</Link>
            </div>
            {propLinks.length === 0 ? (
              <div className="px-5 py-6 text-center text-sm text-slate-500">
                No booking links yet.{" "}
                <Link href="/links" className="text-blue-600 hover:underline">Create one →</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {propLinks.map((link) => (
                  <div key={link.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{link.label || "Booking link"}</p>
                      <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{`/book/${link.token}`}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${link.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {link.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
