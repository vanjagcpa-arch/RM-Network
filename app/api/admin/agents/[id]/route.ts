import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { adminUsers, agentPropertyLinks, properties } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [agent] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  if (!agent || agent.role !== "agent") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const links = await db
    .select({ property: properties })
    .from(agentPropertyLinks)
    .leftJoin(properties, eq(agentPropertyLinks.propertyId, properties.id))
    .where(eq(agentPropertyLinks.agentId, id));

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    email: agent.email,
    phone: agent.phone,
    agencyName: agent.agencyName,
    assignedProperties: links.filter((l) => l.property).map((l) => l.property!),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, phone, agencyName, password, propertyIds } = body;

  const [agent] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  if (!agent || agent.role !== "agent") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (name) updates.name = name;
  if (email) updates.email = email.toLowerCase();
  if (phone !== undefined) updates.phone = phone;
  if (agencyName !== undefined) updates.agencyName = agencyName;
  if (password) updates.passwordHash = await bcrypt.hash(password, 10);

  if (Object.keys(updates).length > 0) {
    await db.update(adminUsers).set(updates).where(eq(adminUsers.id, id));
  }

  // Replace property assignments if provided
  if (Array.isArray(propertyIds)) {
    await db.delete(agentPropertyLinks).where(eq(agentPropertyLinks.agentId, id));
    if (propertyIds.length > 0) {
      await db.insert(agentPropertyLinks).values(
        propertyIds.map((pid: string) => ({ agentId: id, propertyId: pid }))
      );
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [agent] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  if (!agent || agent.role !== "agent") return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cascade handled by FK, but delete explicitly for safety
  await db.delete(agentPropertyLinks).where(eq(agentPropertyLinks.agentId, id));
  await db.delete(adminUsers).where(eq(adminUsers.id, id));

  return NextResponse.json({ ok: true });
}
