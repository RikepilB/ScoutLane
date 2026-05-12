import Link from "next/link";

export const metadata = {
  title: "Access denied · ScoutLane",
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Access denied
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          Your account is signed in but does not have admin permission. Contact
          an existing admin to request access.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
