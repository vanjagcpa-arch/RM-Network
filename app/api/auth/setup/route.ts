import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";

// One-time setup route to create the first admin user.
// Disable this route in production after first use by setting SETUP_DISABLED=true.
export async function POST(req: NextRequest) {
  if (process.env.SETUP_DISABLED === "true") {
    return NextResponse.json({ error: "Setup disabled" }, { status: 403 });
  }

  const { name, email, password, setupKey } = await req.json();

  if (setupKey !== process.env.SETUP_KEY) {
    return NextResponse.json({ error: "Invalid setup key" }, { status: 403 });
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [user] = await db
      .insert(adminUsers)
      .values({ name, email: email.toLowerCase(), passwordHash })
      .returning();
    return NextResponse.json({ ok: true, id: user.id });
  } catch {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }
}
