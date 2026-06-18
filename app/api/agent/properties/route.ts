import { NextResponse } from "next/server";
import { db } from "@/db";
import { agentPropertyLinks, properties, buildings, maintenanceRequests } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const links = await db
    .select({
      propertyId: agentPropertyLinks.propertyId,
      property: properties,
      buildingName: buildings.name,
    })
    .from(agentPropertyLinks)
    .leftJoin(properties, eq(agentPropertyLinks.propertyId, properties.id))
    .leftJoin(buildings, eq(properties.buildingId, buildings.id))
    .where(eq(agentPropertyLinks.agentId, session.userId));

  const propertyIds = links.map((l) => l.propertyId);
  if (propertyIds.length === 0) return NextResponse.json([]);

  // Get pending request counts per property
  const pendingCounts = await db
    .select({
      propertyId: maintenanceRequests.propertyId,
      count: count(),
    })
    .from(maintenanceRequests)
    .where(
      and(
        eq(maintenanceRequests.agentId, session.userId),
        eq(maintenanceRequests.status, "pending")
      )
    )
    .groupBy(maintenanceRequests.propertyId);

  const pendingMap = new Map(pendingCounts.map((r) => [r.propertyId, r.count]));

  return NextResponse.json(
    links
      .filter((l) => l.property)
      .map((l) => ({
        ...l.property!,
        buildingName: l.buildingName ?? null,
        pendingRequests: pendingMap.get(l.propertyId) ?? 0,
      }))
  );
}
