import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, properties } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [row] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      scheduledDate: jobs.scheduledDate,
      scheduledTimeStart: jobs.scheduledTimeStart,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertySuburb: properties.suburb,
    })
    .from(jobs)
    .leftJoin(properties, eq(jobs.propertyId, properties.id))
    .where(eq(jobs.rescheduleToken, token))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Link not found or expired" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { scheduledDate, scheduledTimeStart } = await req.json();

  if (!scheduledDate) return NextResponse.json({ error: "scheduledDate required" }, { status: 400 });

  const [existing] = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.rescheduleToken, token)).limit(1);
  if (!existing) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  await db
    .update(jobs)
    .set({ scheduledDate, scheduledTimeStart: scheduledTimeStart || null, updatedAt: new Date() })
    .where(eq(jobs.rescheduleToken, token));

  return NextResponse.json({ ok: true });
}
