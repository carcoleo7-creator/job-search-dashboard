import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { TailoredCV } from "./tailor";

const s = StyleSheet.create({
  page: { fontFamily: "Times-Roman", fontSize: 10.5, color: "#000", paddingTop: 36, paddingBottom: 36, paddingLeft: 43, paddingRight: 43 },
  // Header
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 2 },
  name: { fontSize: 22, fontFamily: "Times-Bold" },
  contact: { fontSize: 9.5, textAlign: "right", lineHeight: 1.5 },
  location: { fontSize: 9.5, marginBottom: 4 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#000", marginBottom: 5 },
  titleBlock: { alignItems: "center", marginBottom: 3 },
  titleBold: { fontSize: 10.5, fontFamily: "Times-Bold" },
  titleItalic: { fontSize: 10, fontFamily: "Times-Italic" },
  // Section
  section: { marginTop: 6 },
  sectionHeading: { fontSize: 10.5, fontFamily: "Times-Bold", textTransform: "uppercase", borderBottomWidth: 1.5, borderBottomColor: "#000", paddingBottom: 1.5, marginBottom: 5, letterSpacing: 0.5 },
  // Summary
  summaryText: { fontSize: 10, lineHeight: 1.45 },
  // Competencies
  competencyRow: { fontSize: 10, lineHeight: 1.4, marginBottom: 1 },
  competencyLabel: { fontFamily: "Times-Bold" },
  // Experience
  expEntry: { marginBottom: 5 },
  expCompanyLine: { flexDirection: "row", justifyContent: "space-between" },
  expCompany: { fontSize: 10.5, fontFamily: "Times-Bold" },
  expLocation: { fontSize: 10, fontFamily: "Times-Italic" },
  expTitleLine: { flexDirection: "row", justifyContent: "space-between" },
  expTitle: { fontSize: 10.5, fontFamily: "Times-Bold" },
  expDates: { fontSize: 10, fontFamily: "Times-Bold" },
  expIntro: { fontSize: 10, fontFamily: "Times-Italic", marginTop: 2, marginBottom: 3, lineHeight: 1.4 },
  bulletRow: { flexDirection: "row", marginBottom: 1.5 },
  bulletDot: { width: 12, fontSize: 10, marginTop: 0 },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.4 },
  // Skills
  skillsRow: { fontSize: 10, lineHeight: 1.45, marginBottom: 1 },
  // Education
  eduTop: { flexDirection: "row", justifyContent: "space-between" },
  eduDegree: { fontSize: 10.5, fontFamily: "Times-Bold" },
  eduDate: { fontSize: 10 },
  eduSchool: { fontSize: 10 },
});

