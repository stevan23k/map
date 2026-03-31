import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "intro.js/introjs.css";
import { AuthInitializer } from "@/components/AuthInitializer";
import { SocketInitializer } from "@/components/SocketInitializer";


import { ThemeProvider } from "@/components/ThemeProvider";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mapp",
  description: "Mapp es una plataforma interactiva de visualización geoespacial y navegación, diseñada como la experiencia de mapas en línea más rápida e intuitiva.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased suppressHydrationWarning`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthInitializer>
            <SocketInitializer>
              <ToastProvider>{children}</ToastProvider>
            </SocketInitializer>
          </AuthInitializer>
        </ThemeProvider>
      </body>
    </html>
  );
}
