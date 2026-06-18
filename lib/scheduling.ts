interface NearbyJob {
  scheduledDate: string | null;
  propertyId: string;
  buildingId?: string | null;
  suburb: string | null | undefined;
  postcode: string | null | undefined;
  technicianId?: string | null;
}

export interface RecommendedDate {
  date: string;
  score: number;
  reason: string;
  jobCount: number;
  buildingJobCount: number;
  technicianJobCount: number;
}

export function getSmartRecommendations(
  target: {
    id: string;
    buildingId?: string | null;
    suburb: string | null | undefined;
    postcode: string | null | undefined;
    preferredTechnicianId?: string | null;
  },
  existingJobs: NearbyJob[],
  daysAhead = 30
): RecommendedDate[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoffMs = today.getTime() + daysAhead * 86400000;

  const upcoming = existingJobs.filter((j) => {
    if (!j.scheduledDate) return false;
    const t = new Date(j.scheduledDate + "T00:00:00").getTime();
    return t > today.getTime() && t <= cutoffMs;
  });

  const byDate = new Map<string, NearbyJob[]>();
  for (const j of upcoming) {
    const d = j.scheduledDate!;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d)!.push(j);
  }

  const scored: RecommendedDate[] = [];

  for (const [date, jobs] of byDate) {
    let score = 0;
    const reasons = new Set<string>();
    let buildingJobCount = 0;
    let technicianJobCount = 0;

    for (const job of jobs) {
      // Same building — technician is already on-site, highest value
      if (target.buildingId && job.buildingId && job.buildingId === target.buildingId) {
        score += 200;
        buildingJobCount++;
        reasons.add("Jobs already scheduled at this building");
      } else if (job.propertyId === target.id) {
        // Same property
        score += 100;
        reasons.add("Other jobs at this property");
      } else if (target.suburb && job.suburb === target.suburb) {
        score += 50;
        reasons.add(`Jobs nearby in ${target.suburb}`);
      } else if (target.postcode && job.postcode === target.postcode) {
        score += 25;
        reasons.add(`Jobs in same postcode (${target.postcode})`);
      }

      // Preferred technician already working this day — cluster their route
      if (target.preferredTechnicianId && job.technicianId === target.preferredTechnicianId) {
        score += 30;
        technicianJobCount++;
        reasons.add("Technician already working this day");
      }
    }

    if (score > 0) {
      scored.push({
        date,
        score,
        reason: [...reasons].join(" · "),
        jobCount: jobs.length,
        buildingJobCount,
        technicianJobCount,
      });
    }
  }

  return scored.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date)).slice(0, 5);
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function getDateRange(start: string, days: number): string[] {
  const dates: string[] = [];
  let current = start;
  for (let i = 0; i < days; i++) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}
