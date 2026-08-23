import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: "linear-gradient(160deg, #e34d34, #a83321)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "rgba(255,255,255,0.16)",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          Lf
        </div>
        <div style={{ display: "flex", color: "white", fontSize: 64, fontWeight: 800 }}>LeakedFap</div>
        <div style={{ display: "flex", color: "rgba(255,255,255,0.85)", fontSize: 28, fontWeight: 500 }}>
          Share and earn — paid per view, in Bitcoin
        </div>
      </div>
    ),
    { ...size }
  );
}
