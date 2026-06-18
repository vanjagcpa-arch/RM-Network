import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, properties, bookingLinks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSession } from "@/lib/auth";
import { sendBookingRequestEmail } from "@/lib/email";
import { JOB_CATEGORIES } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!job.tenantEmail) {
    return NextResponse.json({ error: "Job has no tenant email" }, { status: 400 });
  }

  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, job.propertyId))
    .limit(1);
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const body = await req.json().catch(() => ({})) as {
    allowedWeekdays?: number[];
    allowedTimeStart?: string;
    allowedTimeEnd?: string;
  };

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [bookingLink] = await db
    .insert(bookingLinks)
    .values({
      token,
      propertyId: job.propertyId,
      jobCategory: job.jobCategory,
      expiresAt,
      maxBookings: 1,
      ...(body.allowedWeekdays !== undefined && {
        allowedWeekdays: body.allowedWeekdays.join(","),
      }),
      ...(body.allowedTimeStart !== undefined && {
        allowedTimeStart: body.allowedTimeStart,
      }),
      ...(body.allowedTimeEnd !== undefined && {
        allowedTimeEnd: body.allowedTimeEnd,
      }),
    })
    .returning();

  const bookingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/book/${token}`;

  const categoryEntry = JOB_CATEGORIES[job.jobCategory as keyof typeof JOB_CATEGORIES];
  const jobTypeLabel = categoryEntry?.label ?? job.jobCategory;

  await sendBookingRequestEmail(
    { email: job.tenantEmail, name: job.tenantName },
    property,
    bookingUrl,
    jobTypeLabel
  );

  await db
    .update(jobs)
    .set({ bookingLinkId: bookingLink.id, updatedAt: new Date() })
    .where(eq(jobs.id, id));

  return NextResponse.json({ ok: true });
}
