import { db, jobs, companies, generatedCvs } from "@/lib/db";
import { eq, count, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, FileText, Building2, Sparkles } from "lucide-react";
import ScrapeAllButton from "@/components/ScrapeAllButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalJobs] = await db.select({ count: count() }).from(jobs);
  const [newJobs] = await db.select({ count: count() }).from(jobs).where(eq(jobs.status, "new"));
  const [totalCvs] = await db.select({ count: count() }).from(generatedCvs);
  const [totalCompanies] = await db.select({ count: count() }).from(companies);

  const recentJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.found_at))
    .limit(5);

  const recentCvs = await db
    .select({ cv: generatedCvs, job: jobs })
    .from(generatedCvs)
    .innerJoin(jobs, eq(generatedCvs.job_id, jobs.id))
    .orderBy(desc(generatedCvs.created_at))
    .limit(3);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">Your automated job search overview</p>
        </div>
        <ScrapeAllButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Jobs Found" value={totalJobs.count} icon={<Briefcase size={18} />} />
        <StatCard title="New Matches" value={newJobs.count} icon={<Sparkles size={18} />} highlight />
        <StatCard title="CVs Generated" value={totalCvs.count} icon={<FileText size={18} />} />
        <StatCard title="Companies Tracked" value={totalCompanies.count} icon={<Building2 size={18} />} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Job Matches</CardTitle>
              <Link href="/jobs" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentJobs.length === 0 && (
              <p className="text-sm text-gray-400">No jobs yet — click "Scan All Companies" to start</p>
            )}
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-500">{job.company_id} · {job.location}</p>
                </div>
                <Badge variant={job.status === "new" ? "default" : "secondary"} className="text-xs shrink-0">
                  {job.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent CVs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent CVs</CardTitle>
              <Link href="/cvs" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentCvs.length === 0 && (
              <p className="text-sm text-gray-400">No CVs generated yet</p>
            )}
            {recentCvs.map(({ cv, job }) => (
              <div key={cv.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-500">{job.company_id} · {cv.skill_mode}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-green-600">{cv.keyword_coverage}%</p>
                  <p className="text-xs text-gray-400">match</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, highlight }: { title: string; value: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-blue-200 bg-blue-50" : ""}>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500">{title}</p>
          <span className={highlight ? "text-blue-500" : "text-gray-400"}>{icon}</span>
        </div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}
