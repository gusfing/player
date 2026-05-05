import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "YouTube Shell - Custom Video Player",
  description: "Create custom YouTube players with branding, analytics, and lead capture",
  other: {
    // oEmbed 1.0 Discovery - allows platforms like Skool/Circle to auto-embed
    // when users paste the player URL
    "oembed:url": `${process.env.NEXT_PUBLIC_APP_URL || "https://player.shrazen.com"}/api/oembed`,
    "application/oembed+json": `${process.env.NEXT_PUBLIC_APP_URL || "https://player.shrazen.com"}/api/oembed`,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full" suppressHydrationWarning>
        <body className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
