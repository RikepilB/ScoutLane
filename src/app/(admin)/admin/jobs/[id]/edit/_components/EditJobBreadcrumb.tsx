import Link from "next/link";

interface EditJobBreadcrumbProps {
  jobId: string;
  title: string;
}

export function EditJobBreadcrumb({ jobId, title }: EditJobBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link
        href="/admin/jobs"
        className="transition-colors hover:text-foreground"
      >
        Jobs
      </Link>
      <span className="text-muted-foreground/40">/</span>
      <Link
        href={`/admin/jobs/${jobId}`}
        className="transition-colors hover:text-foreground"
      >
        {title}
      </Link>
      <span className="text-muted-foreground/40">/</span>
      <span className="text-foreground">Edit</span>
    </nav>
  );
}
