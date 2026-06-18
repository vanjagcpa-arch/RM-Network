import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { jobs, properties } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { exportToExcel, exportToCsv } from "@/lib/ascora-export";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "xlsx";
  const propertyId = url.searchParams.get("propertyId");
  const status = url.searchParams.get("status");

  const rows = await db
    .select({ job: jobs, property: properties })
    .from(jobs)
    .leftJoin(properties, eq(jobs.propertyId, properties.id));

  let filtered = rows;
  if (propertyId) filtered = filtered.filter((r) => r.job.propertyId === propertyId);
  if (status) filtered = filtered.filter((r) => r.job.status === status);

  const exportJobs = filtered.map((r) => ({
    ...r.job,
    property: {
      name: r.property?.name ?? "",
      address: r.property?.address ?? "",
      suburb: r.property?.suburb ?? null,
      postcode: r.property?.postcode ?? null,
      state: r.property?.state ?? null,
      contactName: r.property?.contactName ?? null,
      contactPhone: r.property?.contactPhone ?? null,
    },
  }));

  if (format === "csv") {
    const csv = exportToCsv(exportJobs);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="rm-scheduler-jobs.csv"`,
      },
    });
  }

  const buffer = exportToExcel(exportJobs);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rm-scheduler-jobs.xlsx"`,
    },
  });
}
