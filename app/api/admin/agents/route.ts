import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers, agentPropertyLinks } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agents = await db
    .select({ user: adminUsers, propCount: count(agentPropertyLinks.propertyId) })
    .from(adminUsers)
    .leftJoin(agentPropertyLinks, eq(adminUsers.id, agentPropertyLinks.agentId))
    .where(eq(adminUsers.role, "agent"))
    .groupBy(adminUsers.id)
    .orderBy(adminUsers.name);

  return NextResponse.json(
    agents.map((a) => ({
      id: a.user.id,
      name: a.user.name,
      email: a.user.email,
      phone: a.user.phone,
      agencyName: a.user.agencyName,
      propertyCount: a.propCount,
      createdAt: a.user.createdAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, email, password, phone, agencyName, propertyIds } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "name, email, and password are required" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [agent] = await db
      .insert(adminUsers)
      .values({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "agent",
        phone: phone ?? null,
        agencyName: agencyName ?? null,
      })
      .returning();

    if (Array.isArray(propertyIds) && propertyIds.length > 0) {
      await db.insert(agentPropertyLinks).values(
        propertyIds.map((id: string) => ({ agentId: agent.id, propertyId: id }))
      );
    }

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      agencyName: agent.agencyName,
    }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate") || msg.includes("already exists")) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    console.error("POST /api/admin/agents", err);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
