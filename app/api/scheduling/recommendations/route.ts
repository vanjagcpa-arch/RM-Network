import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, properties } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSmartRecommendations } from "@/lib/scheduling";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const daysAhead = parseInt(url.searchParams.get("daysAhead") ?? "30");

  if (!propertyId) return NextResponse.json({ error: "propertyId required" }, { status: 400 });

  const [property] = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  if (!property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  const allJobs = await db
    .select({ job: jobs, property: properties })
    .from(jobs)
    .leftJoin(properties, eq(jobs.propertyId, properties.id));

  const nearbyJobs = allJobs
    .filter((r) => r.job.scheduledDate && r.job.status !== "cancelled")
    .map((r) => ({
      scheduledDate: r.job.scheduledDate,
      propertyId: r.job.propertyId,
      suburb: r.property?.suburb,
      postcode: r.property?.postcode,
    }));

  const recommendations = getSmartRecommendations(
    { id: property.id, suburb: property.suburb, postcode: property.postcode },
    nearbyJobs,
    daysAhead
  );

  return NextResponse.json(recommendations);
}
