import { NextResponse } from "next/server";
import { db } from "@/db";
import { buildings, properties, technicians, jobs, type NewJob } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { count } from "drizzle-orm";

const BUILDINGS_DATA = [
  { name: "Richmond Gardens", address: "145 Church Street", suburb: "Richmond", state: "VIC", postcode: "3121" },
  { name: "Southbank Residences", address: "28 Wells Street", suburb: "South Melbourne", state: "VIC", postcode: "3205" },
  { name: "Carlton Commons", address: "312 Lygon Street", suburb: "Carlton", state: "VIC", postcode: "3053" },
  { name: "Fitzroy Central", address: "87 Johnston Street", suburb: "Fitzroy", state: "VIC", postcode: "3065" },
  { name: "Collingwood Square", address: "204 Smith Street", suburb: "Collingwood", state: "VIC", postcode: "3066" },
];

const TENANT_NAMES = [
  "Sarah Johnson", "Michael Chen", "Emma Williams", "James Thompson",
  "Olivia Brown", "Noah Davis", "Ava Wilson", "Liam Anderson",
  "Isabella Martinez", "Lucas Taylor",
];

const TENANT_PHONES = [
  "0412 345 678", "0423 456 789", "0434 567 890", "0445 678 901",
  "0456 789 012", "0467 890 123", "0478 901 234", "0489 012 345",
  "0411 222 333", "0422 333 444",
];

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ value: existingBuildings }] = await db.select({ value: count() }).from(buildings);
  if (existingBuildings > 0) {
    return NextResponse.json({ error: "Seed data already exists. Delete buildings first." }, { status: 400 });
  }

  // Create technicians if none exist
  const [{ value: existingTechs }] = await db.select({ value: count() }).from(technicians);
  let techJames: { id: string } | null = null;
  let techSarah: { id: string } | null = null;

  if (existingTechs === 0) {
    const [t1] = await db.insert(technicians).values({
      name: "James Wilson",
      email: "james@rmscheduler.com.au",
      phone: "0412 111 222",
      specialties: JSON.stringify(["smoke_alarm", "test_and_tag"]),
      color: "#3b82f6",
      isActive: true,
    }).returning({ id: technicians.id });
    techJames = t1;

    const [t2] = await db.insert(technicians).values({
      name: "Sarah Mitchell",
      email: "sarah@rmscheduler.com.au",
      phone: "0423 333 444",
      specialties: JSON.stringify(["electrical", "gas_appliance", "maintenance"]),
      color: "#8b5cf6",
      isActive: true,
    }).returning({ id: technicians.id });
    techSarah = t2;
  }

  // Create buildings
  const createdBuildings = await db.insert(buildings).values(BUILDINGS_DATA).returning();

  const allUnits: { id: string; buildingIdx: number; unitIdx: number }[] = [];

  // Create 10 units per building
  for (let bi = 0; bi < createdBuildings.length; bi++) {
    const building = createdBuildings[bi];
    const unitValues = Array.from({ length: 10 }, (_, ui) => ({
      buildingId: building.id,
      name: `Unit ${ui + 1}`,
      address: building.address,
      suburb: building.suburb,
      state: building.state,
      postcode: building.postcode,
      contactName: TENANT_NAMES[ui],
      contactPhone: TENANT_PHONES[ui],
    }));
    const created = await db.insert(properties).values(unitValues).returning({ id: properties.id });
    for (let ui = 0; ui < created.length; ui++) {
      allUnits.push({ id: created[ui].id, buildingIdx: bi, unitIdx: ui });
    }
  }

  // Today = 2026-06-18. Create realistic jobs across all units.
  const jobsToInsert = [];

  for (const unit of allUnits) {
    const { id: propertyId, buildingIdx: bi, unitIdx: ui } = unit;
    const techId = techJames?.id ?? null;
    const techId2 = techSarah?.id ?? null;

    // Pattern based on unit index to create a good mix
    if (ui === 0) {
      // Completed smoke alarm last month (compliant)
      jobsToInsert.push({
        propertyId, technicianId: techId,
        jobCategory: "smoke_alarm", title: `Smoke Alarm Service — Unit ${ui + 1}`,
        status: "completed", scheduledDate: "2026-05-15", scheduledTimeStart: "09:00",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
      // Upcoming test & tag
      jobsToInsert.push({
        propertyId, technicianId: techId,
        jobCategory: "test_and_tag", title: `Test & Tag — Unit ${ui + 1}`,
        status: "confirmed", scheduledDate: `2026-06-2${bi + 2}`, scheduledTimeStart: "10:00",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
    } else if (ui === 1) {
      // Completed smoke alarm 8 months ago (still compliant)
      jobsToInsert.push({
        propertyId, technicianId: techId,
        jobCategory: "smoke_alarm", title: `Smoke Alarm Service — Unit ${ui + 1}`,
        status: "completed", scheduledDate: "2025-10-20", scheduledTimeStart: "11:00",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
    } else if (ui === 2) {
      // Overdue smoke alarm (done 14 months ago)
      jobsToInsert.push({
        propertyId, technicianId: techId,
        jobCategory: "smoke_alarm", title: `Smoke Alarm Service — Unit ${ui + 1}`,
        status: "completed", scheduledDate: "2025-04-10", scheduledTimeStart: "09:30",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
      // Pending re-inspection
      jobsToInsert.push({
        propertyId,
        jobCategory: "smoke_alarm", title: `Smoke Alarm Service — Unit ${ui + 1}`,
        status: "pending",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
    } else if (ui === 3) {
      // Overdue scheduled job (missed)
      jobsToInsert.push({
        propertyId, technicianId: techId,
        jobCategory: "test_and_tag", title: `Test & Tag — Unit ${ui + 1}`,
        status: "confirmed", scheduledDate: "2026-06-05", scheduledTimeStart: "14:00",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
    } else if (ui === 4) {
      // Completed electrical + upcoming maintenance
      jobsToInsert.push({
        propertyId, technicianId: techId2,
        jobCategory: "electrical", title: `Electrical Inspection — Unit ${ui + 1}`,
        status: "completed", scheduledDate: "2024-11-05",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
      jobsToInsert.push({
        propertyId, technicianId: techId2,
        jobCategory: "maintenance", title: `General Maintenance — Unit ${ui + 1}`,
        status: "pending",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
    } else if (ui === 5) {
      // Gas appliance done last year (due soon)
      jobsToInsert.push({
        propertyId, technicianId: techId2,
        jobCategory: "gas_appliance", title: `Gas Appliance Safety — Unit ${ui + 1}`,
        status: "completed", scheduledDate: "2025-07-18",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
    } else if (ui === 6) {
      // No jobs yet (never serviced)
    } else if (ui === 7) {
      // Upcoming confirmed job
      jobsToInsert.push({
        propertyId, technicianId: techId,
        jobCategory: "smoke_alarm", title: `Smoke Alarm Service — Unit ${ui + 1}`,
        status: "confirmed", scheduledDate: `2026-07-0${bi + 1}`, scheduledTimeStart: "09:00",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
    } else if (ui === 8) {
      // Completed smoke alarm 11 months ago (due next month)
      jobsToInsert.push({
        propertyId, technicianId: techId,
        jobCategory: "smoke_alarm", title: `Smoke Alarm Service — Unit ${ui + 1}`,
        status: "completed", scheduledDate: "2025-07-22",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
    } else if (ui === 9) {
      // In-progress job today
      jobsToInsert.push({
        propertyId, technicianId: techId2,
        jobCategory: "maintenance", title: `General Maintenance — Unit ${ui + 1}`,
        status: "in_progress", scheduledDate: "2026-06-18", scheduledTimeStart: "08:00",
        tenantName: TENANT_NAMES[ui], tenantPhone: TENANT_PHONES[ui],
      });
    }
  }

  // Add a cluster of jobs on June 22 (Richmond + nearby) for route view demo
  const richmondUnits = allUnits.filter((u) => u.buildingIdx === 0).slice(0, 4);
  for (let i = 0; i < richmondUnits.length; i++) {
    const unit = richmondUnits[i];
    if (i > 0) { // unit 0 already has a June 22 job
      jobsToInsert.push({
        propertyId: unit.id, technicianId: techJames?.id ?? null,
        jobCategory: "smoke_alarm", title: `Smoke Alarm Service — Unit ${unit.unitIdx + 1}`,
        status: "confirmed", scheduledDate: "2026-06-22",
        scheduledTimeStart: `${9 + i}:00`,
        tenantName: TENANT_NAMES[unit.unitIdx], tenantPhone: TENANT_PHONES[unit.unitIdx],
      });
    }
  }

  if (jobsToInsert.length > 0) {
    await db.insert(jobs).values(jobsToInsert as NewJob[]);
  }

  return NextResponse.json({
    ok: true,
    buildings: createdBuildings.length,
    units: allUnits.length,
    jobs: jobsToInsert.length,
    technicians: existingTechs === 0 ? 2 : 0,
  });
}
