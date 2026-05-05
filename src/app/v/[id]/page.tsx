// Direct video player page
// This is the page that gets embedded via iframe src=".../v/[id]"
// It loads the YouTube Shell player.js and initializes it for the given installation

import { Metadata } from "next"
import { prisma } from "@/lib/db"

interface Props {
  params: Promise<{ id: string }>
}

// Generate metadata for SEO and oEmbed
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const installation = await prisma.installation.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true }
        }
      }
    })

    const brandName = installation?.user?.name || "Shrazen"
    const domain = installation?.domain || "Video Player"

    return {
      title: `${domain} - ${brandName}`,
      description: `Watch this video on ${domain}`,
      // oEmbed discovery
      other: {
        // oEmbed 1.0 discovery - allows platforms like Skool to auto-detect
        "oembed:url": `${process.env.NEXT_PUBLIC_APP_URL || "https://player.shrazen.com"}/api/oembed?url=${id}`,
        "application/oembed+json": `${process.env.NEXT_PUBLIC_APP_URL || "https://player.shrazen.com"}/api/oembed?url=${id}`,
      },
    }
  } catch {
    return {
      title: "Shrazen Video Player",
      description: "High-converting video player for coaches and creators",
    }
  }
}

export default async function VideoPlayerPage({ params }: Props) {
  const { id } = await params

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <title>Loading...</title>
        {/* Preconnect to YouTube for faster video loading */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://www.google.com" />
        {/* Prevent frame busting on parent sites */}
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: #000;
            overflow: hidden;
          }
          html, body {
            height: 100%;
            width: 100%;
          }
          /* Loading state */
          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #000;
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          }
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(255,255,255,0.2);
            border-top-color: #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </head>
      <body>
        <div className="loading">
          <div className="loading-spinner" />
        </div>
        {/*
          The player.js script detects all YouTube iframes on the page and enhances them
          with lead gates, analytics, CTA overlays, and custom branding.
          We pass data-site-id so it knows which installation config to fetch.
        */}
        <script
          src={`${process.env.NEXT_PUBLIC_APP_URL || "https://player.shrazen.com"}/player.js`}
          data-site-id={id}
          defer
        />
      </body>
    </html>
  )
}
