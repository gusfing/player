import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiKey, reason } = body

    if (!apiKey) {
      return NextResponse.json({ error: "API key required" }, { status: 400 })
    }

    const installation = await prisma.installation.findUnique({
      where: { apiKey },
    })

    if (!installation) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    await prisma.installation.update({
      where: { id: installation.id },
      data: {
        status: "disconnected",
        lastHeartbeatAt: new Date(),
      },
    })

    console.log(`Installation ${installation.domain} disconnected. Reason: ${reason || "unknown"}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error disconnecting plugin:", error)
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
  }
}
