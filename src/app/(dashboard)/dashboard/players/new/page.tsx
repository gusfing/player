"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Play, Loader2 } from "lucide-react"

export default function NewPlayerPage() {
  const router = useRouter()
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const videoId = extractVideoId(youtubeUrl)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    if (!videoId) {
      setError("Invalid YouTube URL")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: playerName || `Player ${new Date().toLocaleDateString()}`,
          youtubeVideoId: videoId,
        }),
      })

      if (response.ok) {
        router.push("/dashboard/players")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create player")
      }
    } catch (err) {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
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
        <div>
          <h1 className="text-2xl font-bold">Create New Player</h1>
          <p className="text-gray-500 mt-1">Set up a new custom video player</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter your video details to create a player
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Player Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Product Demo Video"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Leave blank to auto-generate a name
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube Video URL</Label>
                <Input
                  id="youtube"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-500">
                  Paste any YouTube video URL to create a player
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Video Preview */}
              {videoId && (
                <div className="space-y-2">
                  <Label>Video Preview</Label>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <p className="text-sm text-green-600">
                    Video detected: {videoId}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Link href="/dashboard/players">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading || !videoId}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Create Player
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
