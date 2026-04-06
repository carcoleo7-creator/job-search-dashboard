import { NextRequest, NextResponse } from "next/server";
import { db, profiles } from "@/lib/db";
import { eq, ne } from "drizzle-orm";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id);
  // Deactivate all others
  await db.update(profiles).set({ is_active: false }).where(ne(profiles.id, numId));
  // Activate this one
  await db.update(profiles).set({ is_active: true }).where(eq(profiles.id, numId));
  return NextResponse.json({ success: true });
}
