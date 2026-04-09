import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface CorsOptions {
  allowedOrigins?: string[]
  methods?: string[]
  headers?: string[]
}

function parseAllowedDomains(domains: unknown): string[] {
  if (!domains) return []
  if (Array.isArray(domains)) return domains.filter((d): d is string => typeof d === "string")
  if (typeof domains === "string") {
    try {
      const parsed = JSON.parse(domains)
      if (Array.isArray(parsed)) return parsed.filter((d): d is string => typeof d === "string")
    } catch {
      return []
    }
  }
  return []
}

export async function getCorsHeaders(installationId: string): Promise<Record<string, string>> {
  try {
    const installation = await prisma.installation.findUnique({
      where: { id: installationId },
      select: { allowedDomains: true },
    })

    const allowedDomains = parseAllowedDomains(installation?.allowedDomains)

    if (allowedDomains.length === 0) {
      return {
        "Access-Control-Allow-Origin": "*",
      }
    }

    const primaryDomain = allowedDomains[0]
    return {
      "Access-Control-Allow-Origin": `https://${primaryDomain}`,
      "Access-Control-Allow-Credentials": "true",
    }
  } catch (error) {
    console.error("Error getting CORS headers:", error)
    return {
      "Access-Control-Allow-Origin": "*",
    }
  }
}

export function isOriginAllowed(origin: string | null, allowedDomains: string[]): boolean {
  if (!origin) return true
  if (allowedDomains.length === 0) return true

  return allowedDomains.some((domain) => {
    const normalizedDomain = domain.toLowerCase()
    const normalizedOrigin = origin.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "")
    return (
      normalizedOrigin === normalizedDomain ||
      normalizedOrigin.endsWith("." + normalizedDomain)
    )
  })
}

export function createCorsResponse(
  origin: string | null,
  allowedDomains: string[],
  options: CorsOptions = {}
): NextResponse {
  const methods = options.methods || ["GET", "POST", "OPTIONS"]
  const headers = options.headers || ["Content-Type", "Authorization"]

  const isAllowed = isOriginAllowed(origin, allowedDomains)

  if (!isAllowed && allowedDomains.length > 0) {
    return NextResponse.json(
      { error: "Origin not allowed" },
      { status: 403 }
    )
  }

  const responseHeaders: Record<string, string> = {
    "Access-Control-Allow-Methods": methods.join(", "),
    "Access-Control-Allow-Headers": headers.join(", "),
    "Access-Control-Max-Age": "86400",
  }

  if (origin) {
    responseHeaders["Access-Control-Allow-Origin"] = origin
    responseHeaders["Vary"] = "Origin"
  } else {
    responseHeaders["Access-Control-Allow-Origin"] = "*"
  }

  return NextResponse.json({ ok: true }, { status: 204, headers: responseHeaders })
}

export function addCorsHeaders(
  response: NextResponse,
  corsHeaders: Record<string, string>
): NextResponse {
  const newResponse = new NextResponse(response.body, response)
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newResponse.headers.set(key, value)
  })
  
  newResponse.headers.set("Vary", "Origin")
  
  return newResponse
}
