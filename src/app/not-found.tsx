import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <p className="text-lg text-muted-foreground">Page not found</p>
        <Link href="/" className="inline-flex items-center text-sm text-primary hover:underline">
          Go home
        </Link>
      </div>
    </div>
  );
}
