import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiKey, domain, pluginVersion } = body

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 400 })
    }

    const installation = await prisma.installation.findUnique({
      where: { apiKey },
    })

    if (!installation) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    if (installation.status === "deleted") {
      return NextResponse.json({ error: "Installation has been deleted" }, { status: 410 })
    }

    let normalizedDomain = installation.domain
    if (domain) {
      normalizedDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").replace(/\/$/, "")
      
      const allowedDomains = (installation.allowedDomains as string[]) || []
      if (!allowedDomains.includes(normalizedDomain)) {
        allowedDomains.push(normalizedDomain)
        await prisma.installation.update({
          where: { id: installation.id },
          data: { allowedDomains },
        })
      }
    }

    await prisma.installation.update({
      where: { id: installation.id },
      data: {
        lastHeartbeatAt: new Date(),
        pluginVersion: pluginVersion || installation.pluginVersion,
        status: installation.status === "disconnected" ? "active" : installation.status,
      },
    })

    const user = await prisma.user.findUnique({
      where: { id: installation.userId },
    })

    return NextResponse.json({
      success: true,
      frequency: getHeartbeatFrequency(installation, user?.tier || "free"),
    })
  } catch (error) {
    console.error("Error processing heartbeat:", error)
    return NextResponse.json({ error: "Failed to process heartbeat" }, { status: 500 })
  }
}

function getHeartbeatFrequency(installation: { lastActivityAt: Date | null }, tier: string): number {
  const now = new Date()
  const lastActivity = installation.lastActivityAt ? new Date(installation.lastActivityAt) : new Date(0)
  const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)

  if (hoursSinceActivity < 1) {
    return 15
  } else if (hoursSinceActivity < 24) {
    return 30
  } else if (hoursSinceActivity < 72) {
    return 60
  } else {
    return tier === "pro" ? 30 : 60
  }
}
