import { NextRequest, NextResponse } from "next/server";
import { db, searchSettings } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const [row] = await db.select().from(searchSettings).where(eq(searchSettings.id, 1)).limit(1);
  if (!row) {
    return NextResponse.json({
      keywords: ["operations", "strategy", "chief of staff", "business operations", "revenue operations", "program manager"],
      location_filter: "remote",
    });
  }
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const keywords: string[] = body.keywords ?? [];
  const location_filter: string = body.location_filter ?? "remote";

  await db
    .insert(searchSettings)
    .values({ id: 1, keywords, location_filter, updated_at: new Date() })
    .onConflictDoUpdate({
      target: searchSettings.id,
      set: { keywords, location_filter, updated_at: new Date() },
    });

  return NextResponse.json({ success: true });
}
