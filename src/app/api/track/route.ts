import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { dispatchToWebhooks } from "@/lib/webhook"
import { dispatchToGoogleAnalytics } from "@/lib/google-analytics"
import { publicRateLimit, getClientIP } from "@/lib/rate-limit"
import { getCorsHeaders } from "@/lib/cors"

const EVENT_MAPPING: Record<string, string> = {
  play: "video_played",
  watched_25s: "video_progress",
  watched_50s: "video_progress",
  watched_75s: "video_progress",
  watched_100s: "video_completed",
  complete: "video_completed",
  video_played: "video_played",
  video_progress: "video_progress",
  video_completed: "video_completed",
  video_paused: "video_paused",
  video_session_ended: "video_session_ended",
  cta_clicked: "cta_clicked",
  lead_captured: "lead_captured",
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin")

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    },
  })
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request)
    const origin = request.headers.get("origin")

    if (publicRateLimit) {
      const { success, remaining, reset } = await publicRateLimit.limit(ip)

      if (!success) {
        const response = NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
        response.headers.set("X-RateLimit-Remaining", remaining.toString())
        response.headers.set("X-RateLimit-Reset", reset.toString())
        response.headers.set("Access-Control-Allow-Origin", origin || "*")
        response.headers.set("Vary", "Origin")
        return response
      }
    }

    const body = await request.json()
    const { 
      installationId,
      siteId,
      event,
      eventType,
      videoId,
      youtubeVideoId,
      url,
      youtubeUrl,
      referrer,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      timestamp: _timestamp,
      watchedTime,
      currentTime,
      duration,
      watchPercent,
      ipHash,
      userAgent,
      deviceType,
      country,
      utmSource,
      utmMedium,
      utmCampaign,
    } = body

    const rawEvent = event || eventType
    const normalizedEvent = EVENT_MAPPING[rawEvent] || rawEvent
    const finalVideoId = videoId || youtubeVideoId
    const finalInstallationId = installationId || siteId

    if (!finalInstallationId || !rawEvent) {
      const response = NextResponse.json({ error: "Installation ID and event type required" }, { status: 400 })
      response.headers.set("Access-Control-Allow-Origin", origin || "*")
      response.headers.set("Vary", "Origin")
      return response
    }

    const installation = await prisma.installation.findUnique({
      where: { id: finalInstallationId },
    })

    if (!installation) {
      const response = NextResponse.json({ error: "Installation not found" }, { status: 404 })
      response.headers.set("Access-Control-Allow-Origin", origin || "*")
      response.headers.set("Vary", "Origin")
      return response
    }

    if (installation.status === "deleted") {
      const response = NextResponse.json({ error: "Installation has been deleted" }, { status: 410 })
      response.headers.set("Access-Control-Allow-Origin", origin || "*")
      response.headers.set("Vary", "Origin")
      return response
    }

    const analyticsEvent = await prisma.siteAnalytics.create({
      data: {
        installationId: finalInstallationId,
        eventType: normalizedEvent,
        youtubeVideoId: finalVideoId,
        youtubeUrl: url || youtubeUrl,
        currentTime: currentTime || watchedTime,
        duration,
        watchPercent,
        referrer,
        ipHash,
        userAgent,
        deviceType,
        country,
        utmSource,
        utmMedium,
        utmCampaign,
      },
    })

    if (normalizedEvent === "video_played") {
      await prisma.installation.update({
        where: { id: finalInstallationId },
        data: {
          totalPlays: { increment: 1 },
          totalViews: { increment: 1 },
          lastActivityAt: new Date(),
        },
      })
    } else {
      await prisma.installation.update({
        where: { id: finalInstallationId },
        data: {
          lastActivityAt: new Date(),
        },
      })
    }

    dispatchToWebhooks(finalInstallationId, normalizedEvent, {
      video_id: finalVideoId,
      url: url || youtubeUrl,
      referrer,
      watch_time: currentTime || watchedTime,
      duration,
      watch_percent: watchPercent,
    })

    dispatchToGoogleAnalytics(installation.userId, normalizedEvent, {
      event: normalizedEvent,
      installation: {
        id: installation.id,
        domain: installation.domain,
        platform: installation.platform,
      },
      data: {
        youtubeVideoId: finalVideoId,
        url: url || youtubeUrl,
        progress: watchPercent,
        watch_time: currentTime || watchedTime,
        duration,
      },
    })

    const response = NextResponse.json({ success: true, eventId: analyticsEvent.id })
    
    // Add CORS headers
    const corsHeaders = await getCorsHeaders(finalInstallationId)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    response.headers.set("Vary", "Origin")

    return response
  } catch (error) {
    console.error("Error tracking event:", error)
    const response = NextResponse.json({ error: "Failed to track event" }, { status: 500 })
    const origin = request.headers.get("origin")
    response.headers.set("Access-Control-Allow-Origin", origin || "*")
    response.headers.set("Vary", "Origin")
    return response
  }
}

export async function GET(request: Request) {
  try {
    const origin = request.headers.get("origin")
    const { searchParams } = new URL(request.url)
    const installationId = searchParams.get("installationId") || searchParams.get("siteId")
    const period = searchParams.get("period") || "30d"

    if (!installationId) {
      const response = NextResponse.json({ error: "Installation ID required" }, { status: 400 })
      response.headers.set("Access-Control-Allow-Origin", origin || "*")
      response.headers.set("Vary", "Origin")
      return response
    }

    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const [events, installation] = await Promise.all([
      prisma.siteAnalytics.findMany({
        where: {
          installationId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.installation.findUnique({
        where: { id: installationId },
        select: {
          totalPlays: true,
          totalViews: true,
        },
      }),
    ])

    const stats = {
      totalPlays: installation?.totalPlays || 0,
      totalViews: installation?.totalViews || 0,
      totalEvents: events.length,
      playsByDay: aggregateByDay(events.filter(e => e.eventType === "video_played")),
      devices: aggregateByDevice(events),
    }

    const response = NextResponse.json({ stats, events: events.slice(0, 100) })
    
    // Add CORS headers
    const corsHeaders = await getCorsHeaders(installationId)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    response.headers.set("Vary", "Origin")

    return response
  } catch (error) {
    console.error("Error fetching analytics:", error)
    const response = NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
    const origin = request.headers.get("origin")
    response.headers.set("Access-Control-Allow-Origin", origin || "*")
    response.headers.set("Vary", "Origin")
    return response
  }
}

function aggregateByDay(events: { createdAt: Date }[]) {
  const byDay: Record<string, number> = {}
  events.forEach(event => {
    const day = event.createdAt.toISOString().split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1
  })
  return byDay
}

function aggregateByDevice(events: { deviceType: string | null }[]) {
  const devices: Record<string, number> = {}
  events.forEach(event => {
    if (event.deviceType) {
      devices[event.deviceType] = (devices[event.deviceType] || 0) + 1
    }
  })
  return devices
}
