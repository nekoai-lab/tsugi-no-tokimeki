import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import DebugPanel from "@/components/DebugPanel";
import DebugConsole from "@/app/_components/DebugConsole";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tsugi no Tokimeki",
  description: "次のトキメキを逃さないための行動判断エージェント",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tokimeki",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
          {children}
          <DebugPanel />
          <DebugConsole />
        </AppProvider>
      </body>
    </html>
  );
}
