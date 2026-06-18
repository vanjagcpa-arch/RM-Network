import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { technicians } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const { name, email, phone, specialties, color, isActive, notes } = body;
  const [tech] = await db
    .update(technicians)
    .set({
      name,
      email: email || null,
      phone: phone || null,
      specialties: specialties ? JSON.stringify(specialties) : null,
      color: color || "#3b82f6",
      isActive: isActive ?? true,
      notes: notes || null,
    })
    .where(eq(technicians.id, id))
    .returning();

  if (!tech) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tech);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(technicians).where(eq(technicians.id, id));
  return NextResponse.json({ ok: true });
}
