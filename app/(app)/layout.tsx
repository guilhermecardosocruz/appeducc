import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppTopbar from "@/components/AppTopbar";
import { getSessionUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppTopbar userName={user.name} userEmail={user.email} />
      {children}
    </div>
  );
}
