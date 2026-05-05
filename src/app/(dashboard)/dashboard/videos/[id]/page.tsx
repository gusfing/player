"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, Save, Play, Settings, Mail, BarChart3, Share2 } from "lucide-react"

// Client-safe formatters
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00"
  const total = Math.floor(seconds)
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0")
}

function getYouTubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
import { generateEmbed, generateScriptSnippet, allPlatforms, platformCategories } from "@/lib/embed-generator"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface Video {
  id: string
  youtubeVideoId: string
  title: string
  thumbnailUrl: string | null
  customThumbnailUrl: string | null
  duration: number | null
  folderId: string | null
  folder: { id: string; name: string; color: string } | null
  tags: string[]
  playerConfig: PlayerConfig
  gateConfig: GateConfig | null
  totalViews: number
  totalLeads: number
  retentionData: RetentionData | null
  createdAt: string
}

interface PlayerConfig {
  playerShape?: "square" | "rounded"
  playButtonColor?: string
  progressBarColor?: string
  hoverColor?: string
  topBarText?: string
  showTopBar?: boolean
  hideYoutubeUI?: boolean
  disableKeyboard?: boolean
  autoplay?: boolean
  pauseOnScroll?: boolean
}

interface GateConfig {
  type: "none" | "timestamp" | "pre" | "post"
  mode: "hard" | "soft"
  timestamp?: number
  headline?: string
  description?: string
  buttonText?: string
  thankYouMessage?: string
  ctaUrl?: string
  ctaText?: string
}

interface RetentionData {
  data: { time: number; retention: number }[]
  dropOffPoints: number[]
}

