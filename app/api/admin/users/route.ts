import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.role, "admin"))
    .orderBy(adminUsers.name);

  return NextResponse.json(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      createdAt: u.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "name, email, and password are required" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [user] = await db
      .insert(adminUsers)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "admin",
      })
      .returning();

    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    // Drizzle wraps the real PG error inside err.cause — check all layers
    const drizzleMsg = err instanceof Error ? err.message : String(err);
    const cause = err instanceof Error ? err.cause : undefined;
    const causeMsg = cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";
    const causeCode = (cause as { code?: string } | undefined)?.code ?? "";
    const causeDetail = (cause as { detail?: string } | undefined)?.detail ?? "";
    const combined = `${drizzleMsg} ${causeMsg} ${causeDetail} ${causeCode}`.toLowerCase();

    if (combined.includes("unique") || combined.includes("duplicate") || combined.includes("already exists") || causeCode === "23505") {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    const displayErr = causeDetail || causeMsg || drizzleMsg;
    console.error("POST /api/admin/users", err);
    return NextResponse.json({ error: `Failed to create user: ${displayErr}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (session.userId === id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  await db.delete(adminUsers).where(eq(adminUsers.id, id));

  return NextResponse.json({ ok: true });
}
