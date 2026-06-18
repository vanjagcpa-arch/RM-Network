import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookingLinks, properties } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const [row] = await db
    .select({ link: bookingLinks, property: properties })
    .from(bookingLinks)
    .leftJoin(properties, eq(bookingLinks.propertyId, properties.id))
    .where(eq(bookingLinks.token, token))
    .limit(1);

  if (!row?.link) return NextResponse.json({ error: "Invalid link" }, { status: 404 });

  const bl = row.link;
  if (!bl.isActive) return NextResponse.json({ error: "Link deactivated" }, { status: 410 });
  if (bl.expiresAt && new Date() > bl.expiresAt) return NextResponse.json({ error: "Link expired" }, { status: 410 });
  if (bl.maxBookings && bl.currentBookings >= bl.maxBookings) return NextResponse.json({ error: "Fully booked" }, { status: 410 });

  return NextResponse.json({
    propertyName: row.property?.name,
    propertyAddress: row.property?.address,
    propertySuburb: row.property?.suburb,
    propertyPostcode: row.property?.postcode,
    jobCategory: bl.jobCategory,
    label: bl.label,
    allowedWeekdays: bl.allowedWeekdays ? JSON.parse(bl.allowedWeekdays) : null,
    allowedTimeStart: bl.allowedTimeStart ?? null,
    allowedTimeEnd: bl.allowedTimeEnd ?? null,
    maxBookings: bl.maxBookings,
    currentBookings: bl.currentBookings,
  });
}
