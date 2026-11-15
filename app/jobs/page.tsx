import { db, jobs } from "@/lib/db";
import { desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import GenerateCvButton from "@/components/GenerateCvButton";
import SearchInput from "@/components/SearchInput";
import ImportJobForm from "@/components/ImportJobForm";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  cv_generated: "bg-green-100 text-green-700",
  applied: "bg-purple-100 text-purple-700",
  rejected: "bg-gray-100 text-gray-500",
};

export default async function JobsPage({ searchParams }: { searchParams: { q?: string } }) {
  const allJobs = await db
    .select({
      id: jobs.id,
      company_id: jobs.company_id,
      title: jobs.title,
      url: jobs.url,
      location: jobs.location,
      department: jobs.department,
      salary_text: jobs.salary_text,
      status: jobs.status,
      found_at: jobs.found_at,
    })
    .from(jobs)
    .orderBy(desc(jobs.found_at));

  const q = searchParams.q?.toLowerCase() ?? "";
  const filtered = q
    ? allJobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company_id.toLowerCase().includes(q) ||
          (j.department ?? "").toLowerCase().includes(q) ||
          (j.location ?? "").toLowerCase().includes(q)
      )
    : allJobs;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
        <ImportJobForm />
      </div>

      {allJobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No jobs yet</p>
          <p className="text-sm mt-1">Go to the Dashboard and click "Scan All Companies" to find matching roles</p>
        </div>
      ) : (
        <>
          <SearchInput defaultValue={searchParams.q} />

          <p className="text-gray-500 text-sm mb-4">
            {filtered.length} {filtered.length === 1 ? "role" : "roles"}
            {q ? ` matching "${searchParams.q}"` : " found"}
          </p>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
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
      )}
    </div>
  );
}
