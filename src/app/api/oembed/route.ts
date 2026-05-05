import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// oEmbed Provider Endpoint
// Auto-discovers videos on Skool, Circle, Mighty Networks when URL is pasted
// https://oembed.com/ - Standard format specification

export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const installationId = url.searchParams.get("url") || url.searchParams.get("installationId")
    const format = url.searchParams.get("format") || "json"
    const maxWidth = parseInt(url.searchParams.get("maxwidth") || "800")
    const maxHeight = parseInt(url.searchParams.get("maxheight") || "450")

    // oEmbed spec requires JSON by default
    if (format !== "json") {
      return NextResponse.json({ error: "Only JSON format is supported" }, { status: 501 })
    }

    if (!installationId) {
      return NextResponse.json({
        error: "Missing required parameter: url (must contain installation ID or full player URL)"
      }, { status: 400 })
    }

    // Extract ID from various URL formats
    // Formats supported:
    // - /v/abc123 (direct player URL)
    // - /embed/abc123 (embed URL)
    // - installation ID directly
    let resolvedId = installationId

    // Clean up URL if full URL was passed
    if (installationId.includes("player.shrazen.com") || installationId.includes("localhost")) {
      try {
        const parsed = new URL(installationId)
        const match = parsed.pathname.match(/\/(v|embed)\/([a-zA-Z0-9_-]+)/)
        if (match) {
          resolvedId = match[2]
        }
      } catch {
        // If URL parsing fails, assume it's already an ID
      }
    }

    const installation = await prisma.installation.findUnique({
      where: { id: resolvedId },
      include: {
        user: {
          select: {
            name: true,
            globalBrandingConfig: true,
          },
        },
      },
    })

    if (!installation) {
      return NextResponse.json({ error: "Installation not found" }, { status: 404 })
    }

    // Calculate responsive dimensions
    const aspectRatio = 16 / 9
    let width = Math.min(maxWidth, 1920)
    let height = Math.round(width / aspectRatio)
    if (height > maxHeight) {
      height = maxHeight
      width = Math.round(height * aspectRatio)
    }

    // Generate platform-optimized iframe
    const playerBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://player.shrazen.com"
    const iframeSrc = `${playerBaseUrl}/v/${installation.id}`
    const brandName = (installation.user as { name?: string })?.name || "Shrazen Player"

    const oembedResponse = {
      type: "video",
      version: "1.0",
      title: `${installation.domain} - ${brandName}`,
      author_name: brandName,
      author_url: installation.domain,
      // provider_name: brandName,
      // provider_url: installation.domain,
      thumbnail_url: `${playerBaseUrl}/api/thumbnail/${installation.id}`,
      thumbnail_width: 1280,
      thumbnail_height: 720,
      html: `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000;">
  <iframe
    src="${iframeSrc}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
    title="${brandName} Video Player"
    width="${width}"
    height="${height}"
    loading="lazy">
  </iframe>
</div>`,
      width,
      height,
      // Add extra metadata for consumers
      extra: {
        installationId: installation.id,
        domain: installation.domain,
        platform: installation.platform,
      },
    }

    return NextResponse.json(oembedResponse, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("oEmbed error:", error)
    return NextResponse.json(
      { error: "Failed to generate oEmbed response" },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  })
}
