import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/storage";
import EditProfileView from "@/components/EditProfileView";

export default async function EditProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <EditProfileView
      user={{ username: user.username, email: user.email, avatarUrl: user.avatarKey ? mediaUrl(user.avatarKey) : null }}
    />
  );
}
