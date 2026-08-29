import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Sidebar } from "./_components/Sidebar";
import { MobileNav } from "./_components/MobileNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin?redirect_url=/admin");
  }

  const user = {
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] md:flex-row">
      <Sidebar user={user} />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileNav user={user} />
        {user.role === "GUEST" && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-800">
            Viewing as Guest — read-only. Changes are disabled in this demo.
          </div>
        )}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
