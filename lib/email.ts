function icsDate(dateStr: string, timeStr?: string | null): string {
  const d = dateStr.replace(/-/g, "");
  if (!timeStr) return d;
  return `${d}T${timeStr.replace(/:/g, "")}00`;
}

function addHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildIcs(
  job: {
    id: string; title: string; description?: string | null;
    scheduledDate: string; scheduledTimeStart?: string | null; scheduledTimeEnd?: string | null;
  },
  property: { name: string; address: string }
): string {
  const allDay = !job.scheduledTimeStart;
  const start = icsDate(job.scheduledDate, job.scheduledTimeStart);
  const end = job.scheduledTimeEnd
    ? icsDate(job.scheduledDate, job.scheduledTimeEnd)
    : job.scheduledTimeStart
    ? icsDate(job.scheduledDate, addHour(job.scheduledTimeStart))
    : start;
  const stamp = new Date().toISOString().replace(/[-:.]/g, "").slice(0, 15) + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RM Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${job.id}@rm-scheduler`,
    `DTSTAMP:${stamp}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${job.title}`,
    `DESCRIPTION:${(job.description ?? "").replace(/[\r\n]+/g, "\\n")}`,
    `LOCATION:${property.name} - ${property.address}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function buildHtml(
  job: {
    title: string; scheduledDate: string; scheduledTimeStart?: string | null;
    tenantName?: string | null; unitNumber?: string | null; rescheduleToken?: string | null;
  },
  property: { name: string; address: string; suburb?: string | null }
): string {
  const { rescheduleToken } = job;
  const [y, mo, d] = job.scheduledDate.split("-").map(Number);
  const dateLabel = new Date(y, mo - 1, d).toLocaleDateString("en-AU", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeLabel = job.scheduledTimeStart
    ? new Date(`2000-01-01T${job.scheduledTimeStart}`).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
    : "Time to be confirmed";
  const greeting = job.tenantName ? `Hi ${job.tenantName},` : "Hello,";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="background:linear-gradient(135deg,#1e293b,#334155);border-radius:12px;padding:24px;color:#fff;margin-bottom:24px">
    <p style="margin:0 0 4px;font-size:12px;opacity:.7;text-transform:uppercase;letter-spacing:.05em">Appointment Confirmed</p>
    <h1 style="margin:0;font-size:20px">${job.title}</h1>
  </div>
  <p style="font-size:15px">${greeting}</p>
  <p style="font-size:15px">Your appointment has been confirmed. Details below — a calendar invite is attached.</p>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0">
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:5px 0;color:#64748b;width:110px">Property</td><td style="padding:5px 0;font-weight:600">${property.name}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b">Address</td><td style="padding:5px 0">${property.address}${property.suburb ? `, ${property.suburb}` : ""}</td></tr>
      ${job.unitNumber ? `<tr><td style="padding:5px 0;color:#64748b">Unit</td><td style="padding:5px 0">${job.unitNumber}</td></tr>` : ""}
      <tr><td style="padding:5px 0;color:#64748b">Date</td><td style="padding:5px 0;font-weight:600">${dateLabel}</td></tr>
      <tr><td style="padding:5px 0;color:#64748b">Time</td><td style="padding:5px 0">${timeLabel}</td></tr>
    </table>
  </div>
  ${rescheduleToken && process.env.NEXT_PUBLIC_APP_URL
    ? `<div style="text-align:center;margin:20px 0"><a href="${process.env.NEXT_PUBLIC_APP_URL}/reschedule/${rescheduleToken}" style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:10px 20px;font-size:14px;color:#475569;text-decoration:none;font-weight:500">Reschedule appointment →</a></div>`
    : `<p style="font-size:14px;color:#64748b">If you need to reschedule, please contact us directly.</p>`
  }
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
  <p style="font-size:12px;color:#94a3b8;margin:0">This is an automated message from RM Scheduler.</p>
</body></html>`;
}

export async function sendJobConfirmationEmail(
  job: {
    id: string; title: string; description?: string | null;
    tenantEmail: string; tenantName?: string | null; unitNumber?: string | null;
    scheduledDate: string; scheduledTimeStart?: string | null; scheduledTimeEnd?: string | null;
    rescheduleToken?: string | null;
  },
  property: { name: string; address: string; suburb?: string | null }
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const ics = buildIcs(job, property);
  const html = buildHtml(job, property);
  const from = process.env.FROM_EMAIL ?? "RM Scheduler <noreply@rmscheduler.app>";

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: job.tenantEmail,
      subject: `Appointment Confirmed — ${job.title}`,
      html,
      attachments: [{ filename: "appointment.ics", content: Buffer.from(ics).toString("base64") }],
    }),
  });
}
