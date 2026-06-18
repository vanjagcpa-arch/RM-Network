import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const [prop] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  if (!prop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prop);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { name, address, suburb, postcode, state, contactName, contactEmail, contactPhone, notes } = body;

  const [prop] = await db
    .update(properties)
    .set({ name, address, suburb, postcode, state, contactName, contactEmail, contactPhone, notes, updatedAt: new Date() })
    .where(eq(properties.id, id))
    .returning();

  if (!prop) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(prop);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(properties).where(eq(properties.id, id));
  return NextResponse.json({ ok: true });
}
