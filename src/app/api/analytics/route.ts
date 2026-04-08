import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { playerId, eventType, currentTime, duration, watchPercent, deviceType, country } = body

    if (!playerId || !eventType) {
      return NextResponse.json({ error: "Player ID and event type required" }, { status: 400 })
    }

    // Get player to find user
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    })

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 })
    }

    // Create analytics event
    const event = await prisma.analyticsEvent.create({
      data: {
        playerId,
        eventType,
        currentTime,
        duration,
        watchPercent,
        deviceType,
        country,
      },
    })

    // Update player play count if this is a play event
    if (eventType === "play") {
      await prisma.player.update({
        where: { id: playerId },
        data: {
          playCount: { increment: 1 },
        },
      })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Error creating analytics event:", error)
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get("playerId")
    const period = searchParams.get("period") || "30d"

    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    const where: any = {
      createdAt: {
        gte: startDate,
      },
    }

    if (playerId) {
      where.playerId = playerId
    }

    // Get aggregated stats
    const [events, playerStats] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      playerId ? prisma.player.findUnique({
        where: { id: playerId },
        select: {
          playCount: true,
          totalWatchTime: true,
        },
      }) : null,
    ])

    // Calculate stats
    const stats = {
      totalPlays: events.filter(e => e.eventType === "play").length,
      uniqueViewers: events.filter(e => e.eventType === "play").length,
      avgWatchPercent: events.filter(e => e.watchPercent).length > 0
        ? events.filter(e => e.watchPercent).reduce((acc, e) => acc + (e.watchPercent || 0), 0) / events.filter(e => e.watchPercent).length
        : 0,
      totalWatchTime: playerStats?.totalWatchTime || 0,
      playCount: playerStats?.playCount || 0,
    }

    return NextResponse.json({
      stats,
      events: events.slice(0, 50),
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
