interface NearbyJob {
  scheduledDate: string | null;
  propertyId: string;
  suburb: string | null | undefined;
  postcode: string | null | undefined;
}

export interface RecommendedDate {
  date: string;
  score: number;
  reason: string;
  jobCount: number;
}

export function getSmartRecommendations(
  target: { id: string; suburb: string | null | undefined; postcode: string | null | undefined },
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

    for (const job of jobs) {
      if (job.propertyId === target.id) {
        score += 100;
        reasons.add("Other jobs at this property");
      } else if (target.suburb && job.suburb === target.suburb) {
        score += 50;
        reasons.add(`Jobs nearby in ${target.suburb}`);
      } else if (target.postcode && job.postcode === target.postcode) {
        score += 25;
        reasons.add(`Jobs in same postcode (${target.postcode})`);
      }
    }

    if (score > 0) {
      scored.push({
        date,
        score,
        reason: [...reasons].join(" · "),
        jobCount: jobs.length,
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
