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
  metadataBase: new URL("https://mooch.me"),
  openGraph: {
    title: "mooch — track the chaos, keep the vibes",
    description: "Expenses, plans, votes & memories — all in one squad app.",
    url: "https://mooch.me",
    siteName: "mooch",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "mooch — track the chaos, keep the vibes",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "mooch — track the chaos, keep the vibes",
    description: "Expenses, plans, votes & memories — all in one squad app.",
    images: ["/og.jpg"],
  },
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
