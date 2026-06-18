import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { technicians } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(technicians).orderBy(desc(technicians.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, specialties, color, notes } = body;

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const [tech] = await db
    .insert(technicians)
    .values({
      name,
      email: email || null,
      phone: phone || null,
      specialties: specialties ? JSON.stringify(specialties) : null,
      color: color || "#3b82f6",
      notes: notes || null,
    })
    .returning();

  return NextResponse.json(tech, { status: 201 });
}
