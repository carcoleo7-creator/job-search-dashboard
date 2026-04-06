import { NextResponse } from "next/server";
import { db, jobs, generatedCvs } from "@/lib/db";

export async function POST() {
  await db.delete(generatedCvs);
  await db.delete(jobs);
  return NextResponse.json({ success: true });
}
