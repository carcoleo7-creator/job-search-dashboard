"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function DownloadCvButton({ cvId, jobTitle, companyId }: { cvId: number; jobTitle: string; companyId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cv/download?cv_id=${cvId}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CA_${new Date().getFullYear()}_${companyId}_CV.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} size="sm" className="text-xs">
      <Download size={12} className="mr-1.5" />
      {loading ? "Preparing..." : "Download PDF"}
    </Button>
  );
}
