import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Rhythmic Geometry — Clone",
  description:
    "Visual rhythm tool for seeing polymeters, riffs, orbits, and musical structures as motion and shape. Reverse-engineered clone built with Next.js.",
  keywords: [
    "rhythmic geometry",
    "polymeter",
    "polyrhythm",
    "riff cycle",
    "web audio",
    "music visualization",
  ],
  authors: [{ name: "Z.ai Clone Lab" }],
  icons: {
    icon: "https://rhythmicgeometry.com/scene-captures/website_standard_replacement.png",
  },
  openGraph: {
    title: "Rhythmic Geometry — Clone",
    description: "See rhythm as motion, shape, and return.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
