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
- NEVER use these words or phrases: leverage, utilize, operationalize, scalable, verticalized, contextualized, activation loops, repeatable pathways, enablement paths, or any noun-stacked jargon
- Do NOT label every bullet with a colon-prefix (e.g. "AI Adoption Strategy: ..."). Only label a bullet when the category is genuinely useful. Most bullets should be plain sentences.
- Not every bullet needs a metric. When you include numbers, vary the format: some as dollar amounts, some as timeframes, some as team sizes, some with none at all. Never put a clean percentage in every single bullet.
- Metrics should appear naturally mid-sentence, not as the punchline of every bullet
- The first bullet per role is a short italic intro (1–2 sentences) summarizing what the role was — no label, no metric required
- After drafting each bullet, ask: would a real person say this out loud in an interview? If not, rewrite it simply.
- Bullets are 1–2 lines max
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
        bullets: ["<italic intro sentence>", "<bullet>", "..."],
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

BULLET EXAMPLES — follow this pattern:

BAD (AI-sounding):
"AI Adoption Strategy: Partner with Product and Marketing to develop verticalized enablement paths, driving 30% increase in platform adoption through contextualized use case content"

GOOD (human-sounding):
"Built segment-specific onboarding content for two distinct customer types; adoption rose 30% within two quarters of rollout"

BAD: "Confident Facilitator: Built and led team of 8 direct reports, facilitating training and hands-on workshops to drive operational excellence"
GOOD: "Managed a team of 8 and ran the training programs myself — workshops, not slide decks"

BAD: "Workflow Automation: Designed and implemented workflow solutions that automated 500+ monthly processes, achieving 40% reduction in manual effort and $1.1M cost savings"
GOOD: "Automated 500+ monthly back-office transactions using Zapier and Make.com; saved $1.1M in FTE cost and freed the ops team to focus on exceptions, not data entry"

OUTPUT SCHEMA (return only valid JSON):
${JSON.stringify(outputSchema, null, 2)}`;

  const response = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Claude response");

  const parsed = JSON.parse(jsonMatch[0]);

  const result: TailoredCV = {
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

  const flagged = flagJargon(result);
  if (flagged.length > 0) {
    console.warn("[tailor.ts] Jargon detected in CV output:", flagged);
  }
  return result;
}

const JARGON_FLAGS = [
  "operationalize", "verticalized", "contextualized", "activation loop",
  "repeatable pathway", "enablement path", "leverage", "utilize",
  "scalable pathways", "noun-stacked"
];

function flagJargon(cv: TailoredCV): string[] {
  const text = JSON.stringify(cv).toLowerCase();
  return JARGON_FLAGS.filter(word => text.includes(word));
}
