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
    redirect("/signin?callbackUrl=/admin");
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
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
