import type { Metadata, Viewport } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Navbar from "@/components/Navbar/Navbar";
import { GoogleAnalytics } from '@next/third-parties/google'

export const metadata: Metadata = {
  title: "ForgeWord",
  description: "Create custom word puzzles, challenge your friends, and climb the leaderboard in ForgeWord.",
  applicationName: "ForgeWord",
  openGraph: {
    title: "ForgeWord",
    description: "Create custom word puzzles and challenge your friends!",
    url: "https://forgeword.vercel.app",
    siteName: "ForgeWord",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ForgeWord",
    description: "Create custom word puzzles and challenge your friends!",
  },
  authors: [{ name: "Soumyajit Karmakar" }],
  generator: "Next.js",
  keywords: [
    "wordle",
    "forgeword",
    "word game",
    "word puzzle",
    "wordle challenge",
    "nextjs",
    "drizzle",
    "react",
    "typescript",
    "website",
    "game website"
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
        <meta name="apple-mobile-web-app-title" content="ForgeWord" />
      </head>
      <body className={`${robotoMono.variable}`}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
    </html>
  );
}
