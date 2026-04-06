"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ActivateProfileButton({ profileId }: { profileId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function activate() {
    setLoading(true);
    await fetch(`/api/profiles/${profileId}/activate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={activate}
      disabled={loading}
      className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 disabled:opacity-50"
    >
      {loading ? "..." : "Set Active"}
    </button>
  );
}
