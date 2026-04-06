import Link from "next/link";
import { db, profiles } from "@/lib/db";
import { UserCircle } from "lucide-react";
import ActivateProfileButton from "@/components/ActivateProfileButton";

export const dynamic = "force-dynamic";

export default async function ProfilesPage() {
  const rows = await db.select().from(profiles).orderBy(profiles.created_at);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profiles</h1>
          <p className="text-sm text-gray-500 mt-1">Manage resume profiles. The active profile is used for all CV generation.</p>
        </div>
        <Link href="/profiles/new" className="bg-black text-white text-sm px-4 py-2 rounded-md hover:bg-gray-800">
          + New Profile
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <UserCircle size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No profiles yet — create one to start generating CVs.</p>
          <Link href="/profiles/new" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-800">Create your first profile →</Link>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {rows.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCircle size={36} className="text-gray-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">{p.name}</span>
                    {p.is_active && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.data.personal.name} · {(p.data.workExperience ?? []).length} jobs · Updated {new Date(p.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!p.is_active && <ActivateProfileButton profileId={p.id} />}
                <Link href={`/profiles/${p.id}/edit`} className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
