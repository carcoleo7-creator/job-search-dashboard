import { NextRequest, NextResponse } from "next/server";
import { db, jobs, companies } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; JobBot/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 12000);
  } catch {
    return null;
  }
}

async function extractJobDetails(text: string, url: string) {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract the job details from this text and return ONLY valid JSON with no markdown.

URL: ${url}

Text:
${text}

Return JSON exactly like:
{
  "title": "job title",
  "company": "company name",
  "location": "location or Remote",
  "department": "department or team name or null",
  "description": "full job description text, 300-800 words"
}`,
      },
    ],
  });

  const raw = (msg.content[0] as any).text.trim();
  const jsonStr = raw.startsWith("{") ? raw : raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  return JSON.parse(jsonStr);
}

export async function POST(req: NextRequest) {
  try {
    const { url, descriptionText } = await req.json();
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

    let pageText = descriptionText ?? null;
    if (!pageText) {
      pageText = await fetchPageText(url);
    }

    if (!pageText) {
      return NextResponse.json({ error: "Could not fetch job page. Please paste the job description below.", needsText: true }, { status: 422 });
    }

    let details: { title: string; company: string; location: string; department: string | null; description: string };
    try {
      details = await extractJobDetails(pageText, url);
    } catch {
      return NextResponse.json({ error: "Could not parse job details. Please paste the job description below.", needsText: true }, { status: 422 });
    }

    const companyId = slugify(details.company) || "imported";

    await db.insert(companies).values({
      id: companyId,
      name: details.company,
      ats_type: "generic",
      ats_identifier: companyId,
      careers_url: url,
      auto_apply: false,
      active: true,
      preferred_skill_modes: [],
      target_roles: [],
    }).onConflictDoNothing();

    const [existing] = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.url, url)).limit(1);
    if (existing) {
      return NextResponse.json({ jobId: existing.id, duplicate: true, title: details.title, company: details.company });
    }

    const [job] = await db.insert(jobs).values({
      company_id: companyId,
      external_id: `imported-${Date.now()}`,
      title: details.title,
      url,
      location: details.location ?? "Remote",
      department: details.department ?? null,
      description_raw: details.description,
      is_relevant: true,
      relevance_score: 90,
      status: "new",
    }).returning({ id: jobs.id });

    return NextResponse.json({ jobId: job.id, title: details.title, company: details.company });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Import failed" }, { status: 500 });
  }
}
