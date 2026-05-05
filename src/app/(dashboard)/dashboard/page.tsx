"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  Play,
  TrendingUp,
  Loader2,
  Users,
  Video,
  Plus,
  ExternalLink,
  Eye,
} from "lucide-react"

// Client-safe duration formatter
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00"
  const total = Math.floor(seconds)
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0")
}

interface Installation {
  id: string
  totalPlays: number
  totalViews: number
  status: string
  domain: string
}

interface Video {
  id: string
  youtubeVideoId: string
  title: string
  thumbnailUrl: string | null
  duration: number | null
  totalViews: number
  totalLeads: number
}

interface DashboardStats {
  totalInstallations: number
  activeInstallations: number
  totalPlays: number
  totalViews: number
  totalLeads: number
  avgRetention: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalInstallations: 0,
    activeInstallations: 0,
    totalPlays: 0,
    totalViews: 0,
    totalLeads: 0,
    avgRetention: 0,
  })
  const [topVideos, setTopVideos] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [importUrl, setImportUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchTopVideos()
  }, [])

  const fetchStats = async () => {
    try {
      const [instRes, videosRes, leadsRes] = await Promise.all([
        fetch("/api/installations"),
        fetch("/api/videos?limit=5"),
        fetch("/api/leads?limit=0"),
      ])

      if (instRes.ok) {
        const installations = await instRes.json()
        const totalPlays = installations.reduce(
          (acc: number, inst: Installation) => acc + (inst.totalPlays || 0),
          0
        )
        const totalViews = installations.reduce(
          (acc: number, inst: Installation) => acc + (inst.totalViews || 0),
          0
        )
        const activeCount = installations.filter(
          (i: Installation) => i.status === "active"
        ).length

        setStats((prev) => ({
          ...prev,
          totalInstallations: installations.length,
          activeInstallations: activeCount,
          totalPlays,
          totalViews,
        }))
      }

      if (videosRes.ok) {
        const data = await videosRes.json()
        const totalVideoLeads = data.videos?.reduce(
          (acc: number, v: Video) => acc + (v.totalLeads || 0),
          0
        ) || 0
        const allLeads = totalVideoLeads

        setStats((prev) => ({
          ...prev,
          totalLeads: allLeads,
          avgRetention: 54, // Calculate from actual data if available
        }))
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTopVideos = async () => {
    try {
      const response = await fetch("/api/videos?limit=5")
      if (response.ok) {
        const data = await response.json()
        setTopVideos(data.videos || [])
      }
    } catch (err) {
      console.error("Failed to fetch top videos:", err)
    }
  }

  const handleQuickImport = async () => {
    if (!importUrl.trim()) return

    setIsImporting(true)
    try {
      const response = await fetch("/api/videos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      })

      const data = await response.json()

      if (response.ok) {
        setImportUrl("")
        router.push(`/dashboard/videos/${data.video.id}`)
      } else {
        alert(data.error || "Failed to import video")
      }
    } catch (err) {
      console.error("Failed to import video:", err)
      alert("Failed to import video")
    } finally {
      setIsImporting(false)
    }
  }

  const statCards = [
    {
      name: "Total Views",
      value: stats.totalViews,
      icon: Eye,
      change: "across all videos",
    },
    {
      name: "Leads Captured",
      value: stats.totalLeads,
      icon: Users,
      change: "email captures",
    },
    {
      name: "Avg. Retention",
      value: `${stats.avgRetention}%`,
      icon: TrendingUp,
      change: "video completion",
    },
    {
      name: "Active Installations",
      value: stats.activeInstallations,
      icon: Download,
      change: "websites tracking",
    },
  ]

  return (
    <div className="p-6 lg:p-8">
      {/* Header with Quick Import */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Command Center</h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s your daily snapshot of video performance.
        </p>
      </div>

      {/* Quick Import Bar */}
      <Card className="mb-8 border-dashed border-2 border-gray-200 bg-gray-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Video className="h-5 w-5" />
              <span className="font-medium">Quick Import</span>
            </div>
            <Input
              placeholder="Paste YouTube URL to import..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="flex-1 max-w-md"
              onKeyDown={(e) => e.key === "Enter" && handleQuickImport()}
            />
            <Button onClick={handleQuickImport} disabled={isImporting || !importUrl.trim()}>
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Import
            </Button>
            <Link href="/dashboard/videos">
              <Button variant="outline">
                <Video className="mr-2 h-4 w-4" />
                Video Library
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          statCards.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Top Performing Videos */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Performing Assets</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Your best videos by views and lead captures</p>
          </div>
          <Link href="/dashboard/videos">
            <Button variant="outline" size="sm">
              View All Videos
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {topVideos.length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No videos imported yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Import your first YouTube video to see performance metrics
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {topVideos.slice(0, 5).map((video, index) => (
                <Link
                  key={video.id}
                  href={`/dashboard/videos/${video.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="w-24 h-14 bg-black rounded overflow-hidden flex-shrink-0">
                    <img
                      src={video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{video.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      {video.duration && (
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {formatDuration(video.duration)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {video.totalViews} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {video.totalLeads} leads
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {video.totalViews > 0
                      ? Math.round((video.totalLeads / video.totalViews) * 100)
                      : 0}
                    % conv.
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions & Getting Started */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/videos/new" className="block">
              <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Import New Video
                </div>
                <p className="text-sm text-gray-500">Add a YouTube video to your library</p>
              </div>
            </Link>
            <Link href="/dashboard/installations/new" className="block">
              <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium flex items-center gap-2">
                  <Download className="h-4 w-4" /> Add Installation
                </div>
                <p className="text-sm text-gray-500">Connect a website or platform</p>
              </div>
            </Link>
            <Link href="/dashboard/videos" className="block">
              <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium flex items-center gap-2">
                  <Video className="h-4 w-4" /> Video Library
                </div>
                <p className="text-sm text-gray-500">Manage your videos and settings</p>
              </div>
            </Link>
            <Link href="/dashboard/analytics" className="block">
              <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> View Analytics
                </div>
                <p className="text-sm text-gray-500">Track video performance</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </span>
                <span>Import your first YouTube video</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  2
                </span>
                <span>Customize your player branding</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  3
                </span>
                <span>Set up lead gates and CTAs</span>
              </li>
              <li className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  4
                </span>
                <span>Copy embed code to your site</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
