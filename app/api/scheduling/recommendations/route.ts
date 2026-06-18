import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSmartRecommendations } from "@/lib/scheduling";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const daysAhead = parseInt(url.searchParams.get("daysAhead") ?? "30");
  const preferredTechnicianId = url.searchParams.get("technicianId") ?? null;

  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const [property] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const allJobs = await db
    .select({ job: jobs, property: properties })
    .from(jobs)
    .leftJoin(properties, eq(jobs.propertyId, properties.id));

  const nearbyJobs = allJobs
    .filter((r) => r.job.scheduledDate && r.job.status !== "cancelled" && r.job.status !== "completed")
    .map((r) => ({
      scheduledDate: r.job.scheduledDate,
      propertyId: r.job.propertyId,
      buildingId: r.property?.buildingId ?? null,
      suburb: r.property?.suburb,
      postcode: r.property?.postcode,
      technicianId: r.job.technicianId ?? null,
    }));

  const recommendations = getSmartRecommendations(
    {
      id: property.id,
      buildingId: property.buildingId ?? null,
      suburb: property.suburb,
      postcode: property.postcode,
      preferredTechnicianId,
    },
    nearbyJobs,
    daysAhead
  );

  return NextResponse.json(recommendations);
}
