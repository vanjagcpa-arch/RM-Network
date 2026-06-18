import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceRequests, bookingLinks, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { nanoid } from "nanoid";
import { sendBookingRequestEmail } from "@/lib/email";
import { JOB_CATEGORIES } from "@/lib/utils";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action, allowedWeekdays, allowedTimeStart, allowedTimeEnd, rejectionReason } = body;

  if (!action) return NextResponse.json({ error: "action required" }, { status: 400 });

  const [row] = await db
    .select({ request: maintenanceRequests, property: properties })
    .from(maintenanceRequests)
    .leftJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
    .where(eq(maintenanceRequests.id, id))
    .limit(1);

  if (!row?.request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const request = row.request;
  const property = row.property;

  if (request.status !== "pending") {
    return NextResponse.json({ error: "Request is not pending" }, { status: 400 });
  }

  if (action === "reject") {
    await db
      .update(maintenanceRequests)
      .set({ status: "rejected", rejectionReason: rejectionReason ?? null, updatedAt: new Date() })
      .where(eq(maintenanceRequests.id, id));
    return NextResponse.json({ ok: true });
  }

  if (action === "approve") {
    if (!request.tenantEmail) {
      return NextResponse.json({ error: "Tenant email is required to send booking link" }, { status: 400 });
    }
    if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const cat = JOB_CATEGORIES[request.jobCategory as keyof typeof JOB_CATEGORIES];
    const label = `${cat?.label ?? request.jobCategory} — ${property.name}`;

    const [bl] = await db
      .insert(bookingLinks)
      .values({
        token,
        propertyId: request.propertyId,
        jobCategory: request.jobCategory,
        label,
        expiresAt,
        maxBookings: 1,
        allowedWeekdays: allowedWeekdays ? JSON.stringify(allowedWeekdays) : null,
        allowedTimeStart: allowedTimeStart ?? null,
        allowedTimeEnd: allowedTimeEnd ?? null,
      })
      .returning();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendBookingRequestEmail(
      { email: request.tenantEmail, name: request.tenantName },
      property,
      `${appUrl}/book/${token}`,
      cat?.label ?? request.jobCategory
    );

    await db
      .update(maintenanceRequests)
      .set({
        status: "sent",
        bookingLinkId: bl.id,
        allowedWeekdays: allowedWeekdays ? JSON.stringify(allowedWeekdays) : null,
        allowedTimeStart: allowedTimeStart ?? null,
        allowedTimeEnd: allowedTimeEnd ?? null,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceRequests.id, id));

    return NextResponse.json({ ok: true, token });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
