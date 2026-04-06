import { db, companies, jobs } from "@/lib/db";
import { eq, count } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMPANIES } from "@/lib/companies";
import ScrapeCompanyButton from "@/components/ScrapeCompanyButton";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

const ATS_COLORS: Record<string, string> = {
  greenhouse: "bg-green-100 text-green-700",
  lever: "bg-blue-100 text-blue-700",
  ashby: "bg-purple-100 text-purple-700",
  workday: "bg-orange-100 text-orange-700",
  generic: "bg-gray-100 text-gray-600",
};

export default async function CompaniesPage() {
  const dbCompanies = await db.select().from(companies);
  const dbMap = new Map(dbCompanies.map((c) => [c.id, c]));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
        <p className="text-gray-500 text-sm mt-1">{COMPANIES.length} companies tracked</p>
      </div>

      <div className="space-y-2">
        {COMPANIES.map((company) => {
          const dbRecord = dbMap.get(company.id);
          const lastScraped = dbRecord?.last_scraped_at;

          return (
            <Card key={company.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ATS_COLORS[company.ats_type] ?? ""}`}>
                    {company.ats_type}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{company.name}</h3>
                    <p className="text-xs text-gray-400">
                      {lastScraped
                        ? `Last scanned ${new Date(lastScraped).toLocaleDateString()}`
                        : "Not yet scanned"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={company.careers_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Careers <ExternalLink size={11} />
                  </a>
                  <ScrapeCompanyButton companyId={company.id} companyName={company.name} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
