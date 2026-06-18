import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { buildings, properties, jobs, technicians } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, inArray, and, ne, desc } from "drizzle-orm";
import { getTodayString } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const today = getTodayString();

  const [building] = await db.select().from(buildings).where(eq(buildings.id, id)).limit(1);
  if (!building) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const units = await db
    .select()
    .from(properties)
    .where(eq(properties.buildingId, id))
    .orderBy(properties.name);

  if (units.length === 0) return NextResponse.json({ building, units: [] });

  const unitIds = units.map((u) => u.id);
  const jobRows = await db
    .select({ job: jobs, tech: technicians })
    .from(jobs)
    .leftJoin(technicians, eq(jobs.technicianId, technicians.id))
    .where(and(inArray(jobs.propertyId, unitIds), ne(jobs.status, "cancelled")))
    .orderBy(desc(jobs.createdAt));

  const jobsByUnit: Record<string, typeof jobRows> = {};
  for (const r of jobRows) {
    const pid = r.job.propertyId;
    if (!jobsByUnit[pid]) jobsByUnit[pid] = [];
    jobsByUnit[pid].push(r);
  }

  const unitsWithStats = units.map((unit) => {
    const unitJobs = jobsByUnit[unit.id] ?? [];
    const active = unitJobs.filter((r) => r.job.status !== "completed");
    const overdue = active.filter((r) => r.job.scheduledDate && r.job.scheduledDate < today);
    const upcoming = active.filter((r) => r.job.scheduledDate && r.job.scheduledDate >= today);
    const completed = unitJobs.filter((r) => r.job.status === "completed");

    const nextJob = upcoming.sort((a, b) => (a.job.scheduledDate ?? "").localeCompare(b.job.scheduledDate ?? ""))[0];
    const lastCompleted = completed.sort((a, b) => (b.job.scheduledDate ?? "").localeCompare(a.job.scheduledDate ?? ""))[0];

    return {
      ...unit,
      jobStats: {
        total: unitJobs.length,
        active: active.length,
        overdue: overdue.length,
        upcoming: upcoming.length,
        completed: completed.length,
        nextScheduledDate: nextJob?.job.scheduledDate ?? null,
        nextJobTitle: nextJob?.job.title ?? null,
        lastCompletedDate: lastCompleted?.job.scheduledDate ?? null,
        overdueJobs: overdue.map((r) => ({ id: r.job.id, title: r.job.title, scheduledDate: r.job.scheduledDate, jobCategory: r.job.jobCategory })),
      },
    };
  });

  const sorted = unitsWithStats.sort((a, b) => {
    if (b.jobStats.overdue !== a.jobStats.overdue) return b.jobStats.overdue - a.jobStats.overdue;
    if (b.jobStats.active !== a.jobStats.active) return b.jobStats.active - a.jobStats.active;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({ building, units: sorted });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, address, suburb, state, postcode, notes } = body;

  const [updated] = await db
    .update(buildings)
    .set({ name, address, suburb, state, postcode, notes })
    .where(eq(buildings.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.update(properties).set({ buildingId: null }).where(eq(properties.buildingId, id));
  await db.delete(buildings).where(eq(buildings.id, id));

  return NextResponse.json({ ok: true });
}
