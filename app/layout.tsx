import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const siteUrl = "https://lytrixconsult.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LYTRIX CONSULT — Web, Design, Video & SaaS Studio",
    template: "%s | LYTRIX CONSULT",
  },
  description:
    "LYTRIX CONSULT is a creative & software studio building standout websites, graphic design, video ads, web POS systems and SaaS products.",
  keywords: [
    "web design",
    "graphic design",
    "video ads",
    "web POS system",
    "SaaS development",
    "LYTRIX CONSULT",
  ],
  openGraph: {
    title: "LYTRIX CONSULT — Web, Design, Video & SaaS Studio",
    description:
      "We build standout websites, graphic design, video ads, web POS systems and SaaS products.",
    url: siteUrl,
    siteName: "LYTRIX CONSULT",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LYTRIX CONSULT",
    description:
      "We build standout websites, graphic design, video ads, web POS systems and SaaS products.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${openSans.variable}`}>
      <body className="font-sans antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
