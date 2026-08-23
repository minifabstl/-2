import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import PreferencesView from "@/components/PreferencesView";

export default async function PreferencesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <PreferencesView
      initial={{
        notifyOnApproval: user.notifyOnApproval,
        notifyOnRejection: user.notifyOnRejection,
        notifyOnComment: user.notifyOnComment,
      }}
    />
  );
}
