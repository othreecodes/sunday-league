import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import MobileNav from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "Sunday League Manager",
  description: "Manage your Sunday league football matches, scores, and stats",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SundayLeague FC"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F2F2F7", // iOS system background
  viewportFit: "cover"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
