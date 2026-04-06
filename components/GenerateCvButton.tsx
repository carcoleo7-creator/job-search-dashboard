"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GenerateCvButton({ jobId, jobTitle }: { jobId: number; jobTitle: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cv/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: jobId }),
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        router.refresh();
      } else {
        setError(data.error ?? "Generation failed");
      }
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  if (done) return <span className="text-xs text-green-600 font-medium">CV Ready ✓</span>;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleClick} disabled={loading} size="sm" variant="outline" className="text-xs">
        <Sparkles size={12} className="mr-1.5" />
        {loading ? "Generating..." : "Generate CV"}
      </Button>
      {error && <span className="text-xs text-red-500 max-w-48 text-right">{error}</span>}
    </div>
  );
}
