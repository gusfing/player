"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart3, Users, TrendingUp, Eye, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface AnalyticsData {
  totalViews: number
  totalPlays: number
  totalEvents: number
  topVideos: { videoId: string; count: number }[]
  recentEvents: {
    id: string
    eventType: string
    youtubeVideoId: string
    createdAt: string
    referrer: string | null
  }[]
  eventBreakdown: Record<string, number>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics")
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const stats = data || {
    totalViews: 0,
    totalPlays: 0,
    totalEvents: 0,
    topVideos: [],
    recentEvents: [],
    eventBreakdown: {},
  }

  const getEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      play: "Play",
      pause: "Pause",
      complete: "Complete",
      watched_25s: "25% Watched",
      watched_50s: "50% Watched",
      watched_100s: "100% Watched",
      lead_captured: "Lead Captured",
    }
    return labels[event] || event
  }

  const getEventBadgeColor = (event: string) => {
    if (event === "play") return "bg-green-500"
    if (event === "complete" || event === "watched_100s") return "bg-blue-500"
    if (event === "lead_captured") return "bg-purple-500"
    return "bg-gray-500"
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-500 mt-1">Track your video performance and viewer engagement</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlays}</div>
            <p className="text-xs text-muted-foreground">Video plays</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground">All tracked events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Videos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topVideos.length}</div>
            <p className="text-xs text-muted-foreground">Unique videos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Captured</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventBreakdown.lead_captured || 0}</div>
            <p className="text-xs text-muted-foreground">Form submissions</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Videos */}
      {stats.topVideos.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Videos</CardTitle>
            <CardDescription>Most played videos across your sites</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Video ID</TableHead>
                  <TableHead>Plays</TableHead>
                  <TableHead>Preview</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topVideos.slice(0, 5).map((video) => (
                  <TableRow key={video.videoId}>
                    <TableCell className="font-mono text-sm">{video.videoId}</TableCell>
                    <TableCell>{video.count}</TableCell>
                    <TableCell>
                      <img
                        src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                        alt=""
                        className="w-24 h-auto rounded"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest viewer interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No activity yet. Embed your players to start tracking views.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Video</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentEvents.slice(0, 20).map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <Badge className={getEventBadgeColor(event.eventType)}>
                        {getEventLabel(event.eventType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {event.youtubeVideoId || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {event.referrer ? (
                        <a href={event.referrer} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {new URL(event.referrer).hostname}
                        </a>
                      ) : (
                        "Direct"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(event.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
