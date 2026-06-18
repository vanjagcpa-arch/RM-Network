import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(properties).orderBy(desc(properties.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, address, suburb, postcode, state, contactName, contactEmail, contactPhone, notes, buildingId } = body;

  if (!name || !address) {
    return NextResponse.json({ error: "Name and address required" }, { status: 400 });
  }

  const [prop] = await db
    .insert(properties)
    .values({ name, address, suburb, postcode, state, contactName, contactEmail, contactPhone, notes, buildingId: buildingId || null })
    .returning();

  return NextResponse.json(prop, { status: 201 });
}
