import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, properties, technicians } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";
import { sendJobConfirmationEmail } from "@/lib/email";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const status = url.searchParams.get("status");
  const month = url.searchParams.get("month"); // YYYY-MM
  const technicianId = url.searchParams.get("technicianId");

  const rows = await db
    .select({
      job: jobs,
      property: {
        id: properties.id,
        name: properties.name,
        address: properties.address,
        suburb: properties.suburb,
        postcode: properties.postcode,
        state: properties.state,
        contactName: properties.contactName,
        contactPhone: properties.contactPhone,
      },
      technician: {
        id: technicians.id,
        name: technicians.name,
        color: technicians.color,
      },
    })
    .from(jobs)
    .leftJoin(properties, eq(jobs.propertyId, properties.id))
    .leftJoin(technicians, eq(jobs.technicianId, technicians.id))
    .orderBy(desc(jobs.createdAt));

  let filtered = rows;
  if (propertyId) filtered = filtered.filter((r) => r.job.propertyId === propertyId);
  if (status) filtered = filtered.filter((r) => r.job.status === status);
  if (month) filtered = filtered.filter((r) => r.job.scheduledDate?.startsWith(month));
  if (technicianId) filtered = filtered.filter((r) => r.job.technicianId === technicianId);

  return NextResponse.json(
    filtered.map((r) => ({
      ...r.job,
      property: r.property,
      technician: r.technician?.id ? r.technician : null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { propertyId, jobCategory, title, description, status, scheduledDate, scheduledTimeStart, scheduledTimeEnd, tenantName, tenantEmail, tenantPhone, unitNumber, notes, technicianId, recurringIntervalMonths } = body;

  if (!propertyId || !jobCategory || !title) {
    return NextResponse.json({ error: "propertyId, jobCategory, and title required" }, { status: 400 });
  }

  const rescheduleToken = tenantEmail ? nanoid(21) : null;

  const [job] = await db
    .insert(jobs)
    .values({
      propertyId, jobCategory, title, description,
      status: status ?? "pending",
      scheduledDate, scheduledTimeStart, scheduledTimeEnd,
      tenantName, tenantEmail, tenantPhone, unitNumber, notes,
      technicianId: technicianId || null,
      recurringIntervalMonths: recurringIntervalMonths || null,
      rescheduleToken,
    })
    .returning();

  // Send confirmation email if created as confirmed with tenant email + date
  if (job.status === "confirmed" && job.tenantEmail && job.scheduledDate) {
    const [property] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
    if (property) {
      sendJobConfirmationEmail(
        { ...job, tenantEmail: job.tenantEmail, scheduledDate: job.scheduledDate },
        property
      ).catch(console.error);
    }
  }

  return NextResponse.json(job, { status: 201 });
}
