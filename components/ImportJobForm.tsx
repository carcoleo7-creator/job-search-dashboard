"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Link, Loader2, CheckCircle2 } from "lucide-react";

export default function ImportJobForm() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [needsText, setNeedsText] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; company: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), descriptionText: descriptionText || undefined }),
      });
      const data = await res.json();

      if (res.status === 422 && data.needsText) {
        setNeedsText(true);
        setError("Couldn't read that page automatically — paste the job description below and try again.");
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Import failed");
        setLoading(false);
        return;
      }

      setResult({ title: data.title, company: data.company });
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setOpen(false);
    setUrl("");
    setDescriptionText("");
    setNeedsText(false);
    setResult(null);
    setError(null);
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm" variant="outline" className="text-xs">
        <Link size={12} className="mr-1.5" />
        Import Job Link
      </Button>
    );
  }

  if (result) {
    return (
      <div className="border rounded-lg p-4 bg-green-50 border-green-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600" />
          <span className="text-sm text-green-800 font-medium">{result.title} @ {result.company} added</span>
        </div>
        <Button onClick={handleReset} size="sm" variant="ghost" className="text-xs">Import another</Button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Import a job link</p>
        <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://jobs.lever.co/company/job-id"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="flex-1 text-sm border rounded-md px-3 py-1.5 outline-none focus:ring-2 focus:ring-gray-300"
        />
        <Button onClick={handleSubmit} disabled={loading || !url.trim()} size="sm" className="text-xs shrink-0">
          {loading ? <Loader2 size={12} className="animate-spin mr-1.5" /> : null}
          {loading ? "Importing..." : "Import"}
        </Button>
      </div>

      {needsText && (
        <textarea
          placeholder="Paste the full job description here..."
          value={descriptionText}
          onChange={(e) => setDescriptionText(e.target.value)}
          rows={6}
          className="w-full text-sm border rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-gray-300 resize-none"
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
