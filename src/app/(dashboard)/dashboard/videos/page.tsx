"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Search, Grid, List, FolderOpen, Video, MoreVertical, Trash2, Edit, ExternalLink } from "lucide-react"

// Client-safe duration formatter
function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00"
  const total = Math.floor(seconds)
  return Math.floor(total / 60) + ":" + String(total % 60).padStart(2, "0")
}

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
  playerConfig: Record<string, unknown>
  gateConfig: Record<string, unknown> | null
  totalViews: number
  totalLeads: number
  leadCount: number
  createdAt: string
}

interface Folder {
  id: string
  name: string
  color: string
  videoCount: number
}

export default function VideoLibraryPage() {
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [importUrl, setImportUrl] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set())
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  useEffect(() => {
    fetchVideos()
    fetchFolders()
  }, [selectedFolder, searchQuery])

  async function fetchVideos() {
    try {
      const params = new URLSearchParams()
      if (selectedFolder) params.set("folderId", selectedFolder)
      if (searchQuery) params.set("search", searchQuery)

      const response = await fetch(`/api/videos?${params}`)
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos)
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchFolders() {
    try {
      const response = await fetch("/api/videos/folders")
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders)
      }
    } catch (err) {
      console.error("Failed to fetch folders:", err)
    }
  }

  async function handleImport() {
    if (!importUrl.trim()) return

    setIsImporting(true)
    setImportError("")

    try {
      const response = await fetch("/api/videos/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      })

      const data = await response.json()

      if (response.ok) {
        setImportUrl("")
        setImportDialogOpen(false)
        fetchVideos()
        router.push(`/dashboard/videos/${data.video.id}`)
      } else {
        setImportError(data.error || "Failed to import video")
      }
    } catch (err) {
      setImportError("Failed to import video")
    } finally {
      setIsImporting(false)
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return

    setIsCreatingFolder(true)
    try {
      const response = await fetch("/api/videos/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      })

      if (response.ok) {
        setNewFolderName("")
        fetchFolders()
      }
    } catch (err) {
      console.error("Failed to create folder:", err)
    } finally {
      setIsCreatingFolder(false)
    }
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm("Delete this folder? Videos will be unassigned but not deleted.")) return

    try {
      await fetch(`/api/videos/folders?id=${id}`, { method: "DELETE" })
      if (selectedFolder === id) setSelectedFolder(null)
      fetchFolders()
      fetchVideos()
    } catch (err) {
      console.error("Failed to delete folder:", err)
    }
  }

  async function handleDeleteVideo(id: string) {
    if (!confirm("Delete this video?")) return

    try {
      await fetch(`/api/videos/${id}`, { method: "DELETE" })
      fetchVideos()
    } catch (err) {
      console.error("Failed to delete video:", err)
    }
  }

  function toggleVideoSelection(id: string) {
    const newSelected = new Set(selectedVideos)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedVideos(newSelected)
  }

  async function handleBulkAssignFolder(folderId: string) {
    try {
      await Promise.all(
        Array.from(selectedVideos).map((id) =>
          fetch(`/api/videos/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ folderId }),
          })
        )
      )
      setSelectedVideos(new Set())
      fetchVideos()
      fetchFolders()
    } catch (err) {
      console.error("Failed to bulk assign folder:", err)
    }
  }

  function getThumbnail(video: Video) {
    return video.customThumbnailUrl || video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`
  }

  function getGateBadge(video: Video) {
    if (!video.gateConfig) return null
    const gate = video.gateConfig as { type?: string }
    if (!gate.type || gate.type === "none") return null
    return <Badge variant="outline" className="text-xs">Gate: {gate.type}</Badge>
  }

  const filteredVideos = videos.filter((v) => {
    if (searchQuery) {
      return v.title.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-gray-50/50 p-4 hidden lg:block">
        <div className="space-y-4">
          <Button
            variant={selectedFolder === null ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => setSelectedFolder(null)}
          >
            <Video className="mr-2 h-4 w-4" />
            All Videos
            <Badge variant="secondary" className="ml-auto">{videos.length}</Badge>
          </Button>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Folders</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7">
                  <Plus className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Folder</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="e.g., Week 1, Sales Training"
                    />
                  </div>
                  <Button onClick={handleCreateFolder} disabled={isCreatingFolder || !newFolderName.trim()}>
                    {isCreatingFolder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Folder
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-1">
            {folders.map((folder) => (
              <div key={folder.id} className="flex items-center gap-1">
                <Button
                  variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                  className="flex-1 justify-start"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <FolderOpen className="mr-2 h-4 w-4" style={{ color: folder.color }} />
                  {folder.name}
                  <Badge variant="secondary" className="ml-auto">{folder.videoCount}</Badge>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDeleteFolder(folder.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Video Library</h1>
            <p className="text-gray-500">Import and manage your YouTube videos</p>
          </div>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Import Video
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Import YouTube Video</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="youtube-url">YouTube URL</Label>
                  <Input
                    id="youtube-url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-1"
                  />
                  {importError && <p className="text-sm text-red-500 mt-1">{importError}</p>}
                </div>
                <Button onClick={handleImport} disabled={isImporting || !importUrl.trim()} className="w-full">
                  {isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Import Video
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedVideos.size > 0 && (
          <div className="flex items-center gap-4 mb-4 p-3 bg-gray-100 rounded-lg">
            <span className="text-sm font-medium">{selectedVideos.size} selected</span>
            <Button variant="outline" size="sm" onClick={() => setSelectedVideos(new Set())}>
              Clear
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Assign to:</span>
              <select
                className="text-sm border rounded px-2 py-1"
                onChange={(e) => {
                  if (e.target.value) handleBulkAssignFolder(e.target.value)
                }}
                defaultValue=""
              >
                <option value="">Select folder...</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Video Grid/List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64">
              <Video className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="font-medium text-lg mb-1">No videos yet</h3>
              <p className="text-gray-500 text-center mb-4">
                Import your first YouTube video to get started
              </p>
              <Button onClick={() => setImportDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Import Video
              </Button>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                <div className="relative aspect-video bg-black" onClick={() => router.push(`/dashboard/videos/${video.id}`)}>
                  <img
                    src={getThumbnail(video)}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  {video.duration && (
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      checked={selectedVideos.has(video.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleVideoSelection(video.id)
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                  </div>
                </div>
                <CardHeader className="p-3">
                  <CardTitle className="text-sm line-clamp-2">{video.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    {getGateBadge(video)}
                    {video.folder && (
                      <Badge variant="secondary" className="text-xs" style={{ backgroundColor: video.folder.color + "20" }}>
                        {video.folder.name}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center gap-3 text-xs mt-2">
                    <span>{video.totalViews} views</span>
                    <span>{video.totalLeads} leads</span>
                  </CardDescription>
                </CardHeader>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => router.push(`/dashboard/videos/${video.id}`)}>
                    <Edit className="mr-1 h-3 w-3" /> Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteVideo(video.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="divide-y">
              {filteredVideos.map((video) => (
                <div key={video.id} className="flex items-center gap-4 p-4 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedVideos.has(video.id)}
                    onChange={() => toggleVideoSelection(video.id)}
                    className="rounded"
                  />
                  <div className="w-32 h-20 bg-black rounded overflow-hidden flex-shrink-0">
                    <img src={getThumbnail(video)} alt={video.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{video.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {getGateBadge(video)}
                      {video.folder && (
                        <Badge variant="secondary" className="text-xs">{video.folder.name}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{video.totalViews} views</span>
                    <span>{video.totalLeads} leads</span>
                    {video.duration && <span>{formatDuration(video.duration)}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/videos/${video.id}`)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteVideo(video.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}