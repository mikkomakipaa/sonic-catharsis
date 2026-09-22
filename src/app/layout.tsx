import type { Metadata } from "next";
import { Geist, Geist_Mono, Special_Elite, IBM_Plex_Sans, IBM_Plex_Mono, Fraunces } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const shadowPrayer = localFont({
  src: "../../public/fonts/ShadowPrayer-MAXKx.otf",
  variable: "--font-shadow-prayer",
  display: "swap",
});

// Office-memo fonts — used only on the analysis screen's "epicrisis" look,
// loaded globally here to match this repo's existing next/font pattern.
const specialElite = Special_Elite({
  variable: "--font-special-elite",
  weight: "400",
  subsets: ["latin"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

// Quiet-palette headline face — used by the page masthead's reframed
// "How are you feeling today?" headline.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sonic Catharsis",
  description: "AI-powered emotion detection with personalized metal music curation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${shadowPrayer.variable} ${specialElite.variable} ${plexSans.variable} ${plexMono.variable} ${fraunces.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
