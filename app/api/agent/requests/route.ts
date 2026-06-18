import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceRequests, agentPropertyLinks, bookingLinks, properties } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { nanoid } from "nanoid";
import { sendBookingRequestEmail } from "@/lib/email";
import { JOB_CATEGORIES } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get("propertyId");

    const conditions = [eq(maintenanceRequests.agentId, session.userId)];
    if (propertyId) conditions.push(eq(maintenanceRequests.propertyId, propertyId));

    const rows = await db
      .select({ request: maintenanceRequests, property: properties })
      .from(maintenanceRequests)
      .leftJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
      .where(and(...conditions))
      .orderBy(desc(maintenanceRequests.createdAt));

    return NextResponse.json(
      rows.map((r) => ({
        ...r.request,
        propertyName: r.property?.name ?? null,
        propertyAddress: r.property?.address ?? null,
      }))
    );
  } catch (err) {
    console.error("GET /api/agent/requests", err);
    return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    propertyId,
    jobCategory,
    title,
    description,
    tenantName,
    tenantEmail,
    tenantPhone,
    unitNumber,
    notes,
    sendDirectly,
    allowedWeekdays,
    allowedTimeStart,
    allowedTimeEnd,
  } = body;

  if (!propertyId || !jobCategory || !title) {
    return NextResponse.json({ error: "propertyId, jobCategory, and title are required" }, { status: 400 });
  }

  // Verify agent has access to this property
  const [link] = await db
    .select()
    .from(agentPropertyLinks)
    .where(and(eq(agentPropertyLinks.agentId, session.userId), eq(agentPropertyLinks.propertyId, propertyId)))
    .limit(1);

  if (!link) return NextResponse.json({ error: "Property not assigned to you" }, { status: 403 });

  const [property] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  let status = "pending";
  let bookingLinkId: string | null = null;

  if (sendDirectly && tenantEmail) {
    // Create booking link immediately and send to tenant
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const cat = JOB_CATEGORIES[jobCategory as keyof typeof JOB_CATEGORIES];
    const label = `${cat?.label ?? jobCategory} — ${property.name}`;

    const [bl] = await db
      .insert(bookingLinks)
      .values({ token, propertyId, jobCategory, label, expiresAt, maxBookings: 1 })
      .returning();

    bookingLinkId = bl.id;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendBookingRequestEmail(
      { email: tenantEmail, name: tenantName },
      property,
      `${appUrl}/book/${token}`,
      cat?.label ?? jobCategory
    );

    status = "sent";
  }

  const [request] = await db
    .insert(maintenanceRequests)
    .values({
      agentId: session.userId,
      propertyId,
      tenantName: tenantName ?? null,
      tenantEmail: tenantEmail ?? null,
      tenantPhone: tenantPhone ?? null,
      unitNumber: unitNumber ?? null,
      jobCategory,
      title,
      description: description ?? null,
      status,
      bookingLinkId,
      notes: notes ?? null,
      allowedWeekdays: allowedWeekdays ?? null,
      allowedTimeStart: allowedTimeStart ?? null,
      allowedTimeEnd: allowedTimeEnd ?? null,
    })
    .returning();

  return NextResponse.json(request, { status: 201 });
}
