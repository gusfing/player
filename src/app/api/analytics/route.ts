import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getActiveUser } from "@/lib/mock-auth"

async function getOrCreateUser(user: any): Promise<{ id: string }> {
  const userEmail = user.emailAddresses[0]?.emailAddress
  if (!userEmail) {
    throw new Error("No email found")
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (dbUser) {
    return dbUser
  }

  return prisma.user.create({
    data: {
      clerkId: user.id,
      email: userEmail,
    },
  })
}

export async function GET() {
  try {
    const user = await getActiveUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await getOrCreateUser(user)

    const installations = await prisma.installation.findMany({
      where: { userId: dbUser.id },
      select: { id: true, totalPlays: true, totalViews: true, domain: true },
    })

    const installationIds = installations.map((i) => i.id)

    const [totalPlays, totalViews, events, leads] = await Promise.all([
      prisma.installation.aggregate({
        where: { userId: dbUser.id },
        _sum: { totalPlays: true },
      }),
      prisma.installation.aggregate({
        where: { userId: dbUser.id },
        _sum: { totalViews: true },
      }),
      prisma.siteAnalytics.findMany({
        where: { installationId: { in: installationIds } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.leadCapture.count({
        where: { userId: dbUser.id },
      }),
    ])

    const eventBreakdown: Record<string, number> = {}
    events.forEach((e) => {
      eventBreakdown[e.eventType] = (eventBreakdown[e.eventType] || 0) + 1
    })

    const videoCounts: Record<string, number> = {}
    events
      .filter((e) => e.youtubeVideoId && e.youtubeVideoId !== null)
      .forEach((e) => {
        const videoId = e.youtubeVideoId as string
        videoCounts[videoId] = (videoCounts[videoId] || 0) + 1
      })

    const topVideos = Object.entries(videoCounts)
      .map(([videoId, count]) => ({ videoId, count }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      totalViews: totalViews._sum.totalViews || 0,
      totalPlays: totalPlays._sum.totalPlays || 0,
      totalEvents: events.length,
      leadsCount: leads || 0,
      topVideos,
      recentEvents: events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        youtubeVideoId: e.youtubeVideoId,
        createdAt: e.createdAt.toISOString(),
        referrer: e.referrer,
      })),
      eventBreakdown,
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
