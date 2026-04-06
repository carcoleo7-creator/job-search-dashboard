import { db, generatedCvs, jobs } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import DownloadCvButton from "@/components/DownloadCvButton";

export const dynamic = "force-dynamic";

export default async function CvsPage() {
  const allCvs = await db
    .select({ cv: generatedCvs, job: jobs })
    .from(generatedCvs)
    .innerJoin(jobs, eq(generatedCvs.job_id, jobs.id))
    .orderBy(desc(generatedCvs.created_at));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My CVs</h2>
        <p className="text-gray-500 text-sm mt-1">{allCvs.length} tailored CVs generated</p>
      </div>

      {allCvs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No CVs yet</p>
          <p className="text-sm mt-1">Go to Jobs and click "Generate CV" on any role</p>
        </div>
      )}

      <div className="space-y-3">
        {allCvs.map(({ cv, job }) => (
          <Card key={cv.id} className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {job.company_id} · {cv.skill_mode.replace("_", " ")} mode
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Generated {new Date(cv.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">{cv.keyword_coverage}%</p>
                  <p className="text-xs text-gray-400">keyword match</p>
                </div>
                <DownloadCvButton cvId={cv.id} jobTitle={job.title} companyId={job.company_id} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
