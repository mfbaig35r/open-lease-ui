import { ImageResponse } from "next/og";
import { BRAND_TEAL, CANVAS, INK, INK_STRONG, INK_MUTED } from "@/lib/brand";

// Source of truth for app/opengraph-image.png. Regenerate with `pnpm og:card`,
// which copies this file into app/ as a metadata route, builds, and lifts the
// rendered PNG back out.
//
// It deliberately does NOT live in app/ as a route. Under output: "export" a
// generated metadata image is emitted as the extensionless file
// out/opengraph-image, and Vercel's route table 308-redirects /opengraph-image
// to /opengraph-image/ before the filesystem handler, with no content-type
// override for it either. Shipping the rendered PNG as the static
// app/opengraph-image.png instead yields a /opengraph-image.png?<hash> URL,
// which has an extension and so dodges both problems.
export const dynamic = "force-static";

export const alt = "OpenLease Workbench · Watch your GPU deployments run";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Companion to the openlease site card (canonical-agency
// src/app/openlease/opengraph-image.tsx): same composition, same GPU mark, same
// palette, with the Workbench wordmark and its own thesis so the two links are
// distinguishable when shared. Prerendered to a static PNG at build time because
// next.config.ts sets output: "export", so there is no function to render it on
// demand and next/og bundles no fallback font here. loadGeist() supplies one.
async function loadGeist(): Promise<ArrayBuffer> {
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const buf = await readFile(join(process.cwd(), "assets", "Geist-Regular.ttf"));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export default async function Image() {
  const geist = await loadGeist();
  return new ImageResponse(
    (
      <div
        style={{
          background: CANVAS,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px",
          position: "relative",
          fontFamily: "Geist",
        }}
      >
        {/* Subtle teal radial, kept very low intensity */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "5%",
            width: "640px",
            height: "640px",
            background:
              "radial-gradient(circle, rgba(0,210,190,0.10) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Top: brand mark, GPU icon plus stacked text */}
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <svg
            width={48}
            height={48}
            viewBox="0 0 24 24"
            fill="none"
            stroke={BRAND_TEAL}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 17h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H2" />
            <path d="M2 21V3" />
            <path d="M7 17v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3" />
            <circle cx="16" cy="11" r="2" />
            <circle cx="8" cy="11" r="2" />
          </svg>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              fontSize: "20px",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            <div style={{ color: INK_STRONG }}>OpenLease</div>
            <div style={{ color: INK_MUTED }}>Workbench</div>
          </div>
        </div>

        {/* Middle: thesis, then the accent-ruled command that opens it */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            gap: "36px",
          }}
        >
          <div
            style={{
              fontSize: "76px",
              fontWeight: 600,
              color: INK_STRONG,
              letterSpacing: "-0.025em",
              lineHeight: 1.08,
              maxWidth: "920px",
            }}
          >
            Watch your GPU deployments run.
          </div>
          <div
            style={{
              display: "flex",
              borderLeft: `3px solid ${BRAND_TEAL}`,
              paddingLeft: "22px",
              paddingTop: "4px",
              paddingBottom: "4px",
              fontSize: "26px",
              color: INK,
              lineHeight: 1.4,
            }}
          >
            gpu serve
          </div>
        </div>

        {/* Bottom: domain + license */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "18px",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: INK_MUTED,
          }}
        >
          <div>workbench.openlease.canonicalresearch.dev</div>
          <div>Apache-2.0 · a Canonical project</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Geist", data: geist, weight: 400, style: "normal" }],
    }
  );
}
