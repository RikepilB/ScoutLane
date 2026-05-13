"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">500</h1>
        <p className="text-lg text-muted-foreground">Something went wrong</p>
        <button
          onClick={reset}
          className="inline-flex items-center text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
