import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { technicianBlockouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rows = await db
    .select({
      id: technicianBlockouts.id,
      blockDate: technicianBlockouts.blockDate,
      reason: technicianBlockouts.reason,
    })
    .from(technicianBlockouts)
    .where(eq(technicianBlockouts.technicianId, id))
    .orderBy(technicianBlockouts.blockDate);

  return NextResponse.json(rows);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { blockDate, reason } = body;

  if (!blockDate) {
    return NextResponse.json({ error: "blockDate is required" }, { status: 400 });
  }

  const [row] = await db
    .insert(technicianBlockouts)
    .values({
      technicianId: id,
      blockDate,
      reason: reason ?? null,
    })
    .returning({
      id: technicianBlockouts.id,
      blockDate: technicianBlockouts.blockDate,
      reason: technicianBlockouts.reason,
    });

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = new URL(req.url);
  const blockDate = url.searchParams.get("date");

  if (!blockDate) {
    return NextResponse.json({ error: "date query param is required" }, { status: 400 });
  }

  await db
    .delete(technicianBlockouts)
    .where(
      and(
        eq(technicianBlockouts.technicianId, id),
        eq(technicianBlockouts.blockDate, blockDate)
      )
    );

  return NextResponse.json({ ok: true });
}
