import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Müllkalender Bedburg",
  description: "Dein digitaler Abfallkalender für Bedburg",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0a0a0c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        {children}
      </body>
    </html>
  );
}
