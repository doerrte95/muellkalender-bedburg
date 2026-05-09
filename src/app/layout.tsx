import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Müllkalender Bedburg",
  description: "Dein digitaler Abfallkalender für Bedburg",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/icon-192x192.png",
  },
};

export const viewport = {
  themeColor: "#0a0a0c",
};

import InstallPrompt from '@/components/InstallPrompt';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
