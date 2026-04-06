import { CompanyConfig } from "../companies";

export interface ScrapedJob {
  external_id: string;
  title: string;
  url: string;
  location: string;
  department: string;
  description_raw: string;
}

export async function scrapeCompany(company: CompanyConfig): Promise<ScrapedJob[]> {
  switch (company.ats_type) {
    case "greenhouse": return scrapeGreenhouse(company.ats_identifier);
    case "lever":      return scrapeLever(company.ats_identifier);
    case "ashby":      return scrapeAshby(company.ats_identifier);
    default:           return [];
  }
}

export function isRelevant(title: string, targetRoles: string[]): boolean {
  const t = title.toLowerCase();
  return targetRoles.some((role) => t.includes(role.toLowerCase()));
}

// ── GREENHOUSE ────────────────────────────────────────────────────────────────
async function scrapeGreenhouse(slug: string): Promise<ScrapedJob[]> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs?content=true`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs ?? []).map((j: any) => ({
      external_id: String(j.id),
      title: j.title ?? "",
      url: j.absolute_url ?? "",
      location: j.location?.name ?? "",
      department: j.departments?.[0]?.name ?? "",
      description_raw: stripHtml(j.content ?? ""),
    }));
  } catch { return []; }
}

// ── LEVER ─────────────────────────────────────────────────────────────────────
async function scrapeLever(slug: string): Promise<ScrapedJob[]> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).map((j: any) => ({
      external_id: j.id ?? "",
      title: j.text ?? "",
      url: j.hostedUrl ?? "",
      location: j.categories?.location ?? "",
      department: j.categories?.department ?? "",
      description_raw: stripHtml(
        [j.descriptionPlain, ...(j.lists ?? []).map((l: any) => l.content)].join("\n")
      ),
    }));
  } catch { return []; }
}

// ── ASHBY ─────────────────────────────────────────────────────────────────────
async function scrapeAshby(slug: string): Promise<ScrapedJob[]> {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${slug}`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs = data.jobs ?? data.jobPostings ?? [];
    return jobs.map((j: any) => ({
      external_id: j.id ?? "",
      title: j.title ?? "",
      url: j.jobUrl ?? `https://jobs.ashbyhq.com/${slug}/${j.id}`,
      location: j.location ?? j.locationName ?? "",
      department: j.department ?? j.departmentName ?? "",
      description_raw: stripHtml(j.descriptionHtml ?? j.description ?? ""),
    }));
  } catch { return []; }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
