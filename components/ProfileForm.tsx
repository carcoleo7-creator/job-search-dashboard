"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileData } from "@/lib/db/schema";

const EMPTY_JOB = (): ProfileData["workExperience"][0] => ({
  company: "", title: "", location: "", start: "", end: "", bullets: [""],
});

const EMPTY_EDU = (): ProfileData["education"][0] => ({
  degree: "", field: "", school: "", location: "", year: "",
});

const EMPTY_PROFILE: ProfileData = {
  personal: { name: "", email: "", phone: "", linkedin: "", location: "" },
  headline: "",
  summary: "",
  workExperience: [EMPTY_JOB()],
  skills: { hard: [], tools: [] },
  education: [EMPTY_EDU()],
};

interface Props {
  profileName?: string;
  initialData?: ProfileData;
  profileId?: number;
}

export default function ProfileForm({ profileName: initName = "", initialData, profileId }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initName);
  const [data, setData] = useState<ProfileData>(initialData ?? EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);

  // ── helpers ──────────────────────────────────────────────────────────
  function setPersonal(field: keyof ProfileData["personal"], val: string) {
    setData((d) => ({ ...d, personal: { ...d.personal, [field]: val } }));
  }

  function setJob(i: number, field: keyof ProfileData["workExperience"][0], val: string) {
    setData((d) => {
      const exp = [...d.workExperience];
      exp[i] = { ...exp[i], [field]: val };
      return { ...d, workExperience: exp };
    });
  }

  function setBullet(jobIdx: number, bIdx: number, val: string) {
    setData((d) => {
      const exp = [...d.workExperience];
      const bullets = [...exp[jobIdx].bullets];
      bullets[bIdx] = val;
      exp[jobIdx] = { ...exp[jobIdx], bullets };
      return { ...d, workExperience: exp };
    });
  }

  function addBullet(jobIdx: number) {
    setData((d) => {
      const exp = [...d.workExperience];
      exp[jobIdx] = { ...exp[jobIdx], bullets: [...exp[jobIdx].bullets, ""] };
      return { ...d, workExperience: exp };
    });
  }

  function removeBullet(jobIdx: number, bIdx: number) {
    setData((d) => {
      const exp = [...d.workExperience];
      exp[jobIdx] = { ...exp[jobIdx], bullets: exp[jobIdx].bullets.filter((_, i) => i !== bIdx) };
      return { ...d, workExperience: exp };
    });
  }

  function addJob() {
    setData((d) => ({ ...d, workExperience: [...d.workExperience, EMPTY_JOB()] }));
  }

  function removeJob(i: number) {
    setData((d) => ({ ...d, workExperience: d.workExperience.filter((_, idx) => idx !== i) }));
  }

  function setEdu(i: number, field: keyof ProfileData["education"][0], val: string) {
    setData((d) => {
      const edu = [...d.education];
      edu[i] = { ...edu[i], [field]: val };
      return { ...d, education: edu };
    });
  }

  async function handleSave() {
    if (!name.trim()) { alert("Profile name is required."); return; }
    setSaving(true);
    // Clean up empty bullets
    const cleaned: ProfileData = {
      ...data,
      workExperience: data.workExperience.map((j) => ({
        ...j,
        bullets: j.bullets.filter((b) => b.trim()),
      })),
    };
    const payload = { name, data: cleaned };
    const url = profileId ? `/api/profiles/${profileId}` : "/api/profiles";
    const method = profileId ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    router.push("/profiles");
  }

  // ── field styles ─────────────────────────────────────────────────────
  const input = "w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black";
  const label = "block text-xs font-medium text-gray-600 mb-1";
  const sectionTitle = "text-sm font-semibold text-gray-800 uppercase tracking-wide mb-3 mt-6";

  return (
    <div className="max-w-3xl">
      {/* Profile name */}
      <div className="mb-6">
        <label className={label}>Profile Name (internal label)</label>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cristina Arcoleo" />
      </div>

      {/* Personal Info */}
      <h2 className={sectionTitle}>Personal Info</h2>
      <div className="grid grid-cols-2 gap-3 mb-2">
        {(["name","email","phone","linkedin","location"] as const).map((f) => (
          <div key={f}>
            <label className={label}>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
            <input className={input} value={data.personal[f]} onChange={(e) => setPersonal(f, e.target.value)} />
          </div>
        ))}
      </div>

      {/* Headline */}
      <h2 className={sectionTitle}>Headline</h2>
      <input className={input} value={data.headline} onChange={(e) => setData((d) => ({ ...d, headline: e.target.value }))} placeholder="e.g. Strategy & Operations Leader | Director • VP" />

      {/* Summary */}
      <h2 className={sectionTitle}>Base Summary</h2>
      <p className="text-xs text-gray-500 mb-2">Claude will tailor this per job. Write a strong 3–4 sentence base.</p>
      <textarea className={input} rows={5} value={data.summary} onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))} />

      {/* Work Experience */}
      <h2 className={sectionTitle}>Work Experience</h2>
      {data.workExperience.map((job, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4 mb-4 bg-white">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">Job {i + 1}</span>
            {data.workExperience.length > 1 && (
              <button onClick={() => removeJob(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div><label className={label}>Company</label><input className={input} value={job.company} onChange={(e) => setJob(i, "company", e.target.value)} /></div>
            <div><label className={label}>Title</label><input className={input} value={job.title} onChange={(e) => setJob(i, "title", e.target.value)} /></div>
            <div><label className={label}>Location</label><input className={input} value={job.location} onChange={(e) => setJob(i, "location", e.target.value)} placeholder="Remote" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={label}>Start (YYYY-MM)</label><input className={input} value={job.start} onChange={(e) => setJob(i, "start", e.target.value)} placeholder="2023-01" /></div>
              <div><label className={label}>End</label><input className={input} value={job.end} onChange={(e) => setJob(i, "end", e.target.value)} placeholder="Present" /></div>
            </div>
          </div>
          <label className={label}>Bullets</label>
          {job.bullets.map((b, bIdx) => (
            <div key={bIdx} className="flex gap-2 mb-1.5">
              <input className={input} value={b} onChange={(e) => setBullet(i, bIdx, e.target.value)} placeholder="Label: Description with impact..." />
              {job.bullets.length > 1 && (
                <button onClick={() => removeBullet(i, bIdx)} className="text-gray-400 hover:text-red-500 text-lg leading-none">×</button>
              )}
            </div>
          ))}
          <button onClick={() => addBullet(i)} className="text-xs text-blue-600 hover:text-blue-800 mt-1">+ Add bullet</button>
        </div>
      ))}
      <button onClick={addJob} className="text-sm text-blue-600 hover:text-blue-800 mb-2">+ Add job</button>

      {/* Skills */}
      <h2 className={sectionTitle}>Skills</h2>
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div>
          <label className={label}>Hard Skills (one per line)</label>
          <textarea className={input} rows={6}
            value={data.skills.hard.join("\n")}
            onChange={(e) => setData((d) => ({ ...d, skills: { ...d.skills, hard: e.target.value.split("\n") } }))}
          />
        </div>
        <div>
          <label className={label}>Tools (one per line)</label>
          <textarea className={input} rows={6}
            value={data.skills.tools.join("\n")}
            onChange={(e) => setData((d) => ({ ...d, skills: { ...d.skills, tools: e.target.value.split("\n") } }))}
          />
        </div>
      </div>

      {/* Education */}
      <h2 className={sectionTitle}>Education</h2>
      {data.education.map((edu, i) => (
        <div key={i} className="grid grid-cols-3 gap-3 mb-3 border border-gray-200 rounded-lg p-3 bg-white">
          <div><label className={label}>Degree</label><input className={input} value={edu.degree} onChange={(e) => setEdu(i, "degree", e.target.value)} placeholder="Bachelor of Science" /></div>
          <div><label className={label}>Field</label><input className={input} value={edu.field} onChange={(e) => setEdu(i, "field", e.target.value)} placeholder="Business Administration" /></div>
          <div><label className={label}>School</label><input className={input} value={edu.school} onChange={(e) => setEdu(i, "school", e.target.value)} /></div>
          <div><label className={label}>Location</label><input className={input} value={edu.location} onChange={(e) => setEdu(i, "location", e.target.value)} /></div>
          <div><label className={label}>Year</label><input className={input} value={edu.year} onChange={(e) => setEdu(i, "year", e.target.value)} /></div>
        </div>
      ))}
      <button onClick={() => setData((d) => ({ ...d, education: [...d.education, EMPTY_EDU()] }))} className="text-sm text-blue-600 hover:text-blue-800 mb-6">+ Add education</button>

      {/* Save */}
      <div className="mt-8 flex gap-3">
        <button onClick={handleSave} disabled={saving} className="bg-black text-white text-sm px-6 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50">
          {saving ? "Saving..." : "Save Profile"}
        </button>
        <button onClick={() => router.push("/profiles")} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}
