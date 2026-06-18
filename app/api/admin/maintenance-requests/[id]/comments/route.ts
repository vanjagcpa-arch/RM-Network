import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceRequestComments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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
      id: maintenanceRequestComments.id,
      authorName: maintenanceRequestComments.authorName,
      authorRole: maintenanceRequestComments.authorRole,
      content: maintenanceRequestComments.content,
      createdAt: maintenanceRequestComments.createdAt,
    })
    .from(maintenanceRequestComments)
    .where(eq(maintenanceRequestComments.requestId, id))
    .orderBy(desc(maintenanceRequestComments.createdAt));

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
  const { content } = body;

  if (!content || typeof content !== "string" || content.trim() === "") {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const [row] = await db
    .insert(maintenanceRequestComments)
    .values({
      requestId: id,
      authorId: session.userId,
      authorName: session.name,
      authorRole: (session.role as string) ?? "admin",
      content: content.trim(),
    })
    .returning({
      id: maintenanceRequestComments.id,
      authorName: maintenanceRequestComments.authorName,
      authorRole: maintenanceRequestComments.authorRole,
      content: maintenanceRequestComments.content,
      createdAt: maintenanceRequestComments.createdAt,
    });

  return NextResponse.json(row, { status: 201 });
}
