import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Shell } from "@/components/Shell";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DESCRIPTION = "Watch your GPU deployments run, and use the models you spin up.";

// metadataBase is the hosted origin so og:image resolves to an absolute URL. The
// embedded build (`gpu serve`) carries the same tags, which is harmless: nobody
// shares a localhost link, and the card asset ships in the bundle either way.
export const metadata: Metadata = {
  metadataBase: new URL("https://workbench.openlease.canonicalresearch.dev"),
  title: "OpenLease Workbench",
  description: DESCRIPTION,
  openGraph: {
    title: "OpenLease Workbench",
    description: DESCRIPTION,
    url: "https://workbench.openlease.canonicalresearch.dev",
    siteName: "OpenLease",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenLease Workbench",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
