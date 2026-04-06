import { db, jobs, companies } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import GenerateCvButton from "@/components/GenerateCvButton";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  cv_generated: "bg-green-100 text-green-700",
  applied: "bg-purple-100 text-purple-700",
  rejected: "bg-gray-100 text-gray-500",
};

export default async function JobsPage() {
  const allJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.found_at));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
        <p className="text-gray-500 text-sm mt-1">{allJobs.length} relevant roles found</p>
      </div>

      {allJobs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No jobs yet</p>
          <p className="text-sm mt-1">Go to the Dashboard and click "Scan All Companies" to find matching roles</p>
        </div>
      )}

      <div className="space-y-3">
        {allJobs.map((job) => (
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
                {job.department && <p className="text-xs text-gray-500 mt-0.5">{job.department}</p>}
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
    </div>
  );
}
