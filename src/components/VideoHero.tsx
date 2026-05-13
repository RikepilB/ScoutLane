"use client";

import { useEffect, useRef, useState } from "react";

interface VideoHeroProps {
  videoSrc: string;
  posterSrc?: string;
  overlay?: boolean;
  children: React.ReactNode;
}

export function VideoHero({ videoSrc, posterSrc, overlay = true, children }: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  return (
    <div className="relative flex min-h-screen w-full items-center overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        poster={posterSrc}
        onLoadedData={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${loaded ? "opacity-100" : "opacity-0"}`}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {!loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800" />
      )}

      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/80" />
      )}

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
