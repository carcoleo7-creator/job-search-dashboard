"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ScrapeCompanyButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId }),
      });
      const data = await res.json();
      const r = data.results?.[0];
      setResult(r ? `${r.new} new` : "done");
      router.refresh();
    } catch {
      setResult("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs text-gray-400">{result}</span>}
      <Button onClick={handleClick} disabled={loading} size="sm" variant="outline" className="text-xs">
        <RefreshCw size={11} className={loading ? "animate-spin mr-1" : "mr-1"} />
        {loading ? "Scanning..." : "Scan"}
      </Button>
    </div>
  );
}
