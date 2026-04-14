import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AppHeader from "@/components/layout/AppHeader";
import ActivityLogClient from "@/components/admin/ActivityLogClient";

export default async function ActivityPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <AppHeader
        user={user}
        breadcrumbs={[{ label: "Admin" }, { label: "Activity Log" }]}
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <ActivityLogClient />
      </main>
    </div>
  );
}
