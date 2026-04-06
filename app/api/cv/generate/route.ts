import { NextRequest, NextResponse } from "next/server";
import { db, jobs, generatedCvs, companies } from "@/lib/db";
import { tailorCV } from "@/lib/cv/tailor";
import { eq } from "drizzle-orm";
import { COMPANIES } from "@/lib/companies";
import { SkillMode } from "@/lib/profile";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { job_id, skill_mode } = await req.json();

  if (!job_id) return NextResponse.json({ error: "job_id required" }, { status: 400 });

  const [job] = await db.select().from(jobs).where(eq(jobs.id, job_id)).limit(1);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const company = COMPANIES.find((c) => c.id === job.company_id);
  const companyName = company?.name ?? job.company_id;

  const mode: SkillMode = skill_mode ?? company?.preferred_skill_modes?.[0] ?? "strategy_ops";

  const cv = await tailorCV(job.title, companyName, job.description_raw ?? "", mode);

  const [saved] = await db
    .insert(generatedCvs)
    .values({
      job_id: job.id,
      skill_mode: mode,
      keyword_coverage: cv.keywordCoverage,
      summary: cv.summary,
      content_json: cv as any,
    })
    .returning();

  // Update job status
  await db.update(jobs).set({ status: "cv_generated" }).where(eq(jobs.id, job_id));

  return NextResponse.json({ success: true, cv_id: saved.id, keyword_coverage: cv.keywordCoverage, summary_preview: cv.summary.slice(0, 200) });
}
