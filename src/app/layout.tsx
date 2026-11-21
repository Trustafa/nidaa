import type { Metadata } from "next";
import { Hanken_Grotesk, Kalam, Great_Vibes } from "next/font/google";
import "./globals.css";

// UI face: a warm grotesque that stays legible at table sizes.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

// The ballpoint layer only: margin marks, notes and hand-summed totals.
const kalam = Kalam({
  variable: "--font-kalam",
  weight: ["400", "700"],
  subsets: ["latin"],
});

// Script face is reserved for the wordmark only — never UI text.
const greatVibes = Great_Vibes({
  variable: "--font-script",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nidaa",
  description: "Event RSVPs over WhatsApp — invitations, replies, and headcount in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${kalam.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
