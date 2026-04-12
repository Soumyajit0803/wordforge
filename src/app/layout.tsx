import type { Metadata, Viewport } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar/Navbar";

export const metadata: Metadata = {
  title: "WordForge",
  description: "Create custom word puzzles, challenge your friends, and climb the leaderboard in WordForge.",
  applicationName: "WordForge",
  openGraph: {
    title: "WordForge",
    description: "Create custom word puzzles and challenge your friends!",
    url: "https://wordforge.vercel.app", // Update this when you deploy!
    siteName: "WordForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WordForge",
    description: "Create custom word puzzles and challenge your friends!",
  },
  authors: [{ name: "Soumyajit Karmakar" }],
  generator: "Next.js",
  keywords: [
    "wordle",
    "wordforge",
    "word game",
    "word puzzle",
    "wordle challenge",
    "nextjs",
    "drizzle",
    "react",
    "typescript",
  ],
};


export const viewport: Viewport = {
  themeColor: "#2b2b2b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const robotoMono = Roboto_Mono({
  variable: "--app-font",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="WordForge" />
      </head>
      <body className={`${robotoMono.variable}`}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
