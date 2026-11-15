import { db, jobs } from "@/lib/db";
import { desc } from "drizzle-orm";
import JobsList from "@/components/JobsList";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const allJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.found_at));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Jobs</h2>
      </div>

      {allJobs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No jobs yet</p>
          <p className="text-sm mt-1">Go to the Dashboard and click "Scan All Companies" to find matching roles</p>
        </div>
      )}

      {allJobs.length > 0 && <JobsList jobs={allJobs as any} />}
    </div>
  );
}
