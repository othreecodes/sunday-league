import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import MobileNav from "@/components/MobileNav";
import { BRAND_NAME, BRAND_SHORT, BRAND_TAGLINE, BRAND_DESCRIPTION, BRAND_COLORS } from "@/lib/brand";

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    template: `%s · ${BRAND_NAME}`
  },
  description: BRAND_DESCRIPTION,
  applicationName: BRAND_NAME,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND_SHORT
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512x512.png", type: "image/png", sizes: "512x512" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }]
  },
  openGraph: {
    title: BRAND_NAME,
    description: BRAND_DESCRIPTION,
    siteName: BRAND_NAME,
    type: "website"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Pinch-zoom left enabled: locking it out fails WCAG 1.4.4 and hurts anyone
  // reading a dense league table on a small screen.
  themeColor: BRAND_COLORS.theme,
  viewportFit: "cover"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
