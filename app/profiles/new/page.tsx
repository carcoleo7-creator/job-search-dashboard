import ProfileForm from "@/components/ProfileForm";

export default function NewProfilePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">New Profile</h1>
      <p className="text-sm text-gray-500 mb-8">Fill in the resume details. Claude will tailor each section per job when generating a CV.</p>
      <ProfileForm />
    </div>
  );
}
