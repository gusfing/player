import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")
    const period = days === 7 ? "7d" : days === 90 ? "90d" : "30d"

    const installation = await prisma.installation.findUnique({
      where: { id },
    })

    if (!installation) {
      return NextResponse.json({ error: "Installation not found" }, { status: 404 })
    }

    if (installation.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [analytics, leads, topVideos] = await Promise.all([
      prisma.siteAnalytics.groupBy({
        by: ["eventType"],
        where: {
          installationId: id,
          createdAt: { gte: startDate },
        },
        _count: { eventType: true },
      }),
      prisma.leadCapture.findMany({
        where: {
          installationId: id,
          createdAt: { gte: startDate },
        },
        select: {
          id: true,
          email: true,
          submissionCount: true,
          createdAt: true,
        },
        orderBy: { submissionCount: "desc" },
        take: 10,
      }),
      prisma.siteAnalytics.groupBy({
        by: ["youtubeVideoId"],
        where: {
          installationId: id,
          youtubeVideoId: { not: null },
          eventType: "video_played",
          createdAt: { gte: startDate },
        },
        _count: { youtubeVideoId: true },
        orderBy: { _count: { youtubeVideoId: "desc" } },
        take: 5,
      }),
    ])

    const dailyAnalytics = await prisma.$queryRaw<{ date: string; plays: bigint; leads: bigint }[]>`
      SELECT 
        DATE(e.created_at) as date,
        COUNT(*) FILTER (WHERE e.event_type = 'video_played') as plays,
        COUNT(*) FILTER (WHERE e.event_type = 'lead_captured') as leads
      FROM site_analytics e
      WHERE e.installation_id = ${id}
        AND e.created_at >= ${startDate}
      GROUP BY DATE(e.created_at)
      ORDER BY date ASC
    `

    const totalPlays = analytics
      .filter((a) => a.eventType === "video_played")
      .reduce((sum, a) => sum + a._count.eventType, 0)

    const totalLeads = analytics
      .filter((a) => a.eventType === "lead_captured")
      .reduce((sum, a) => sum + a._count.eventType, 0)

    const totalCtaClicks = analytics
      .filter((a) => a.eventType === "cta_clicked")
      .reduce((sum, a) => sum + a._count.eventType, 0)

    const conversionRate = totalPlays > 0 ? (totalLeads / totalPlays) * 100 : 0

    const playsByDay = dailyAnalytics.map((d) => ({
      date: d.date,
      plays: Number(d.plays),
      leads: Number(d.leads),
    }))

    const topVideoIds = topVideos.map((v) => v.youtubeVideoId)

    return NextResponse.json({
      summary: {
        totalPlays,
        totalLeads,
        totalCtaClicks,
        conversionRate: Math.round(conversionRate * 100) / 100,
        hotLeads: leads.filter((l) => l.submissionCount >= 2).length,
      },
      period,
      days,
      playsByDay,
      topVideos: topVideos.map((v) => ({
        videoId: v.youtubeVideoId,
        plays: v._count.youtubeVideoId,
      })),
      recentLeads: leads.slice(0, 10),
    })
  } catch (error) {
    console.error("Error fetching installation analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
