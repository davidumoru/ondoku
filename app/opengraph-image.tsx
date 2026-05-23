import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ondoku — Read anything, beautifully.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#141413",
          color: "#E8E6E0",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "96px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 200,
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          ondoku
        </div>
        <div
          style={{
            fontSize: 48,
            color: "#878580",
            marginTop: 32,
            letterSpacing: "-0.01em",
          }}
        >
          Read anything, beautifully.
        </div>
      </div>
    ),
    size,
  );
}
