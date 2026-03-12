import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Footer } from "@/components/sections/footer";
import { Navbar } from "@/components/sections/navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "mooch — track the chaos, keep the vibes",
  description: "Expenses, plans, votes & memories — all in one squad app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
