import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceRequests, properties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
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
