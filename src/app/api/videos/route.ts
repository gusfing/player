import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

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

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")
    const tag = searchParams.get("tag")
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const page = parseInt(searchParams.get("page") || "1", 10)
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { userId: user.id }

    if (folderId && folderId !== "null" && folderId !== "undefined") {
      where.folderId = folderId === "none" ? null : folderId
    }

    if (tag) {
      where.tags = { has: tag }
    }

    if (search) {
      where.title = { contains: search, mode: "insensitive" }
    }

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        include: {
          folder: {
            select: { id: true, name: true, color: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.video.count({ where }),
    ])

    // Skip lead counts for now to get API working
    const videosWithLeads = videos.map((v) => ({
      ...v,
      leadCount: 0,
    }))

    return NextResponse.json({
      videos: videosWithLeads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { youtubeVideoId, title, thumbnailUrl, customThumbnailUrl, duration, folderId, tags, playerConfig, gateConfig } = body

    if (!youtubeVideoId) {
      return NextResponse.json({ error: "YouTube video ID is required" }, { status: 400 })
    }

    const existing = await prisma.video.findFirst({
      where: {
        userId: user.id,
        youtubeVideoId,
      },
    })

    if (existing) {
      return NextResponse.json({ error: "Video already exists" }, { status: 409 })
    }

    const video = await prisma.video.create({
      data: {
        userId: user.id,
        youtubeVideoId,
        title: title || `YouTube Video ${youtubeVideoId}`,
        thumbnailUrl: thumbnailUrl || null,
        customThumbnailUrl: customThumbnailUrl || null,
        duration: duration || null,
        folderId: folderId || null,
        tags: tags || [],
        playerConfig: playerConfig || {},
        gateConfig: gateConfig || null,
      },
      include: {
        folder: {
          select: { id: true, name: true, color: true },
        },
      },
    })

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    console.error("Error creating video:", error)
    return NextResponse.json({ error: "Failed to create video" }, { status: 500 })
  }
}