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

  const systemPrompt = `You are tailoring Cristina Arcoleo's resume to a specific job posting. You must follow these rules exactly.

## Confirmed facts — use these exactly, never alter them

Titles and dates (all ezCater roles under one employer "ezCater, Remote", newest first):
- Senior Manager, Strategic Operations & Product Management | 2026 – Present
- Director, Platform Operations | 2024 – 2026
- Director, Delivery Partnerships & Operations | 2022 – 2024
- Director, Business Operations & Technology | 2021 – 2022
- SwagUp, Piscataway, NJ: Director of Operations | 2018 – 2021
- Consulting Engagements | 2020 – 2021
- Aramark, New York and New Jersey: Multi-Unit General Manager | 2014 – 2018

SwagUp is always described as: first executive hire at a B2B marketplace that scaled from $850K to $85M in revenue. Never write "100x" or "$100M".

## Tailoring rules

1. Lead the headline with the language of the target role: "<Role family> | <three or four focus areas from the posting>"
2. For product manager roles, lead with product ownership. For ops/strategy/chief of staff/program roles, lead with operating rhythm and cross-functional delivery.
3. The Director, Platform Operations role always shows product ownership: she owned requirements, backlog prioritization with engineering, launches and post-launch measurement.
4. The current role (Senior Manager) owns "the roadmap and backlog across several engineering pods" — write exactly that phrase.
5. Order bullets within each role by relevance to the posting, most relevant first.
6. Use only bullets from the candidate profile provided. Reorder and select; do not rewrite facts or invent metrics.
7. Never alter a number, date, employer name, or title. Copy each figure exactly.
8. Summary: 3–4 sentences. Open with the role family and "12+ years". Include AI line where the posting values AI.
9. Keep the resume to two pages worth of content.

## Writing rules

- Plain language. No pitch-speak. Write as a confident professional talking to a peer.
- NEVER use: leverage, utilize, operationalize, scalable, verticalized, contextualized, activation loops, repeatable pathways, enablement paths, or noun-stacked jargon.
- The first item in each role's bullets array is the italic intro sentence — keep it concise, no metric required.
- Bullets are 1–2 lines max.
- Dates use years only: "2024 – 2026". Use "Present" for the current role.
- Return ONLY valid JSON matching the schema. No commentary.`;

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
    model: "claude-sonnet-4-6",
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
