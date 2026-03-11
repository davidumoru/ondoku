import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import {
  GeistPixelSquare,
  GeistPixelGrid,
  GeistPixelCircle,
  GeistPixelTriangle,
  GeistPixelLine,
} from "geist/font/pixel";
import { Lora, Merriweather, Inter, Source_Sans_3 } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "ondoku",
  description: "Read anything, beautifully.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${GeistPixelSquare.variable} ${GeistPixelGrid.variable} ${GeistPixelCircle.variable} ${GeistPixelTriangle.variable} ${GeistPixelLine.variable} ${lora.variable} ${merriweather.variable} ${inter.variable} ${sourceSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
