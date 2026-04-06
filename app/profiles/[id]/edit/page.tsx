import { db, profiles } from "@/lib/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProfileForm from "@/components/ProfileForm";

export default async function EditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, parseInt(id))).limit(1);
  if (!profile) notFound();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Profile</h1>
      <p className="text-sm text-gray-500 mb-8">Update resume details for {profile.name}.</p>
      <ProfileForm profileName={profile.name} initialData={profile.data} profileId={profile.id} />
    </div>
  );
}
