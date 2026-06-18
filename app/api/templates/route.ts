import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobTemplates } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await db.select().from(jobTemplates).orderBy(desc(jobTemplates.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, jobCategory, titleTemplate, description, recurringIntervalMonths, estimatedMinutes, notes } = body;
  if (!name || !jobCategory || !titleTemplate) {
    return NextResponse.json({ error: "name, jobCategory, and titleTemplate required" }, { status: 400 });
  }
  const [tpl] = await db
    .insert(jobTemplates)
    .values({ name, jobCategory, titleTemplate, description, recurringIntervalMonths: recurringIntervalMonths || null, estimatedMinutes: estimatedMinutes || null, notes })
    .returning();
  return NextResponse.json(tpl, { status: 201 });
}
