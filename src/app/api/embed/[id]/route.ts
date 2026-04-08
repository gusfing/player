import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const player = await prisma.player.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            metaPixelId: true,
          },
        },
      },
    })

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Return minimal config for client-side use
    const config = {
      id: player.id,
      youtubeVideoId: player.youtubeVideoId,
      thumbnailUrl: player.thumbnailUrl,
      brandingConfig: player.brandingConfig,
      ctaConfig: player.ctaConfig,
      metaPixelId: player.user.metaPixelId,
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error fetching embed config:", error)
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 })
  }
}
