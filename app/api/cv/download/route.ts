import { NextRequest, NextResponse } from "next/server";
import { db, generatedCvs } from "@/lib/db";
import { renderToBuffer } from "@react-pdf/renderer";
import { CvDocument } from "@/lib/cv/pdf";
import { eq } from "drizzle-orm";
import React from "react";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const cvId = req.nextUrl.searchParams.get("cv_id");
  if (!cvId) return NextResponse.json({ error: "cv_id required" }, { status: 400 });

  const [record] = await db.select().from(generatedCvs).where(eq(generatedCvs.id, parseInt(cvId))).limit(1);
  if (!record) return NextResponse.json({ error: "CV not found" }, { status: 404 });

  const cv = record.content_json as any;
  const buffer = await renderToBuffer(React.createElement(CvDocument, { cv }) as any);

  const filename = `CA_${new Date().getFullYear()}_${cv.companyName?.replace(/\s+/g, "")}_CV.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
