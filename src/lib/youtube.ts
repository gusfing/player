// YouTube URL and Video ID utilities

export interface YouTubeVideoInfo {
  videoId: string
  title: string
  thumbnailUrl: string
  duration?: number
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(input: string): string | null {
  // Clean up the input
  const trimmed = input.trim()

  // Direct video ID (11 characters, alphanumeric + -_)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  // Various URL patterns
  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/v/VIDEO_ID
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID (short URL)
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/shorts/VIDEO_ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // m.youtube.com/watch?v=VIDEO_ID (mobile)
    /m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // studio.youtube.com/video/VIDEO_ID/edit (YouTube Studio)
    /studio\.youtube\.com\/video\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * Validate YouTube video ID format
 */
export function isValidYouTubeVideoId(videoId: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
}

/**
 * Get thumbnail URL for a YouTube video
 */
export function getYouTubeThumbnail(videoId: string, quality: "default" | "medium" | "high" | "max" | "start" | "middle" | "end" = "max"): string {
  const qualities: Record<string, string> = {
    default: "default.jpg",
    medium: "mqdefault.jpg",
    high: "hqdefault.jpg",
    max: "maxresdefault.jpg",
    start: "sddefault.jpg",
    middle: "mqdefault.jpg",
    end: "hqdefault.jpg",
  }
  return `https://i.ytimg.com/vi/${videoId}/${qualities[quality]}`
}

/**
 * Fetch video info from YouTube oEmbed API
 */
export async function fetchYouTubeOEmbed(videoId: string): Promise<{ title: string; thumbnailUrl: string; authorName: string; authorUrl: string } | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to fetch YouTube oEmbed:", error)
    return null
  }
}

/**
 * Get video duration from YouTube Data API (requires API key)
 * Falls back to null if API key not available
 */
export async function fetchYouTubeDuration(videoId: string, apiKey: string): Promise<number | null> {
  if (!apiKey) {
    return null
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=contentDetails`
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    if (data.items && data.items.length > 0) {
      const duration = data.items[0].contentDetails.duration
      // Parse ISO 8601 duration (e.g., PT5M30S) to seconds
      return parseDuration(duration)
    }

    return null
  } catch (error) {
    console.error("Failed to fetch YouTube duration:", error)
    return null
  }
}

/**
 * Parse ISO 8601 duration to seconds
 * Examples: PT5M30S -> 330, PT1H2M30S -> 3750
 */
export function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || "0", 10)
  const minutes = parseInt(match[2] || "0", 10)
  const seconds = parseInt(match[3] || "0", 10)

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Format duration in seconds to MM:SS or H:MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`
}

/**
 * Import video from YouTube URL or video ID
 * Returns video metadata if successful
 */
export async function importYouTubeVideo(input: string, apiKey?: string): Promise<YouTubeVideoInfo | null> {
  const videoId = extractYouTubeVideoId(input)

  if (!videoId) {
    return null
  }

  // Fetch title and thumbnail from oEmbed
  const oembed = await fetchYouTubeOEmbed(videoId)

  if (!oembed) {
    // Fallback with just the video ID
    return {
      videoId,
      title: `YouTube Video ${videoId}`,
      thumbnailUrl: getYouTubeThumbnail(videoId, "high"),
    }
  }

  // Try to get duration if API key available
  const duration = apiKey ? await fetchYouTubeDuration(videoId, apiKey) : null

  return {
    videoId,
    title: oembed.title,
    thumbnailUrl: oembed.thumbnailUrl,
    duration: duration ?? undefined,
  }
}