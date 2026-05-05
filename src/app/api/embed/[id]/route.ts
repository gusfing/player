import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { isLocalhost, shouldSkipDomainValidation } from "@/utils/domainValidation"
import { getCorsHeaders, addCorsHeaders } from "@/lib/cors"

// Edge runtime for global caching - critical for Kajabi/ClickFunnels performance
export const runtime = "nodejs"

// Cache config at the edge for 60 seconds
const revalidate = 60

export async function OPTIONS(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = request.headers.get("origin")
  const { id } = await params

  try {
    const installation = await prisma.installation.findUnique({
      where: { id },
      select: { allowedDomains: true },
    })

    const allowedDomains = (installation?.allowedDomains as string[]) || []
    
    if (allowedDomains.length === 0) {
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

    const isAllowed = allowedDomains.some((domain) => {
      const normalizedDomain = domain.toLowerCase()
      const normalizedOrigin = origin?.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "") || ""
      return (
        normalizedOrigin === normalizedDomain ||
        normalizedOrigin.endsWith("." + normalizedDomain)
      )
    })

    if (!isAllowed) {
      return new NextResponse("Origin not allowed", { status: 403 })
    }

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
      },
    })
  } catch (error) {
    console.error("Error handling CORS preflight:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const isDashboard = url.searchParams.get("dashboard") === "true"
    const hasDebugParam = url.searchParams.has("debug")
    
    // Get visitor domain from Origin header (PRIMARY) or Referer (FALLBACK)
    const origin = request.headers.get("origin")
    const referer = request.headers.get("referer")
    const hostHeader = request.headers.get("host")
    
    let visitorDomain = url.searchParams.get("domain") || ""
    
    // DEBUG: Log all header values
    console.log('=== YT SHELL DOMAIN DETECTION DEBUG ===')
    console.log('Full URL:', request.url)
    console.log('Origin header:', origin)
    console.log('Referer header:', referer)
    console.log('Host header:', hostHeader)
    console.log('domain param (before logic):', visitorDomain)
    
    if (!visitorDomain) {
      // Try Origin header first (most reliable for CORS)
      if (origin) {
        try {
          visitorDomain = new URL(origin).hostname
          console.log('Using Origin, extracted hostname:', visitorDomain)
        } catch (e) {
          console.log('Failed to parse Origin:', e)
        }
      }
      
      // Fallback to Referer if Origin not available
      if (!visitorDomain && referer) {
        try {
          visitorDomain = new URL(referer).hostname
          console.log('Using Referer, extracted hostname:', visitorDomain)
        } catch (e) {
          console.log('Failed to parse Referer:', e)
        }
      }
      
      // Last resort: use host header
      if (!visitorDomain) {
        visitorDomain = hostHeader || ""
        console.log('Using Host header:', visitorDomain)
      }
    }
    
    console.log('Final visitorDomain:', visitorDomain)
    console.log('=== END DEBUG ===')

    const installation = await prisma.installation.findUnique({
      where: { id },
    })

    if (!installation) {
      const response = NextResponse.json({ error: "Installation not found" }, { status: 404 })
      return response
    }

    if (installation.status === "deleted") {
      return NextResponse.json({ error: "Installation has been deleted" }, { status: 410 })
    }

    // Domain validation (skip in development)
    if (!shouldSkipDomainValidation()) {
      const allowedDomains = installation.allowedDomains as string[] || []
      const normalizedVisitorDomain = visitorDomain
        .toLowerCase()
        .replace(/^(https?:\/\/)?(www\.)?/, "")
        .replace(/\/$/, "")

      const isAllowed =
        allowedDomains.length === 0 ||
        allowedDomains.some(
          (domain) =>
            domain.toLowerCase() === normalizedVisitorDomain ||
            normalizedVisitorDomain.endsWith("." + domain.toLowerCase())
        )

      if (!isAllowed && !isLocalhost(visitorDomain)) {
        return NextResponse.json(
          {
            error: "Domain not allowed",
            message: `This player is not authorized for ${visitorDomain}. Please check your allowed domains.`,
          },
          { status: 403 }
        )
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: installation.userId },
      include: {
        googleAnalytics: true,
      },
    })

    const brandingConfig = {
      ...((user?.globalBrandingConfig as Record<string, unknown>) || {}),
      ...((installation.brandingConfig as Record<string, unknown>) || {}),
    }

    const ctaConfig = {
      ...((user?.globalCtaConfig as Record<string, unknown>) || {}),
      ...((installation.ctaConfig as Record<string, unknown>) || {}),
    }

    // Resolve Pixel ID (domain override → account fallback)
    const resolvedPixelId = installation.metaPixelId || user?.globalMetaPixelId || null

    // Resolve GA4 ID (domain override → account fallback)
    const resolvedGA4Id = installation.googleAnalyticsId || user?.googleAnalytics?.measurementId || null

    // Determine if debug mode should be active
    const debugSetting = installation.debugMode || "inherit"
    const isDebugEnabled =
      debugSetting === "enabled" ||
      (debugSetting === "inherit" && isDashboard) ||
      hasDebugParam

    const response = NextResponse.json({
      id: installation.id,
      domain: installation.domain,
      platform: installation.platform,
      brandingConfig,
      ctaConfig,
      metaPixelId: resolvedPixelId,
      resolvedGA4Id,
      resolvedPixelId,
      debugEnabled: isDebugEnabled,
      apiKey: installation.apiKey,
      createdAt: installation.createdAt,
    })

    // Add CORS headers
    const corsHeaders = await getCorsHeaders(id)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    response.headers.set("Vary", "Origin")
    // Edge caching: serve cached config to global viewers
    response.headers.set("Cache-Control", `public, max-age=60, s-maxage=${revalidate}, stale-while-revalidate=300`)

    return response
  } catch (error) {
    console.error("Error fetching embed config:", error)
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 })
  }
}
