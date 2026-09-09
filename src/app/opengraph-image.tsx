import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ScoutLane — hiring decisions connected to evidence";

export default function OpengraphImage() {
  // ImageResponse renders outside the page stylesheet; mirror the public brand here.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f8f8fa",
          backgroundImage:
            "radial-gradient(circle at 14% 8%, rgba(214,204,223,0.9), transparent 32%), radial-gradient(circle at 88% 16%, rgba(56,189,248,0.24), transparent 29%), radial-gradient(circle at 72% 100%, rgba(99,102,241,0.2), transparent 38%)",
          color: "#17151a",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 12,
              backgroundImage: "linear-gradient(145deg, #765a77, #403b79 58%, #123f59)",
              color: "#f8f8fa",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            SL
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#17151a" }}>
            ScoutLane
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 600,
              letterSpacing: -2,
              color: "#17151a",
              lineHeight: 1.05,
            }}
          >
            Every hiring decision should leave a trail.
          </div>
          <div style={{ fontSize: 30, color: "#514d57", lineHeight: 1.4 }}>
            Resumes, role evidence and hiring decisions stay connected in one
            candidate record.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 24,
            color: "#604368",
          }}
        >
          <div
            style={{
              width: 40,
              height: 2,
              backgroundColor: "#604368",
            }}
          />
          resume → evidence → conversations → decision
        </div>
      </div>
    ),
    { ...size }
  );
}
