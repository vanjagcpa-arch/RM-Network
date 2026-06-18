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
    const msg = err instanceof Error ? err.message : "";
    if (
      msg.includes("unique") ||
      msg.includes("duplicate") ||
      msg.includes("already exists")
    ) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/users", err);
    return NextResponse.json(
      { error: `Failed to create user: ${msg}` },
      { status: 500 }
    );
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