export default function VideoEditorPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.id as string

  const [video, setVideo] = useState<Video | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("studio")

  // Player Config
  const [playerConfig, setPlayerConfig] = useState<PlayerConfig>({
    playerShape: "square",
    playButtonColor: "#ef4444",
    progressBarColor: "#ef4444",
    hoverColor: "#dc2626",
    topBarText: "Shrazen Player",
    showTopBar: true,
    hideYoutubeUI: true,
    disableKeyboard: false,
    autoplay: false,
    pauseOnScroll: false,
  })

  // Gate Config
  const [gateConfig, setGateConfig] = useState<GateConfig>({
    type: "none",
    mode: "soft",
    timestamp: 0,
    headline: "Unlock this content",
    description: "Enter your email to continue watching",
    buttonText: "Continue",
    thankYouMessage: "Thanks! You can now watch the full video.",
    ctaUrl: "",
    ctaText: "Book a Call",
  })

  // Publishing
  const [selectedPlatform, setSelectedPlatform] = useState<string>("generic")
  const [embedWidth, setEmbedWidth] = useState<number>(800)
  const [embedHeight, setEmbedHeight] = useState<number>(450)
  const [isResponsive, setIsResponsive] = useState(true)

  // Retention data for chart
  const [retentionChartData, setRetentionChartData] = useState<{ time: string; retention: number }[]>([])

  useEffect(() => {
    if (videoId) {
      fetchVideo()
    }
  }, [videoId])

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/videos/${videoId}`)
      if (response.ok) {
        const data = await response.json()
        setVideo(data)
        if (data.playerConfig) {
          setPlayerConfig({ ...playerConfig, ...data.playerConfig })
        }
        if (data.gateConfig) {
          setGateConfig({ ...gateConfig, ...data.gateConfig })
        }
        // Generate sample retention data if none exists
        if (data.retentionData) {
          setRetentionChartData(data.retentionData.data.map((d: { time: number; retention: number }) => ({
            time: `${Math.round(d.time)}s`,
            retention: d.retention,
          })))
        } else {
          // Generate sample retention curve
          const sampleData = generateSampleRetentionData(data.duration || 300)
          setRetentionChartData(sampleData)
        }
      }
    } catch (err) {
      console.error("Failed to fetch video:", err)
    } finally {
      setIsLoading(false)
    }
  }

  function generateSampleRetentionData(duration: number) {
    const data = []
    const checkpoints = [0, 25, 50, 75, 100]
    let retention = 100
    for (const pct of checkpoints) {
      const time = (pct / 100) * duration
      if (pct === 25) retention = 78
      if (pct === 50) retention = 62
      if (pct === 75) retention = 45
      if (pct === 100) retention = 32
      data.push({
        time: `${Math.round(time)}s (${pct}%)`,
        retention,
      })
    }
    return data
  }

  const saveVideo = async () => {
    if (!video) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerConfig,
          gateConfig,
        }),
      })

      if (response.ok) {
        fetchVideo()
      }
    } catch (err) {
      console.error("Failed to save video:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const getEmbedCode = useCallback(() => {
    if (!video) return ""
    const embed = generateEmbed(selectedPlatform as any, {
      installationId: videoId,
      width: embedWidth,
      height: embedHeight,
      responsive: isResponsive,
    })
    return embed.code
  }, [selectedPlatform, videoId, embedWidth, embedHeight, isResponsive, video])

  const getDirectUrl = useCallback(() => {
    return `${process.env.NEXT_PUBLIC_APP_URL || "https://player.shrazen.com"}/v/${videoId}`
  }, [videoId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!video) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500">Video not found</p>
            <Button variant="outline" onClick={() => router.push("/dashboard/videos")} className="mt-4">
              Back to Videos
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/videos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold line-clamp-1">{video.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{formatDuration(video.duration || 0)}</Badge>
              <Badge variant="outline">{video.totalViews} views</Badge>
              <Badge variant="outline">{video.totalLeads} leads</Badge>
            </div>
          </div>
          <Button onClick={saveVideo} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="p-6">
          <TabsList className="mb-6">
            <TabsTrigger value="studio">
              <Settings className="mr-2 h-4 w-4" /> Player Studio
            </TabsTrigger>
            <TabsTrigger value="gate">
              <Mail className="mr-2 h-4 w-4" /> Lead Gate
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="publish">
              <Share2 className="mr-2 h-4 w-4" /> Publish
            </TabsTrigger>
          </TabsList>

          {/* Player Studio Tab */}
          <TabsContent value="studio">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Config Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Player Settings</CardTitle>
                  <CardDescription>Customize the video player appearance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Player Shape */}
                  <div className="space-y-2">
                    <Label>Player Shape</Label>
                    <Select
                      value={playerConfig.playerShape}
                      onValueChange={(v) => setPlayerConfig({ ...playerConfig, playerShape: v as "square" | "rounded" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Strictly Square</SelectItem>
                        <SelectItem value="rounded">Rounded Corners</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Play Button Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={playerConfig.playButtonColor}
                          onChange={(e) => setPlayerConfig({ ...playerConfig, playButtonColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={playerConfig.playButtonColor}
                          onChange={(e) => setPlayerConfig({ ...playerConfig, playButtonColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Progress Bar Color</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={playerConfig.progressBarColor}
                          onChange={(e) => setPlayerConfig({ ...playerConfig, progressBarColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <Input
                          value={playerConfig.progressBarColor}
                          onChange={(e) => setPlayerConfig({ ...playerConfig, progressBarColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Top Bar */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Top Bar</Label>
                        <p className="text-sm text-gray-500">Display company name above the video</p>
                      </div>
                      <Switch
                        checked={playerConfig.showTopBar}
                        onCheckedChange={(v) => setPlayerConfig({ ...playerConfig, showTopBar: v })}
                      />
                    </div>
                    {playerConfig.showTopBar && (
                      <Input
                        value={playerConfig.topBarText}
                        onChange={(e) => setPlayerConfig({ ...playerConfig, topBarText: e.target.value })}
                        placeholder="Company Name"
                      />
                    )}
                  </div>

                  <Separator />

                  {/* Viewer Controls */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Viewer Controls</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Hide YouTube UI</Label>
                        <Switch
                          checked={playerConfig.hideYoutubeUI}
                          onCheckedChange={(v) => setPlayerConfig({ ...playerConfig, hideYoutubeUI: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Disable Keyboard Controls</Label>
                        <Switch
                          checked={playerConfig.disableKeyboard}
                          onCheckedChange={(v) => setPlayerConfig({ ...playerConfig, disableKeyboard: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Smart Autoplay (Muted)</Label>
                        <Switch
                          checked={playerConfig.autoplay}
                          onCheckedChange={(v) => setPlayerConfig({ ...playerConfig, autoplay: v })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Pause on Scroll</Label>
                        <Switch
                          checked={playerConfig.pauseOnScroll}
                          onCheckedChange={(v) => setPlayerConfig({ ...playerConfig, pauseOnScroll: v })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Live Preview</CardTitle>
                  <CardDescription>See how your player will look</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="relative bg-black rounded overflow-hidden"
                    style={{ aspectRatio: "16/9", borderRadius: playerConfig.playerShape === "rounded" ? "12px" : "0" }}
                  >
                    <img
                      src={video.customThumbnailUrl || video.thumbnailUrl || getYouTubeThumbnail(video.youtubeVideoId)}
                      alt={video.title}
                      className="w-full h-full object-cover opacity-50"
                    />
                    {/* Mock play button */}
                    <div
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: playerConfig.playButtonColor + "cc" }}
                    >
                      <Play className="w-8 h-8 text-white ml-1" fill="white" />
                    </div>
                    {/* Mock top bar */}
                    {playerConfig.showTopBar && (
                      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: playerConfig.playButtonColor + "cc", color: "white" }}
                        >
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          {playerConfig.topBarText}
                        </span>
                      </div>
                    )}
                    {/* Mock progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="h-1 bg-white/30 rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{ width: "40%", backgroundColor: playerConfig.progressBarColor }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Preview shows basic layout. Actual player may vary.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Lead Gate Tab */}
          <TabsContent value="gate">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gate Settings</CardTitle>
                  <CardDescription>Configure when to show the lead capture form</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Gate Type */}
                  <div className="space-y-2">
                    <Label>Gate Type</Label>
                    <Select
                      value={gateConfig.type}
                      onValueChange={(v) => setGateConfig({ ...gateConfig, type: v as GateConfig["type"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Gate</SelectItem>
                        <SelectItem value="pre">Pre-Roll Gate</SelectItem>
                        <SelectItem value="timestamp">Timestamp Lock</SelectItem>
                        <SelectItem value="post">Post-Roll CTA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Gate Mode */}
                  {gateConfig.type !== "none" && (
                    <div className="space-y-2">
                      <Label>Gate Mode</Label>
                      <Select
                        value={gateConfig.mode}
                        onValueChange={(v) => setGateConfig({ ...gateConfig, mode: v as GateConfig["mode"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soft">Soft Gate (Skip option)</SelectItem>
                          <SelectItem value="hard">Hard Gate (Must enter email)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Timestamp */}
                  {gateConfig.type === "timestamp" && (
                    <div className="space-y-2">
                      <Label>Lock Timestamp (seconds)</Label>
                      <Input
                        type="number"
                        value={gateConfig.timestamp}
                        onChange={(e) => setGateConfig({ ...gateConfig, timestamp: parseInt(e.target.value) || 0 })}
                        placeholder="e.g., 90 for 1:30"
                      />
                      <p className="text-sm text-gray-500">
                        Video will pause at this moment until email is captured
                      </p>
                    </div>
                  )}

                  <Separator />

                  {/* Form Customization */}
                  <div className="space-y-4">
                    <h3 className="font-medium">Form Content</h3>
                    <div className="space-y-2">
                      <Label>Headline</Label>
                      <Input
                        value={gateConfig.headline}
                        onChange={(e) => setGateConfig({ ...gateConfig, headline: e.target.value })}
                        placeholder="Unlock this content"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={gateConfig.description}
                        onChange={(e) => setGateConfig({ ...gateConfig, description: e.target.value })}
                        placeholder="Enter your email to continue watching"
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button Text</Label>
                      <Input
                        value={gateConfig.buttonText}
                        onChange={(e) => setGateConfig({ ...gateConfig, buttonText: e.target.value })}
                        placeholder="Continue"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Thank You Message</Label>
                      <Textarea
                        value={gateConfig.thankYouMessage}
                        onChange={(e) => setGateConfig({ ...gateConfig, thankYouMessage: e.target.value })}
                        placeholder="Thanks! You can now watch the full video."
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Post-Roll CTA */}
                  {gateConfig.type === "post" && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h3 className="font-medium">Post-Roll CTA Button</h3>
                        <div className="space-y-2">
                          <Label>Button Text</Label>
                          <Input
                            value={gateConfig.ctaText}
                            onChange={(e) => setGateConfig({ ...gateConfig, ctaText: e.target.value })}
                            placeholder="Book a Call"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Button URL</Label>
                          <Input
                            value={gateConfig.ctaUrl}
                            onChange={(e) => setGateConfig({ ...gateConfig, ctaUrl: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Form Preview</CardTitle>
                  <CardDescription>Preview of the lead capture form</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-6">
                    {gateConfig.type === "none" ? (
                      <div className="text-center text-gray-500 py-8">
                        <p>No gate configured</p>
                        <p className="text-sm mt-2">Select a gate type to see the form preview</p>
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="font-bold text-lg mb-2">{gateConfig.headline}</h3>
                        <p className="text-gray-600 text-sm mb-4">{gateConfig.description}</p>
                        <div className="space-y-3">
                          <Input type="email" placeholder="Enter your email" />
                          <Button className="w-full" style={{ backgroundColor: playerConfig.playButtonColor }}>
                            {gateConfig.buttonText}
                          </Button>
                          {gateConfig.mode === "soft" && (
                            <Button variant="ghost" className="w-full text-sm text-gray-500">
                              Skip for now
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">
                          {gateConfig.thankYouMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{video.totalViews}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Leads Captured</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{video.totalLeads}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Avg. Retention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">54%</div>
                  <p className="text-sm text-gray-500">video completion</p>
                </CardContent>
              </Card>

              {/* Retention Heatmap */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Viewer Retention</CardTitle>
                  <CardDescription>See where viewers drop off or re-watch</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={retentionChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} unit="%" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="retention"
                          stroke={playerConfig.progressBarColor}
                          fill={playerConfig.progressBarColor + "40"}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">78%</div>
                      <div className="text-xs text-gray-500">at 25%</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">62%</div>
                      <div className="text-xs text-gray-500">at 50%</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">45%</div>
                      <div className="text-xs text-gray-500">at 75%</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold">32%</div>
                      <div className="text-xs text-gray-500">completion</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Publish Tab */}
          <TabsContent value="publish">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Selection</CardTitle>
                  <CardDescription>Choose where you're embedding this video</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Select Platform</Label>
                    <div className="space-y-2">
                      {Object.entries(platformCategories).map(([category, platforms]) => (
                        <div key={category}>
                          <h4 className="text-sm font-medium text-gray-500 mb-2 capitalize">{category}</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {platforms.map((p) => (
                              <Button
                                key={p}
                                variant={selectedPlatform === p ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedPlatform(p)}
                                className="justify-start"
                              >
                                {p === "generic" ? "Generic" : p.charAt(0).toUpperCase() + p.slice(1)}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Sizing */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Responsive</Label>
                        <p className="text-sm text-gray-500">Auto-scale to fit container</p>
                      </div>
                      <Switch checked={isResponsive} onCheckedChange={setIsResponsive} />
                    </div>
                    {!isResponsive && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Width (px)</Label>
                          <Input
                            type="number"
                            value={embedWidth}
                            onChange={(e) => setEmbedWidth(parseInt(e.target.value) || 800)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Height (px)</Label>
                          <Input
                            type="number"
                            value={embedHeight}
                            onChange={(e) => setEmbedHeight(parseInt(e.target.value) || 450)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Embed Code */}
              <Card>
                <CardHeader>
                  <CardTitle>Embed Code</CardTitle>
                  <CardDescription>Copy and paste this code into your platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Direct URL (for Skool/Circle) */}
                  {(selectedPlatform === "skool" || selectedPlatform === "circle" || selectedPlatform === "mightynetworks") && (
                    <div className="space-y-2">
                      <Label>Direct URL (auto-embeds)</Label>
                      <div className="flex gap-2">
                        <Input value={getDirectUrl()} readOnly className="font-mono text-sm" />
                        <Button
                          variant="outline"
                          onClick={() => navigator.clipboard.writeText(getDirectUrl())}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* HTML Embed */}
                  <div className="space-y-2">
                    <Label>HTML Embed Code</Label>
                    <Textarea
                      value={getEmbedCode()}
                      readOnly
                      className="font-mono text-sm h-32"
                    />
                    <Button
                      className="w-full"
                      onClick={() => navigator.clipboard.writeText(getEmbedCode())}
                    >
                      Copy Embed Code
                    </Button>
                  </div>

                  {/* JavaScript Snippet */}
                  <div className="space-y-2">
                    <Label>JavaScript Snippet (Advanced)</Label>
                    <Textarea
                      value={generateScriptSnippet(videoId)}
                      readOnly
                      className="font-mono text-sm h-20"
                    />
                    <p className="text-xs text-gray-500">
                      Enables advanced features like pause-on-scroll
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}