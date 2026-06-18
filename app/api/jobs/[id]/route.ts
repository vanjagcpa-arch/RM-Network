import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, properties } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { sendJobConfirmationEmail } from "@/lib/email";

function addMonthsToDateStr(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const next = new Date(y, m - 1 + months, d);
  return next.toISOString().split("T")[0];
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(job);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const [existing] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await db
    .update(jobs)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(jobs.id, id))
    .returning();

  // Auto-create next recurring job when this one is completed
  if (
    body.status === "completed" &&
    existing.status !== "completed" &&
    existing.recurringIntervalMonths
  ) {
    const baseDate = existing.scheduledDate ?? new Date().toISOString().split("T")[0];
    const nextDate = addMonthsToDateStr(baseDate, existing.recurringIntervalMonths);
    await db.insert(jobs).values({
      propertyId: existing.propertyId,
      jobCategory: existing.jobCategory,
      title: existing.title,
      description: existing.description,
      status: "pending",
      scheduledDate: nextDate,
      scheduledTimeStart: existing.scheduledTimeStart,
      scheduledTimeEnd: existing.scheduledTimeEnd,
      tenantName: existing.tenantName,
      tenantEmail: existing.tenantEmail,
      tenantPhone: existing.tenantPhone,
      unitNumber: existing.unitNumber,
      technicianId: existing.technicianId,
      notes: existing.notes,
      recurringIntervalMonths: existing.recurringIntervalMonths,
      parentJobId: id,
    });
  }

  // Send confirmation email when job becomes confirmed
  if (
    body.status === "confirmed" &&
    existing.status !== "confirmed" &&
    updated.tenantEmail &&
    updated.scheduledDate
  ) {
    const [property] = await db.select().from(properties).where(eq(properties.id, updated.propertyId)).limit(1);
    if (property) {
      sendJobConfirmationEmail(
        { ...updated, tenantEmail: updated.tenantEmail, scheduledDate: updated.scheduledDate },
        property
      ).catch(console.error);
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(jobs).where(eq(jobs.id, id));
  return NextResponse.json({ ok: true });
}
