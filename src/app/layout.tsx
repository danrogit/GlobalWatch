import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GlobalWatch | Live Geopolitical Situational Awareness",
  description: "Real-time 3D globe visualization of global geopolitical events. Monitor protests, conflicts, sanctions, and more from verified sources.",
  keywords: ["geopolitical events", "global news", "situational awareness", "protests", "conflicts", "world map", "live events"],
  authors: [{ name: "GlobalWatch" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "GlobalWatch | Live Geopolitical Situational Awareness",
    description: "Real-time 3D globe visualization of global geopolitical events.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GlobalWatch | Live Geopolitical Situational Awareness",
    description: "Real-time 3D globe visualization of global geopolitical events.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
