import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import AuthProvider from "@/components/AuthProvider";
import { Providers } from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "mooch",
  description: "Track the chaos, keep the vibes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AuthProvider>{children}</AuthProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: "#fdfcfb",
                border: "1px solid var(--color-edge)",
                color: "#3D2E22",
                fontFamily: "var(--font-geist-sans)",
                boxShadow: "var(--shadow-toast)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
