import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, properties } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const status = url.searchParams.get("status");
  const month = url.searchParams.get("month"); // YYYY-MM

  let query = db
    .select({
      job: jobs,
      property: {
        id: properties.id,
        name: properties.name,
        address: properties.address,
        suburb: properties.suburb,
        postcode: properties.postcode,
        state: properties.state,
        contactName: properties.contactName,
        contactPhone: properties.contactPhone,
      },
    })
    .from(jobs)
    .leftJoin(properties, eq(jobs.propertyId, properties.id))
    .orderBy(desc(jobs.createdAt))
    .$dynamic();

  const rows = await query;

  let filtered = rows;
  if (propertyId) filtered = filtered.filter((r) => r.job.propertyId === propertyId);
  if (status) filtered = filtered.filter((r) => r.job.status === status);
  if (month) filtered = filtered.filter((r) => r.job.scheduledDate?.startsWith(month));

  return NextResponse.json(
    filtered.map((r) => ({
      ...r.job,
      property: r.property,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { propertyId, jobCategory, title, description, status, scheduledDate, scheduledTimeStart, scheduledTimeEnd, tenantName, tenantEmail, tenantPhone, unitNumber, notes } = body;

  if (!propertyId || !jobCategory || !title) {
    return NextResponse.json({ error: "propertyId, jobCategory, and title required" }, { status: 400 });
  }

  const [job] = await db
    .insert(jobs)
    .values({ propertyId, jobCategory, title, description, status: status ?? "pending", scheduledDate, scheduledTimeStart, scheduledTimeEnd, tenantName, tenantEmail, tenantPhone, unitNumber, notes })
    .returning();

  return NextResponse.json(job, { status: 201 });
}
