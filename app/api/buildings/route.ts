import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { buildings, properties, jobs } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { asc, eq, inArray, and, ne, isNotNull } from "drizzle-orm";
import { getTodayString } from "@/lib/utils";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = getTodayString();
  const allBuildings = await db.select().from(buildings).orderBy(asc(buildings.name));
  if (allBuildings.length === 0) return NextResponse.json([]);

  const bIds = allBuildings.map((b) => b.id);

  const units = await db
    .select({ id: properties.id, buildingId: properties.buildingId })
    .from(properties)
    .where(and(isNotNull(properties.buildingId), inArray(properties.buildingId, bIds)));

  const unitIds = units.map((u) => u.id);
  const jobRows =
    unitIds.length > 0
      ? await db
          .select({ propertyId: jobs.propertyId, status: jobs.status, scheduledDate: jobs.scheduledDate })
          .from(jobs)
          .where(and(inArray(jobs.propertyId, unitIds), ne(jobs.status, "cancelled")))
      : [];

  const unitCountMap: Record<string, number> = {};
  const unitToBuildingMap: Record<string, string> = {};
  for (const u of units) {
    if (u.buildingId) {
      unitCountMap[u.buildingId] = (unitCountMap[u.buildingId] ?? 0) + 1;
      unitToBuildingMap[u.id] = u.buildingId;
    }
  }

  const statsMap: Record<string, { total: number; overdue: number; upcoming: number }> = {};
  for (const j of jobRows) {
    const bid = unitToBuildingMap[j.propertyId];
    if (!bid) continue;
    if (!statsMap[bid]) statsMap[bid] = { total: 0, overdue: 0, upcoming: 0 };
    if (j.status !== "completed") statsMap[bid].total++;
    if (j.scheduledDate && j.scheduledDate < today && j.status !== "completed") statsMap[bid].overdue++;
    if (j.scheduledDate && j.scheduledDate >= today && j.status !== "completed") statsMap[bid].upcoming++;
  }

  return NextResponse.json(
    allBuildings.map((b) => ({
      ...b,
      unitCount: unitCountMap[b.id] ?? 0,
      ...(statsMap[b.id] ?? { total: 0, overdue: 0, upcoming: 0 }),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, address, suburb, state, postcode, notes } = body;
  if (!name || !address) return NextResponse.json({ error: "Name and address required" }, { status: 400 });

  const [building] = await db.insert(buildings).values({ name, address, suburb, state, postcode, notes }).returning();
  return NextResponse.json(building, { status: 201 });
}
