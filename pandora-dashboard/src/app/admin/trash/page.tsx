import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import AppHeader from "@/components/layout/AppHeader";
import TrashClient from "@/components/admin/TrashClient";

export default async function TrashPage() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <AppHeader
        user={user}
        breadcrumbs={[{ label: "Admin" }, { label: "Trash" }]}
      />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <TrashClient />
      </main>
    </div>
  );
}
