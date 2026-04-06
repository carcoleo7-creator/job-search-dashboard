import { NextRequest, NextResponse } from "next/server";
import { db, companies, jobs } from "@/lib/db";
import { COMPANIES } from "@/lib/companies";
import { scrapeCompany, isRelevant } from "@/lib/scrapers";
import { eq, and } from "drizzle-orm";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const companyId: string | undefined = body.company_id;

  const targets = companyId
    ? COMPANIES.filter((c) => c.id === companyId)
    : COMPANIES;

  let totalNew = 0;
  const results: { company: string; found: number; relevant: number; new: number }[] = [];

  for (const company of targets) {
    try {
      // Upsert company record
      await db
        .insert(companies)
        .values({
          id: company.id,
          name: company.name,
          ats_type: company.ats_type,
          ats_identifier: company.ats_identifier,
          careers_url: company.careers_url,
          auto_apply: company.auto_apply,
          preferred_skill_modes: company.preferred_skill_modes,
          target_roles: company.target_roles,
          last_scraped_at: new Date(),
        })
        .onConflictDoUpdate({
          target: companies.id,
          set: { last_scraped_at: new Date() },
        });

      const scraped = await scrapeCompany(company);
      let relevant = 0;
      let newJobs = 0;

      for (const job of scraped) {
        const relevant_flag = isRelevant(job.title, company.target_roles);
        if (!relevant_flag) continue;
        relevant++;

        // Check if exists
        const existing = await db
          .select()
          .from(jobs)
          .where(and(eq(jobs.company_id, company.id), eq(jobs.external_id, job.external_id)))
          .limit(1);

        if (existing.length === 0) {
          await db.insert(jobs).values({
            company_id: company.id,
            external_id: job.external_id,
            title: job.title,
            url: job.url,
            location: job.location,
            department: job.department,
            description_raw: job.description_raw,
            is_relevant: true,
            relevance_score: 100,
            status: "new",
          });
          newJobs++;
          totalNew++;
        }
      }

      results.push({ company: company.name, found: scraped.length, relevant, new: newJobs });
    } catch (err) {
      results.push({ company: company.name, found: 0, relevant: 0, new: 0 });
    }
  }

  return NextResponse.json({ success: true, total_new: totalNew, results });
}
