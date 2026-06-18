import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobTemplates } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const { name, jobCategory, titleTemplate, description, recurringIntervalMonths, estimatedMinutes, notes } = body;
  const [tpl] = await db
    .update(jobTemplates)
    .set({ name, jobCategory, titleTemplate, description, recurringIntervalMonths: recurringIntervalMonths || null, estimatedMinutes: estimatedMinutes || null, notes })
    .where(eq(jobTemplates.id, id))
    .returning();
  if (!tpl) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tpl);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await db.delete(jobTemplates).where(eq(jobTemplates.id, id));
  return NextResponse.json({ ok: true });
}