function formatDate(val: string): string {
  if (!val || val === "Present") return val;
  try {
    const [year, month] = val.split("-");
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[parseInt(month) - 1]} ${year}`;
  } catch { return val; }
}

function BulletLine({ text }: { text: string }) {
  const colonIdx = text.indexOf(": ");
  if (colonIdx > 0 && colonIdx < 40) {
    const label = text.slice(0, colonIdx + 1);
    const rest = text.slice(colonIdx + 2);
    return (
      <View style={s.bulletRow} wrap={false}>
        <Text style={s.bulletDot}>•</Text>
        <Text style={s.bulletText}>
          <Text style={{ fontFamily: "Times-Bold" }}>{label}</Text>
          {" "}{rest}
        </Text>
      </View>
    );
  }
  return (
    <View style={s.bulletRow} wrap={false}>
      <Text style={s.bulletDot}>•</Text>
      <Text style={s.bulletText}>{text}</Text>
    </View>
  );
}

export function CvDocument({ cv }: { cv: TailoredCV }) {
  let prevCompany = "";

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.headerTop}>
          <Text style={s.name}>{cv.candidateName}</Text>
          <Text style={s.contact}>
            {cv.candidatePhone}{"   "}{cv.candidateEmail}
          </Text>
        </View>
        <Text style={s.location}>{cv.candidateLinkedin}{"   "}{cv.candidateLocation}</Text>
        <View style={s.divider} />
        <View style={s.titleBlock}>
          <Text style={s.titleBold}>{cv.jobTitle}</Text>
          <Text style={s.titleItalic}>Director • Vice President</Text>
        </View>

        {/* Summary */}
        <View style={s.section}>
          <Text style={s.sectionHeading}>Professional Summary</Text>
          <Text style={s.summaryText}>{cv.summary}</Text>
        </View>

        {/* Core Competencies */}
        <View style={s.section}>
          <Text style={s.sectionHeading}>Core Competencies</Text>
          {[
            ["Strategy & Planning", "Strategic Roadmap Development, Business Planning, OKR/SMART Goal Setting, Governance Frameworks"],
            ["Continuous Improvement", "Root Cause Analysis, Process Optimization, Change Management, Systemic Problem Solving"],
            ["Data & Analytics", "SQL, Tableau, Sisense, KPI Development, Performance Metrics, Cost-Benefit Analysis"],
            ["Cross-Functional Leadership", "EPD & GTM Stakeholder Management, Executive Communication (Front line to C-Suite)"],
            ["Program Management", "Lifecycle Management, Resource Allocation, Interdependency Resolution, Launch Readiness"],
            ["AI & Automation", "Prompt Engineering, AI-Assisted Workflow Design, Process Automation, Agentic Tooling"],
          ].map(([label, items]) => (
            <Text key={label} style={s.competencyRow}>
              <Text style={s.competencyLabel}>{label}: </Text>
              {items}
            </Text>
          ))}
        </View>

        {/* Experience */}
        <View style={s.section}>
          <Text style={s.sectionHeading}>Professional Experience</Text>
          {cv.experience.map((exp, i) => {
            const showCompany = exp.company !== prevCompany;
            prevCompany = exp.company;
            const firstBullet = exp.bullets[0] ?? "";
            const isIntro = firstBullet.indexOf(":") === -1 || firstBullet.indexOf(":") > 40;
            const introBullet = isIntro ? firstBullet : null;
            const restBullets = isIntro ? exp.bullets.slice(1) : exp.bullets;

            return (
              <View key={i} style={s.expEntry}>
                {/* Keep header + first bullet together to prevent orphaned headings */}
                <View wrap={false}>
                  {showCompany && (
                    <View style={s.expCompanyLine}>
                      <Text style={s.expCompany}>{exp.company}</Text>
                      <Text style={s.expLocation}>{exp.location}</Text>
                    </View>
                  )}
                  <View style={s.expTitleLine}>
                    <Text style={s.expTitle}>{exp.title}</Text>
                    <Text style={s.expDates}>{formatDate(exp.start)} – {formatDate(exp.end)}</Text>
                  </View>
                  {introBullet && introBullet.trim() && <Text style={s.expIntro}>{introBullet.replace(/^_|_$/g, "").replace(/^\*|\*$/g, "")}</Text>}
                  {restBullets[0] && <BulletLine text={restBullets[0]} />}
                </View>
                {restBullets.slice(1).map((b, j) => <BulletLine key={j + 1} text={b} />)}
              </View>
            );
          })}
        </View>

        {/* Technical Skills */}
        <View style={s.section}>
          <Text style={s.sectionHeading}>Technical Skills</Text>
          <Text style={s.skillsRow}><Text style={{ fontFamily: "Helvetica-Bold" }}>Data Analysis & BI: </Text>SQL, Sisense, Tableau, Tableau Pulse, Excel, Sigma, Grow.com</Text>
          <Text style={s.skillsRow}><Text style={{ fontFamily: "Helvetica-Bold" }}>Platforms & CRM: </Text>Salesforce, Salesforce Einstein, HubSpot, HubSpot AI, Slack, Google Suite, Zapier</Text>
          <Text style={s.skillsRow}><Text style={{ fontFamily: "Helvetica-Bold" }}>Project Management: </Text>Jira, Monday.com, Asana, Notion, Trello</Text>
          <Text style={s.skillsRow}><Text style={{ fontFamily: "Helvetica-Bold" }}>AI Tools: </Text>ChatGPT, Claude, Gemini, GitHub Copilot, V0 (Vercel)</Text>
          <Text style={s.skillsRow}><Text style={{ fontFamily: "Helvetica-Bold" }}>Workflow Automation: </Text>Zapier AI, Make.com, n8n</Text>
        </View>

        {/* Education */}
        <View style={s.section}>
          <Text style={s.sectionHeading}>Education</Text>
          {cv.education.map((edu, i) => (
            <View key={i}>
              <View style={s.eduTop}>
                <Text style={s.eduDegree}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}</Text>
                <Text style={s.eduDate}>{edu.year}</Text>
              </View>
              <Text style={s.eduSchool}>{edu.school} — {edu.location}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}
