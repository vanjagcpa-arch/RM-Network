import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceRequests, properties, adminUsers, agentPropertyLinks } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rows = await db
    .select({ request: maintenanceRequests, property: properties })
    .from(maintenanceRequests)
    .leftJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
    .where(eq(maintenanceRequests.agentId, id))
    .orderBy(desc(maintenanceRequests.createdAt))
    .limit(50);

  return NextResponse.json(rows.map((r) => ({ ...r.request, property: r.property })));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [agent] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  if (!agent || agent.role !== "agent") return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const body = await req.json();
  const {
    propertyId, jobCategory, title, description,
    tenantName, tenantEmail, tenantPhone, unitNumber,
    notes, allowedWeekdays, allowedTimeStart, allowedTimeEnd,
  } = body;

  if (!propertyId || !jobCategory || !title) {
    return NextResponse.json({ error: "propertyId, jobCategory, and title are required" }, { status: 400 });
  }

  // Verify the property is assigned to this agent
  const [link] = await db
    .select()
    .from(agentPropertyLinks)
    .where(and(eq(agentPropertyLinks.agentId, id), eq(agentPropertyLinks.propertyId, propertyId)))
    .limit(1);
  if (!link) return NextResponse.json({ error: "Property not assigned to this agent" }, { status: 403 });

  const [request] = await db
    .insert(maintenanceRequests)
    .values({
      agentId: id,
      propertyId,
      jobCategory,
      title,
      description: description || null,
      tenantName: tenantName || null,
      tenantEmail: tenantEmail || null,
      tenantPhone: tenantPhone || null,
      unitNumber: unitNumber || null,
      notes: notes || null,
      allowedWeekdays: allowedWeekdays || null,
      allowedTimeStart: allowedTimeStart || null,
      allowedTimeEnd: allowedTimeEnd || null,
      submittedByAdminName: session.name,
    })
    .returning();

  return NextResponse.json(request, { status: 201 });
}
