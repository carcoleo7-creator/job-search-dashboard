import Anthropic from "@anthropic-ai/sdk";
import { PROFILE, SkillMode, getBulletsForMode } from "../profile";

export interface TailoredCV {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  candidateLinkedin: string;
  candidateLocation: string;
  jobTitle: string;
  companyName: string;
  summary: string;
  experience: {
    company: string;
    title: string;
    location: string;
    start: string;
    end: string;
    bullets: string[];
  }[];
  skillsHard: string[];
  tools: string[];
  education: typeof PROFILE.education;
  keywordCoverage: number;
}

export async function tailorCV(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  skillMode: SkillMode
): Promise<TailoredCV> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const experienceData = PROFILE.workExperience.map((exp) => ({
    company: exp.company,
    title: exp.title,
    location: exp.location,
    start: exp.start,
    end: exp.end,
    bullets: getBulletsForMode(exp, skillMode),
  }));

  const systemPrompt = `You are an expert resume writer and ATS optimization specialist.
Your job is to tailor a candidate's master CV to a specific job posting in a way that:
1. Maximizes ATS keyword matching from the job description
2. Reframes existing experience using the JD's language and priorities
3. Keeps the summary tight (3–4 sentences max), role-specific, and keyword-rich
4. Ensures every section is honest — only reframe existing experience, never fabricate
5. Returns ONLY valid JSON matching the schema provided. No extra commentary.

ATS optimization rules:
- Dates in YYYY-MM format (e.g. 2023-01). Use "Present" for current roles.
- Bullets are 1–2 lines; prefer bullets with $ amounts, %, team sizes, or time savings
- Every bullet must follow: "Bold Label: Full sentence with quantified impact."
- Include the top 10–15 JD keywords naturally in bullets and summary
- First bullet per role should be a 1-2 sentence italic intro summarizing the role scope (no label prefix)`;

  const outputSchema = {
    summary: "<tailored 3-4 sentence summary>",
    experience: [
      {
        company: "<str>",
        title: "<str>",
        location: "<str>",
        start: "<YYYY-MM>",
        end: "<YYYY-MM or Present>",
        bullets: ["<italic intro sentence>", "<Label: bullet>", "..."],
      },
    ],
    skills_hard: ["<skill>"],
    tools: ["<tool>"],
    keyword_coverage: 0.95,
  };

  const userPrompt = `Tailor this candidate's CV for the following role.

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription.slice(0, 4000)}

CANDIDATE PROFILE:
${JSON.stringify({ base_summary: PROFILE.summaryVariants[skillMode], work_experience: experienceData }, null, 2)}

OUTPUT SCHEMA (return only valid JSON):
${JSON.stringify(outputSchema, null, 2)}`;

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Claude response");

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    candidateName: PROFILE.personal.name,
    candidateEmail: PROFILE.personal.email,
    candidatePhone: PROFILE.personal.phone,
    candidateLinkedin: PROFILE.personal.linkedin,
    candidateLocation: PROFILE.personal.location,
    jobTitle,
    companyName,
    summary: parsed.summary ?? "",
    experience: (parsed.experience ?? experienceData).map((exp: any) => ({
      company: exp.company,
      title: exp.title,
      location: exp.location,
      start: exp.start,
      end: exp.end,
      bullets: exp.bullets ?? [],
    })),
    skillsHard: parsed.skills_hard ?? PROFILE.skills.hard,
    tools: parsed.tools ?? PROFILE.skills.tools,
    education: PROFILE.education,
    keywordCoverage: Math.round((parsed.keyword_coverage ?? 0.9) * 100),
  };
}
