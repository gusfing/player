import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface Params {
  params: Promise<{ id: string }>
}

const MOCK_USER = {
  id: "user_2test1234567890",
  emailAddresses: [{ emailAddress: "test@example.com" }],
}

async function getUserFromRequest(): Promise<{ id: string } | null> {
  const user = MOCK_USER
  const userEmail = user?.emailAddresses?.[0]?.emailAddress
  if (!userEmail) return null

  const dbUser = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  return dbUser || null
}

export async function GET(request: Request, { params }: Params) {
  try {
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const video = await prisma.video.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        folder: true,
      },
    })

    const leadCount = 0

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    return NextResponse.json({
      ...video,
      leadCount,
    })
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json({ error: "Failed to fetch video" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const video = await prisma.video.findFirst({
      where: { id, userId: user.id },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    const body = await request.json()
    const {
      title,
      thumbnailUrl,
      customThumbnailUrl,
      duration,
      folderId,
      tags,
      playerConfig,
      gateConfig,
    } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl
    if (customThumbnailUrl !== undefined) updateData.customThumbnailUrl = customThumbnailUrl
    if (duration !== undefined) updateData.duration = duration
    if (folderId !== undefined) updateData.folderId = folderId
    if (tags !== undefined) updateData.tags = tags
    if (playerConfig !== undefined) updateData.playerConfig = playerConfig
    if (gateConfig !== undefined) updateData.gateConfig = gateConfig

    const updated = await prisma.video.update({
      where: { id },
      data: updateData,
      include: {
        folder: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    return NextResponse.json({ video: updated })
  } catch (error) {
    console.error("Error updating video:", error)
    return NextResponse.json({ error: "Failed to update video" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const video = await prisma.video.findFirst({
      where: { id, userId: user.id },
    })

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 })
    }

    await prisma.video.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting video:", error)
    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 })
  }
}