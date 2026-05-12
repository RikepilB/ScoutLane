import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Sidebar } from "./_components/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/signin?callbackUrl=/admin");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        user={{
          email: session.user.email,
          name: session.user.name,
          role: session.user.role,
        }}
      />
      <div className="flex min-h-screen flex-1 flex-col">{children}</div>
    </div>
  );
}
