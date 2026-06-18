import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceRequests, adminUsers, properties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  const query = db
    .select({
      request: maintenanceRequests,
      agent: { id: adminUsers.id, name: adminUsers.name, email: adminUsers.email, agencyName: adminUsers.agencyName },
      property: { id: properties.id, name: properties.name, address: properties.address, suburb: properties.suburb },
    })
    .from(maintenanceRequests)
    .leftJoin(adminUsers, eq(maintenanceRequests.agentId, adminUsers.id))
    .leftJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
    .orderBy(desc(maintenanceRequests.createdAt));

  const rows = await query;

  const filtered = status ? rows.filter((r) => r.request.status === status) : rows;

  return NextResponse.json(
    filtered.map((r) => ({
      ...r.request,
      agentName: r.agent?.name ?? null,
      agentEmail: r.agent?.email ?? null,
      agencyName: r.agent?.agencyName ?? null,
      propertyName: r.property?.name ?? null,
      propertyAddress: r.property?.address ?? null,
      propertySuburb: r.property?.suburb ?? null,
      submittedByAdminName: r.request.submittedByAdminName ?? null,
    }))
  );
}
