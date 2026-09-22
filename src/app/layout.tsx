import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
        className={`${geistSans.variable} ${geistMono.variable} ${shadowPrayer.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
