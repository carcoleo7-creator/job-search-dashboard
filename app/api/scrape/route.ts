import { NextRequest, NextResponse } from "next/server";
import { db, companies, jobs, searchSettings } from "@/lib/db";
import { COMPANIES } from "@/lib/companies";
import { scrapeCompany, isRelevant } from "@/lib/scrapers";
import { eq, and } from "drizzle-orm";

function extractSalary(text: string): { salaryText: string | null; salaryMin: number | null; salaryMax: number | null } {
  if (!text) return { salaryText: null, salaryMin: null, salaryMax: null };
  // Match patterns like $150,000, $150k, $150K, ranges like $150,000 - $200,000
  const pattern = /\$\s*(\d{1,3}(?:,\d{3})*|\d+)\s*[kK]?\s*(?:[-–—to]+\s*\$?\s*(\d{1,3}(?:,\d{3})*|\d+)\s*[kK]?)?(?:\s*\/?\s*(?:year|yr|annually))?/gi;
  const matches = [...text.matchAll(pattern)];
  if (!matches.length) return { salaryText: null, salaryMin: null, salaryMax: null };

  const toNum = (s: string, hasK: boolean) => {
    const n = parseInt(s.replace(/,/g, ""));
    return hasK || n < 1000 ? n * 1000 : n;
  };

  const nums: number[] = [];
  for (const m of matches) {
    const hasK = m[0].toLowerCase().includes("k");
    if (m[1]) nums.push(toNum(m[1], hasK));
    if (m[2]) nums.push(toNum(m[2], hasK));
  }

  // Filter to plausible salary range ($50k–$1M)
  const salaries = nums.filter((n) => n >= 50000 && n <= 1000000);
  if (!salaries.length) return { salaryText: null, salaryMin: null, salaryMax: null };

  const salaryMin = Math.min(...salaries);
  const salaryMax = Math.max(...salaries);
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  const salaryText = salaryMin === salaryMax ? fmt(salaryMin) : `${fmt(salaryMin)}–${fmt(salaryMax)}`;

  return { salaryText, salaryMin, salaryMax };
}

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const companyId: string | undefined = body.company_id;

  const targets = companyId
    ? COMPANIES.filter((c) => c.id === companyId)
    : COMPANIES;

  // Load search settings
  const [settings] = await db.select().from(searchSettings).where(eq(searchSettings.id, 1)).limit(1);
  const globalKeywords: string[] = settings?.keywords?.length
    ? settings.keywords
    : ["operations", "strategy", "chief of staff", "business operations", "revenue operations", "program manager"];
  const locationFilter: string = settings?.location_filter ?? "remote";

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
        const relevant_flag = isRelevant(job.title, globalKeywords);
        if (!relevant_flag) continue;

        if (locationFilter === "remote" && !job.location.toLowerCase().includes("remote")) continue;
        if (locationFilter === "hybrid" && !job.location.toLowerCase().match(/remote|hybrid/)) continue;
        relevant++;

        // Check if exists
        const existing = await db
          .select()
          .from(jobs)
          .where(and(eq(jobs.company_id, company.id), eq(jobs.external_id, job.external_id)))
          .limit(1);

        if (existing.length === 0) {
          const { salaryText, salaryMin, salaryMax } = extractSalary(job.description_raw ?? "");

          // Skip if salary is explicitly listed and max is under $150k
          if (salaryMax !== null && salaryMax < 150000) continue;

          await db.insert(jobs).values({
            company_id: company.id,
            external_id: job.external_id,
            title: job.title,
            url: job.url,
            location: job.location,
            department: job.department,
            description_raw: job.description_raw,
            salary_text: salaryText,
            salary_min: salaryMin,
            salary_max: salaryMax,
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
