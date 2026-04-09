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
