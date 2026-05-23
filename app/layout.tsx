import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next"
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { GeistPixelSquare } from "geist/font/pixel";
import { Lora, Merriweather, Inter, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import "@/components/reader/reader.css";

const lora = Lora({ subsets: ["latin"], variable: "--font-lora" });
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-merriweather",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const DESCRIPTION =
  "Read anything, beautifully. Paste a URL and read it clean — or have it read aloud.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ondoku",
    template: "%s · ondoku",
  },
  description: DESCRIPTION,
  applicationName: "ondoku",
  keywords: [
    "reader",
    "article reader",
    "text to speech",
    "TTS",
    "ElevenLabs",
    "YouTube transcript",
    "clean reading",
  ],
  authors: [{ name: "ondoku" }],
  openGraph: {
    type: "website",
    siteName: "ondoku",
    title: "ondoku",
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ondoku",
    description: DESCRIPTION,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#141413" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} ${lora.variable} ${merriweather.variable} ${inter.variable} ${sourceSans.variable} antialiased`}
      >
        <Analytics />
        {children}
      </body>
    </html>
  );
}
