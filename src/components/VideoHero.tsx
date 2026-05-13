"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatedBackground } from "./AnimatedBackground";

interface VideoHeroProps {
  videoSrc?: string;
  posterSrc?: string;
  children: React.ReactNode;
}

export function VideoHero({ videoSrc, posterSrc, children }: VideoHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (videoRef.current && videoSrc) {
      videoRef.current.play().catch(() => setVideoFailed(true));
    }
  }, [videoSrc]);

  return (
    <div className="relative flex min-h-screen w-full items-center overflow-hidden">
      {videoSrc && !videoFailed ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            poster={posterSrc}
            onError={() => setVideoFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/80" />
        </>
      ) : (
        <AnimatedBackground />
      )}

      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
