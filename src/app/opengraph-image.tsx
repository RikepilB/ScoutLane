import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ScoutLane — the ATS that shows its work";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0c1529",
          color: "#f1f5f9",
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
              backgroundColor: "#1B2CC1",
              color: "#f1f5f9",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            SL
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#f1f5f9" }}>
            ScoutLane
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 600,
              letterSpacing: -2,
              color: "#f1f5f9",
              lineHeight: 1.05,
            }}
          >
            The ATS that shows its work
          </div>
          <div style={{ fontSize: 30, color: "rgba(241,245,249,0.65)", lineHeight: 1.4 }}>
            Resumes become structured data, scored against the role, staged in a
            pipeline you can inspect step by step.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 24,
            color: "rgba(241,245,249,0.5)",
          }}
        >
          <div
            style={{
              width: 40,
              height: 2,
              backgroundColor: "rgba(241,245,249,0.25)",
            }}
          />
          apply → extract → parse → score → stage → dispatch
        </div>
      </div>
    ),
    { ...size }
  );
}
