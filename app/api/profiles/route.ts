import { NextRequest, NextResponse } from "next/server";
import { db, profiles } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(profiles).orderBy(profiles.created_at);
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // If this is the first profile, make it active
  const existing = await db.select().from(profiles).limit(1);
  const shouldBeActive = existing.length === 0;

  const [created] = await db
    .insert(profiles)
    .values({
      name: body.name,
      is_active: shouldBeActive,
      data: body.data,
      updated_at: new Date(),
    })
    .returning();

  return NextResponse.json(created);
}
