"use client";

import { useEffect, useState } from "react";

const LOCATION_OPTIONS = [
  { value: "remote", label: "Remote only" },
  { value: "hybrid", label: "Remote or Hybrid" },
  { value: "any", label: "Any location" },
];

export default function SettingsPage() {
  const [keywords, setKeywords] = useState("");
  const [locationFilter, setLocationFilter] = useState("remote");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setKeywords((data.keywords ?? []).join("\n"));
        setLocationFilter(data.location_filter ?? "remote");
      });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const keywordList = keywords.split("\n").map((k) => k.trim()).filter(Boolean);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords: keywordList, location_filter: locationFilter }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleClearRescan() {
    if (!confirm("This will delete all saved jobs and CVs, then rescan all companies. Continue?")) return;
    setClearing(true);
    setStatus("Clearing jobs...");
    await fetch("/api/jobs/clear", { method: "POST" });
    setClearing(false);
    setRescanning(true);
    setStatus("Rescanning all companies...");
    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setRescanning(false);
    setStatus(`Done — found ${data.total_new ?? 0} new jobs.`);
    setTimeout(() => setStatus(""), 5000);
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Search Criteria</h1>
      <p className="text-sm text-gray-500 mb-8">Configure what roles and locations to search for across all companies.</p>

      {/* Role Keywords */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">Role Keywords</h2>
        <p className="text-xs text-gray-500 mb-3">One keyword per line. A job matches if its title contains any of these.</p>
        <textarea
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          rows={10}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
          placeholder={"operations\nstrategy\nchief of staff\nbusiness operations\nrevenue operations\nprogram manager"}
        />
      </section>

      {/* Location Filter */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Location Filter</h2>
        <div className="space-y-2">
          {LOCATION_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="location"
                value={opt.value}
                checked={locationFilter === opt.value}
                onChange={() => setLocationFilter(opt.value)}
                className="accent-black"
              />
              <span className="text-sm text-gray-800">{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white text-sm px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved.</span>}
      </div>

      {/* Divider */}
      <hr className="mb-8" />

      {/* Clear & Rescan */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-1">Clear & Rescan</h2>
        <p className="text-xs text-gray-500 mb-4">
          Delete all saved jobs and CVs, then immediately rescan all companies using the current criteria above.
          Use this after changing keywords or location filter.
        </p>
        <button
          onClick={handleClearRescan}
          disabled={clearing || rescanning}
          className="bg-red-600 text-white text-sm px-5 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {clearing ? "Clearing..." : rescanning ? "Rescanning..." : "Clear & Rescan"}
        </button>
        {status && <p className="mt-3 text-sm text-gray-600">{status}</p>}
      </section>
    </div>
  );
}
