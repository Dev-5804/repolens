import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function resolveBaseUrl(): URL {
  const fallback = "https://repolens.vercel.app";
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    fallback;

  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    return new URL(normalized);
  } catch {
    return new URL(fallback);
  }
}

const METADATA_BASE = resolveBaseUrl();
const BASE_URL = METADATA_BASE.toString().replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: METADATA_BASE,
  title: {
    default: "Repolens — GitHub Repository Analytics",
    template: "%s | Repolens",
  },
  description:
    "Instant, read-only analytics dashboard for any public GitHub repository. Evaluate health, commit activity, contributors, code quality, and more.",
  keywords: [
    "GitHub",
    "repository analytics",
    "repo health",
    "open source",
    "developer tools",
    "commit activity",
    "code quality",
    "GitHub stats",
  ],
  authors: [{ name: "Dev-5804", url: "https://github.com/Dev-5804" }],
  creator: "Dev-5804",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Repolens",
    title: "Repolens — GitHub Repository Analytics",
    description:
      "Instant, read-only analytics dashboard for any public GitHub repository. Evaluate health, commit activity, contributors, code quality, and more.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Repolens — GitHub Repository Analytics Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Repolens — GitHub Repository Analytics",
    description:
      "Instant, read-only analytics dashboard for any public GitHub repository. Evaluate health, commit activity, contributors, code quality, and more.",
    images: ["/og-image.png"],
    creator: "@Dev_5804",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gh-bg text-gh-text min-h-screen`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
