"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ScrapeAllButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/scrape", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setResult(`Found ${data.total_new} new jobs`);
      router.refresh();
    } catch {
      setResult("Error scanning — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && <span className="text-sm text-gray-500">{result}</span>}
      <Button onClick={handleClick} disabled={loading} size="sm">
        <RefreshCw size={14} className={loading ? "animate-spin mr-2" : "mr-2"} />
        {loading ? "Scanning..." : "Scan All Companies"}
      </Button>
    </div>
  );
}
