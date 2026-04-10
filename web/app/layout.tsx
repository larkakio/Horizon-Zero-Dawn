import type { Metadata, Viewport } from "next";
import { Orbitron, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const baseAppId = process.env.NEXT_PUBLIC_BASE_APP_ID ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Neon Frontier — Machine Hunt",
  description:
    "Swipe the field, fire ion bolts at machine constructs. Daily check-in on Base.",
  icons: { icon: "/icon.jpg", apple: "/icon.jpg" },
  openGraph: {
    title: "Neon Frontier — Machine Hunt",
    description: "Cyberpunk neon hunt on Base.",
    images: [{ url: "/thumbnail.jpg", width: 1910, height: 1000 }],
  },
  ...(baseAppId
    ? { other: { "base:app_id": baseAppId } as Record<string, string> }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#06060f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${orbitron.variable} ${dmSans.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
