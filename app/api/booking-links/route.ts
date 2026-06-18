import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookingLinks } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { nanoid } from "nanoid";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(bookingLinks).orderBy(desc(bookingLinks.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { propertyId, jobCategory, label, expiresAt, maxBookings, allowedWeekdays } = body;

  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const token = nanoid(32);

  const [link] = await db
    .insert(bookingLinks)
    .values({
      token,
      propertyId,
      jobCategory: jobCategory || null,
      label: label || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxBookings: maxBookings ?? 0,
      allowedWeekdays: allowedWeekdays ? JSON.stringify(allowedWeekdays) : null,
    })
    .returning();

  return NextResponse.json(link, { status: 201 });
}
