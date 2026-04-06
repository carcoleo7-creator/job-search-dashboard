import Anthropic from "@anthropic-ai/sdk";
import { ProfileData } from "@/lib/db/schema";

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
  education: ProfileData["education"];
  keywordCoverage: number;
}

export async function tailorCV(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  profile: ProfileData
): Promise<TailoredCV> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const systemPrompt = `You are an expert resume writer helping tailor a candidate's CV to a specific job posting.

Your job:
1. Match the role's priorities by drawing on the candidate's real experience — only reframe what actually happened, never fabricate
2. Write a summary that is 3–4 sentences, direct and specific to this role
3. Include relevant keywords from the job description naturally, in context
4. Return ONLY valid JSON matching the schema provided. No extra commentary.

Writing rules for bullets and summary:
- Before writing a bullet, ask: what was the actual thing built, changed, or decided? Name the concrete action.
- Write as a confident professional talking to a peer — plain language, no pitch-speak
- Do NOT use: leverage, utilize, operationalize, scalable, verticalized, contextualized, or noun-stacked jargon
- Not every bullet needs a metric. When you do include numbers, vary the format: some as dollar amounts, some as timeframes, some as team sizes, some with none at all
- After drafting a bullet, ask: would this sound strange said aloud in an interview? If yes, rewrite it simply
- Bullets are 1–2 lines. The first bullet per role is a short italic intro (1–2 sentences) summarizing what the role was — no label prefix, no metric required
- Remaining bullets: when there is a clear category, start with "Label: sentence." Otherwise write a plain sentence — do not force a label onto every bullet
- Dates in YYYY-MM format. Use "Present" for current roles.`;

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
${JSON.stringify({ base_summary: profile.summary, work_experience: profile.workExperience }, null, 2)}

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
    candidateName: profile.personal.name,
    candidateEmail: profile.personal.email,
    candidatePhone: profile.personal.phone,
    candidateLinkedin: profile.personal.linkedin,
    candidateLocation: profile.personal.location,
    jobTitle,
    companyName,
    summary: parsed.summary ?? "",
    experience: (parsed.experience ?? profile.workExperience).map((exp: any) => ({
      company: exp.company,
      title: exp.title,
      location: exp.location,
      start: exp.start,
      end: exp.end,
      bullets: exp.bullets ?? [],
    })),
    skillsHard: parsed.skills_hard ?? profile.skills.hard,
    tools: parsed.tools ?? profile.skills.tools,
    education: profile.education,
    keywordCoverage: Math.round((parsed.keyword_coverage ?? 0.9) * 100),
  };
}
