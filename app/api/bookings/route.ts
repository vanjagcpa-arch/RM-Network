import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookingLinks, jobs, properties } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, jobCategory, scheduledDate, scheduledTimeStart, scheduledTimeEnd, tenantName, tenantEmail, tenantPhone, unitNumber, notes } = body;

  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const [link] = await db
    .select({ link: bookingLinks, property: properties })
    .from(bookingLinks)
    .leftJoin(properties, eq(bookingLinks.propertyId, properties.id))
    .where(eq(bookingLinks.token, token))
    .limit(1);

  if (!link?.link) return NextResponse.json({ error: "Invalid booking link" }, { status: 404 });

  const bl = link.link;

  if (!bl.isActive) return NextResponse.json({ error: "This booking link is no longer active" }, { status: 410 });

  if (bl.expiresAt && new Date() > bl.expiresAt) {
    return NextResponse.json({ error: "This booking link has expired" }, { status: 410 });
  }

  if (bl.maxBookings && bl.currentBookings >= bl.maxBookings) {
    return NextResponse.json({ error: "This booking link has reached its maximum bookings" }, { status: 410 });
  }

  if (bl.allowedWeekdays && scheduledDate) {
    const allowedDays: number[] = JSON.parse(bl.allowedWeekdays);
    const dayOfWeek = new Date(scheduledDate + "T00:00:00").getDay();
    if (!allowedDays.includes(dayOfWeek)) {
      return NextResponse.json({ error: "Selected date is not available for booking" }, { status: 400 });
    }
  }

  const cat = bl.jobCategory ?? jobCategory;
  if (!cat) return NextResponse.json({ error: "Job category required" }, { status: 400 });

  const prop = link.property!;
  const title = `${cat.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} — ${prop.name}`;

  const [job] = await db
    .insert(jobs)
    .values({
      propertyId: bl.propertyId,
      jobCategory: cat,
      title,
      status: "pending",
      scheduledDate: scheduledDate ?? null,
      scheduledTimeStart: scheduledTimeStart ?? null,
      scheduledTimeEnd: scheduledTimeEnd ?? null,
      tenantName: tenantName ?? null,
      tenantEmail: tenantEmail ?? null,
      tenantPhone: tenantPhone ?? null,
      unitNumber: unitNumber ?? null,
      notes: notes ?? null,
      bookingLinkId: bl.id,
    })
    .returning();

  await db
    .update(bookingLinks)
    .set({ currentBookings: bl.currentBookings + 1 })
    .where(eq(bookingLinks.id, bl.id));

  return NextResponse.json({ ok: true, jobId: job.id }, { status: 201 });
}
