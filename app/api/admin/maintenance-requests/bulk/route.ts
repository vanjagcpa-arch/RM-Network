import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceRequests, bookingLinks, properties } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { nanoid } from "nanoid";
import { sendBookingRequestEmail } from "@/lib/email";
import { JOB_CATEGORIES } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { ids, action, rejectionReason } = body as {
    ids: string[];
    action: "approve" | "reject";
    rejectionReason?: string;
  };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array is required" }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  // Fetch all pending requests in the given ids
  const rows = await db
    .select({ request: maintenanceRequests, property: properties })
    .from(maintenanceRequests)
    .leftJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
    .where(inArray(maintenanceRequests.id, ids));

  const pendingRows = rows.filter((r) => r.request.status === "pending");

  if (pendingRows.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  if (action === "reject") {
    await db
      .update(maintenanceRequests)
      .set({
        status: "rejected",
        rejectionReason: rejectionReason ?? null,
        updatedAt: new Date(),
      })
      .where(
        inArray(
          maintenanceRequests.id,
          pendingRows.map((r) => r.request.id)
        )
      );
    return NextResponse.json({ updated: pendingRows.length });
  }

  // approve: only rows that have a tenant email
  const approvable = pendingRows.filter((r) => !!r.request.tenantEmail);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  let updated = 0;
  for (const row of approvable) {
    const request = row.request;
    const property = row.property;
    if (!property) continue;

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
        allowedWeekdays: request.allowedWeekdays,
        allowedTimeStart: request.allowedTimeStart,
        allowedTimeEnd: request.allowedTimeEnd,
      })
      .returning();

    await sendBookingRequestEmail(
      { email: request.tenantEmail!, name: request.tenantName },
      property,
      `${appUrl}/book/${token}`,
      cat?.label ?? request.jobCategory
    );

    await db
      .update(maintenanceRequests)
      .set({
        status: "sent",
        bookingLinkId: bl.id,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceRequests.id, request.id));

    updated++;
  }

  return NextResponse.json({ updated });
}
