import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { importYouTubeVideo } from "@/lib/youtube"

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

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { url, installationId } = body

    if (!url) {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 })
    }

    // Import video metadata from YouTube
    const videoInfo = await importYouTubeVideo(url, process.env.YOUTUBE_API_KEY)

    if (!videoInfo) {
      return NextResponse.json({ error: "Invalid YouTube URL or video not found" }, { status: 400 })
    }

    // Check if video already exists for this user
    const existingVideo = await prisma.video.findFirst({
      where: {
        userId: user.id,
        youtubeVideoId: videoInfo.videoId,
      },
    })

    if (existingVideo) {
      return NextResponse.json({
        error: "Video already imported",
        video: existingVideo,
      }, { status: 409 })
    }

    // Create the video record
    const video = await prisma.video.create({
      data: {
        userId: user.id,
        youtubeVideoId: videoInfo.videoId,
        title: videoInfo.title,
        thumbnailUrl: videoInfo.thumbnailUrl,
        duration: videoInfo.duration,
        installationId: installationId || null,
        playerConfig: {},
        gateConfig: null,
      },
    })

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    console.error("Error importing video:", error)
    return NextResponse.json({ error: "Failed to import video" }, { status: 500 })
  }
}