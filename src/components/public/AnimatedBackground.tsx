"use client";

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950" />

      <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
      <div className="absolute right-1/4 top-1/3 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
      <div className="absolute bottom-1/4 left-1/3 h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-[90px] animate-pulse" style={{ animationDuration: "12s", animationDelay: "4s" }} />

      <svg className="absolute inset-0 h-full w-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/50" />
    </div>
  );
}
