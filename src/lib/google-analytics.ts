import { prisma } from "@/lib/db"

interface GAEventData {
  event: string
  installation: {
    id: string
    domain: string
    platform: string
  }
  data: Record<string, unknown>
}

interface GAEventParams {
  site_id: string
  video_id?: string
  platform?: string
  domain?: string
  [key: string]: unknown
}

export async function dispatchToGoogleAnalytics(
  userId: string,
  eventName: string,
  eventData: GAEventData
) {
  try {
    const gaConfig = await prisma.googleAnalytics.findUnique({
      where: { userId },
    })

    if (!gaConfig || !gaConfig.enabled) {
      return
    }

    const params: GAEventParams = {
      site_id: eventData.installation.id,
    }

    if (eventData.data.youtubeVideoId) {
      params.video_id = eventData.data.youtubeVideoId as string
    }

    if (eventData.data.progress !== undefined) {
      params.progress = eventData.data.progress as number
    }

    if (eventData.installation.platform) {
      params.platform = eventData.installation.platform
    }

    if (eventData.installation.domain) {
      params.domain = eventData.installation.domain
    }

    Object.entries(eventData.data).forEach(([key, value]) => {
      if (!["youtubeVideoId", "youtubeUrl", "progress", "currentTime", "duration"].includes(key)) {
        params[key] = value as string
      }
    })

    const payload = {
      client_id: eventData.installation.id,
      events: [
        {
          name: eventName,
          params,
        },
      ],
    }

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${gaConfig.measurementId}&api_secret=${gaConfig.apiSecret}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error("GA4 request failed:", response.status)
    }
  } catch (error) {
    console.error("Error dispatching to Google Analytics:", error)
  }
}

export async function testGoogleAnalyticsConnection(
  measurementId: string,
  apiSecret: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      client_id: "test-client-" + Date.now(),
      events: [
        {
          name: "test_event",
          params: {
            site_id: "test",
            test: true,
          },
        },
      ],
    }

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      return { success: true }
    } else {
      const text = await response.text()
      return { success: false, error: `GA4 Error: ${response.status} - ${text}` }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Connection failed"
    return { success: false, error: message }
  }
}
