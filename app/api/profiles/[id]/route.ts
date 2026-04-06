import { NextRequest, NextResponse } from "next/server";
import { db, profiles } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [row] = await db.select().from(profiles).where(eq(profiles.id, parseInt(id))).limit(1);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [updated] = await db
    .update(profiles)
    .set({ name: body.name, data: body.data, updated_at: new Date() })
    .where(eq(profiles.id, parseInt(id)))
    .returning();
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(profiles).where(eq(profiles.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
