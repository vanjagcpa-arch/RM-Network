import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, properties, bookingLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { nanoid } from "nanoid";
import { sendBookingRequestEmail } from "@/lib/email";
import { JOB_CATEGORIES } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await req.json();
  if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const [row] = await db
    .select({ job: jobs, property: properties })
    .from(jobs)
    .leftJoin(properties, eq(jobs.propertyId, properties.id))
    .where(eq(jobs.id, jobId))
    .limit(1);

  if (!row?.job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
  if (!row.job.tenantEmail) return NextResponse.json({ error: "Job has no tenant email" }, { status: 400 });
  if (!row.property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [link] = await db
    .insert(bookingLinks)
    .values({
      token,
      propertyId: row.job.propertyId,
      jobCategory: row.job.jobCategory,
      label: row.job.title,
      expiresAt,
      maxBookings: 1,
      allowedWeekdays: null,
    })
    .returning();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const bookingUrl = `${appUrl}/book/${token}`;

  const cat = JOB_CATEGORIES[row.job.jobCategory as keyof typeof JOB_CATEGORIES];
  const jobTypeLabel = cat?.label ?? row.job.jobCategory;

  await sendBookingRequestEmail(
    { email: row.job.tenantEmail, name: row.job.tenantName },
    row.property,
    bookingUrl,
    jobTypeLabel
  );

  return NextResponse.json({ ok: true, token, bookingUrl });
}
