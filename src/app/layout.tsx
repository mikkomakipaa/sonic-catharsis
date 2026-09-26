import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Special_Elite, IBM_Plex_Sans, IBM_Plex_Mono, Fraunces } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
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

const SITE_URL = "https://sonic-catharsis-tau.vercel.app";
const DESCRIPTION =
  "Turn a petty, everyday grievance into a deadpan clinical diagnosis and a matching metal prescription — 10 real artists picked for your exact frustration, not a genre quiz.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sonic Catharsis — Rage, Matched",
    template: "%s — Sonic Catharsis",
  },
  description: DESCRIPTION,
  keywords: [
    "metal music recommendations",
    "angry music finder",
    "mood to music generator",
    "vent app",
    "metal subgenre finder",
    "music for stress",
    "catharsis app",
  ],
  applicationName: "Sonic Catharsis",
  authors: [{ name: "Mikko Mäkipää" }],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Sonic Catharsis",
    title: "Sonic Catharsis — Rage, Matched",
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Sonic Catharsis — Rage, Matched",
    description: DESCRIPTION,
  },
};

// viewport-fit=cover lets the page reach under the iOS Safari safe areas
// instead of leaving a hard edge there; userScalable stays enabled (never
// disable pinch-zoom).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <Analytics />
      </body>
    </html>
  );
}
