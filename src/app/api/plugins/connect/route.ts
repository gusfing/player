import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiKey, domain, platform, pluginVersion } = body

    if (!apiKey || !domain) {
      return NextResponse.json({ error: "API key and domain required" }, { status: 400 })
    }

    const normalizedDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")

    const installation = await prisma.installation.findUnique({
      where: { apiKey },
    })

    if (!installation) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    if (installation.status === "deleted") {
      return NextResponse.json({ error: "Installation has been deleted" }, { status: 410 })
    }

    if (installation.domain !== normalizedDomain) {
      const allowedDomains = (installation.allowedDomains as string[]) || []
      if (!allowedDomains.includes(normalizedDomain)) {
        allowedDomains.push(normalizedDomain)
        await prisma.installation.update({
          where: { id: installation.id },
          data: { allowedDomains },
        })
      }
    }

    const updated = await prisma.installation.update({
      where: { id: installation.id },
      data: {
        status: "active",
        lastHeartbeatAt: new Date(),
        lastActivityAt: new Date(),
        pluginVersion: pluginVersion || null,
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: installation.userId },
    })

    const brandingConfig = {
      ...((user?.globalBrandingConfig || {}) as Record<string, unknown>),
      ...((installation.brandingConfig || {}) as Record<string, unknown>),
    }

    const ctaConfig = {
      ...((user?.globalCtaConfig || {}) as Record<string, unknown>),
      ...((installation.ctaConfig || {}) as Record<string, unknown>),
    }

    const metaPixelId = installation.metaPixelId || user?.globalMetaPixelId

    return NextResponse.json({
      success: true,
      installationId: installation.id,
      domain: installation.domain,
      platform: installation.platform,
      brandingConfig,
      ctaConfig,
      metaPixelId,
      apiKey: installation.apiKey,
    })
  } catch (error) {
    console.error("Error connecting plugin:", error)
    return NextResponse.json({ error: "Failed to connect" }, { status: 500 })
  }
}
