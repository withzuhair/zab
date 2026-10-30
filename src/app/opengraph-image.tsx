import { ImageResponse } from "next/og";

export const alt = "ZAB Shipping LLC freight forwarding and logistics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "flex-start",
        backgroundColor: "#071735",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        padding: "88px",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          backgroundColor: "#34b5e5",
          height: "100%",
          position: "absolute",
          right: 0,
          top: 0,
          width: "24px",
        }}
      />
      <div
        style={{
          color: "#7dd3fc",
          fontSize: "30px",
          fontWeight: 700,
          letterSpacing: "8px",
        }}
      >
        ZAB SHIPPING LLC
      </div>
      <div
        style={{
          fontSize: "64px",
          fontWeight: 700,
          lineHeight: 1.12,
          marginTop: "28px",
          maxWidth: "900px",
        }}
      >
        Freight forwarding and logistics
      </div>
      <div
        style={{
          color: "#d8e6f4",
          fontSize: "30px",
          marginTop: "28px",
        }}
      >
        From Dubai to the world
      </div>
      <div
        style={{
          backgroundColor: "#34b5e5",
          height: "8px",
          marginTop: "42px",
          width: "180px",
        }}
      />
    </div>,
    size,
  );
}
