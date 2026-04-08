import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const players = await prisma.player.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            analytics: true,
            ctaClicks: true,
          },
        },
      },
    })

    return NextResponse.json(players)
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, youtubeVideoId } = body

    if (!name || !youtubeVideoId) {
      return NextResponse.json({ error: "Name and YouTube Video ID are required" }, { status: 400 })
    }

    // Get user from database
    let user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    // Create user if not exists (first time sign in)
    if (!user) {
      const clerkUser = await currentUser()
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || "",
          name: clerkUser?.fullName || "",
          tier: "free",
        },
      })
    }

    // Check player limit for free tier
    if (user.tier === "free") {
      const playerCount = await prisma.player.count({
        where: { userId: user.id },
      })
      
      if (playerCount >= 1) {
        return NextResponse.json({ 
          error: "Free tier limit reached. Upgrade to create more players." 
        }, { status: 403 })
      }
    }

    const player = await prisma.player.create({
      data: {
        userId: user.id,
        name,
        youtubeVideoId,
      },
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error("Error creating player:", error)
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 })
  }
}
