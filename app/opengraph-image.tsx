import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            "radial-gradient(60% 60% at 30% 20%, rgba(45,212,191,0.35), transparent 70%), radial-gradient(50% 50% at 70% 60%, rgba(124,58,237,0.32), transparent 65%), radial-gradient(40% 40% at 20% 80%, rgba(251,191,36,0.28), transparent 60%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(2,6,23,0.6)",
            borderRadius: 24,
            border: "1px solid rgba(71,85,105,0.5)",
            padding: 40,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                height: 28,
                width: 28,
                borderRadius: 8,
                backgroundColor: "rgba(45,212,191,0.15)",
                border: "1px solid rgba(45,212,191,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ height: 12, width: 12, borderRadius: 999, backgroundColor: "rgb(45,212,191)" }} />
            </div>
            <span style={{ fontSize: 28, color: "rgb(203,213,225)", letterSpacing: 1.2, textTransform: "uppercase" }}>InterpretReflect</span>
          </div>
          <div style={{ height: 16 }} />
          <div style={{ fontSize: 48, fontWeight: 600, color: "white", textAlign: "center" }}>The operating system for interpreters</div>
          <div style={{ height: 10 }} />
          <div style={{ fontSize: 22, color: "rgb(148,163,184)", textAlign: "center", maxWidth: 900 }}>
            A calm, science‑based OS tracking emotional load and skills with multi‑agent support.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

