"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import GenerateCvButton from "@/components/GenerateCvButton";
import { ExternalLink, Search } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  cv_generated: "bg-green-100 text-green-700",
  applied: "bg-purple-100 text-purple-700",
  rejected: "bg-gray-100 text-gray-500",
};

interface Job {
  id: number;
  company_id: string;
  title: string;
  url: string;
  location: string | null;
  department: string | null;
  status: string;
  found_at: Date;
  salary_text?: string | null;
  [key: string]: any;
}

export default function JobsList({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? jobs.filter((job) => {
        const q = query.toLowerCase();
        return (
          job.title.toLowerCase().includes(q) ||
          job.company_id.toLowerCase().includes(q) ||
          (job.department ?? "").toLowerCase().includes(q) ||
          (job.location ?? "").toLowerCase().includes(q)
        );
      })
    : jobs;

  return (
    <>
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by title, company, department…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <p className="text-gray-500 text-sm mb-4">
        {filtered.length} {filtered.length === 1 ? "role" : "roles"}{query.trim() ? ` matching "${query}"` : " found"}
      </p>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No jobs match your search.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((job) => (
          <Card key={job.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[job.status] ?? ""}`}>
                    {job.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-gray-400">{job.company_id}</span>
                  {job.location && <span className="text-xs text-gray-400">· {job.location}</span>}
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {job.department && <p className="text-xs text-gray-500">{job.department}</p>}
                  {job.salary_text && (
                    <span className="text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                      {job.salary_text}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Found {new Date(job.found_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                  View <ExternalLink size={11} />
                </a>
                <GenerateCvButton jobId={job.id} jobTitle={job.title} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
