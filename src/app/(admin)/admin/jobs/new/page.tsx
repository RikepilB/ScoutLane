import { NewJobForm } from "@/components/admin/NewJobForm";

export default function NewJobPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
            Admin
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Create a new job</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Start the role in draft, active, or closed state and let the app generate a
            unique public slug automatically.
          </p>
        </div>

        <NewJobForm />
      </div>
    </main>
  );
}
