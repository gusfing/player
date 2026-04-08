"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Copy, Check, Loader2, Play, Save } from "lucide-react"

interface Player {
  id: string
  name: string
  youtubeVideoId: string
  brandingConfig: any
  ctaConfig: any
  isInstalled: boolean
  playCount: number
  _count: {
    analytics: number
    ctaClicks: number
  }
}

export default function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    youtubeVideoId: "",
    buttonColor: "#FF0000",
    progressColor: "#FF0000",
  })

  useEffect(() => {
    fetchPlayer()
  }, [resolvedParams.id])

  const fetchPlayer = async () => {
    try {
      const response = await fetch(`/api/players/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setPlayer(data)
        setFormData({
          name: data.name,
          youtubeVideoId: data.youtubeVideoId,
          buttonColor: data.brandingConfig?.buttonColor || "#FF0000",
          progressColor: data.brandingConfig?.progressColor || "#FF0000",
        })
      } else if (response.status === 404) {
        router.push("/dashboard/players")
      }
    } catch (err) {
      console.error("Failed to fetch player:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!player) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/players/${player.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          youtubeVideoId: formData.youtubeVideoId,
          brandingConfig: {
            buttonColor: formData.buttonColor,
            progressColor: formData.progressColor,
          },
        }),
      })

      if (response.ok) {
        setPlayer({ ...player, ...formData })
      }
    } catch (err) {
      console.error("Failed to save player:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const copyEmbedCode = () => {
    if (!player) return
    const code = `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://shrazen.com'}/player.min.js" data-player-id="${player.id}"></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!player) {
    return null
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/players">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{player.name}</h1>
          <p className="text-gray-500 mt-1">Edit player settings</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="settings">
            <TabsList className="mb-6">
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="embed">Embed</TabsTrigger>
            </TabsList>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Player Settings</CardTitle>
                  <CardDescription>
                    Basic information about your player
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Player Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube Video ID</Label>
                    <Input
                      value={formData.youtubeVideoId}
                      onChange={(e) => setFormData({ ...formData, youtubeVideoId: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>
                    Customize player appearance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Button Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.buttonColor}
                          onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.buttonColor}
                          onChange={(e) => setFormData({ ...formData, buttonColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Progress Bar Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={formData.progressColor}
                          onChange={(e) => setFormData({ ...formData, progressColor: e.target.value })}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={formData.progressColor}
                          onChange={(e) => setFormData({ ...formData, progressColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="embed">
              <Card>
                <CardHeader>
                  <CardTitle>Embed Code</CardTitle>
                  <CardDescription>
                    Add this code to your website to display the player
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                    <code className="text-green-400 break-all">
                      {`<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://shrazen.com'}/player.min.js" data-player-id="${player.id}"></script>`}
                    </code>
                  </div>
                  <Button onClick={copyEmbedCode}>
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                  <div className="text-sm text-gray-500">
                    <p className="font-medium mb-2">Installation steps:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Copy the embed code above</li>
                      <li>Paste it before the closing `&lt;/body&gt;` tag on your website</li>
                      <li>All YouTube embeds will be automatically replaced</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Plays</span>
                <span className="font-semibold">{player.playCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Events Tracked</span>
                <span className="font-semibold">{player._count.analytics}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">CTA Clicks</span>
                <span className="font-semibold">{player._count.ctaClicks}</span>
              </div>
              <div className="pt-4 border-t">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  player.isInstalled 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {player.isInstalled ? 'Installed' : 'Not installed'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Video Preview */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${player.youtubeVideoId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
