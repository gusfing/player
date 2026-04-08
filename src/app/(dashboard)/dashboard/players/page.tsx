"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Play, Copy, MoreVertical, Trash2, ExternalLink, Loader2 } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Player {
  id: string
  name: string
  youtubeVideoId: string
  isInstalled: boolean
  playCount: number
  createdAt: string
  _count: {
    analytics: number
    ctaClicks: number
  }
}

export default function PlayersPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/players")
      if (response.ok) {
        const data = await response.json()
        setPlayers(data)
      } else if (response.status === 401) {
        router.push("/login")
      }
    } catch (err) {
      setError("Failed to load players")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/players/${deleteId}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        setPlayers(players.filter(p => p.id !== deleteId))
        setDeleteId(null)
      }
    } catch (err) {
      console.error("Failed to delete player:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const copyEmbedCode = (playerId: string) => {
    const code = `<script src="${process.env.NEXT_PUBLIC_APP_URL || 'https://shrazen.com'}/player.min.js" data-player-id="${playerId}"></script>`
    navigator.clipboard.writeText(code)
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Players</h1>
          <p className="text-gray-500 mt-1">Manage your custom video players</p>
        </div>
        <Link href="/dashboard/players/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Player
          </Button>
        </Link>
      </div>

      {/* Players List */}
      {players.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Play className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No players yet</h3>
            <p className="text-gray-500 text-center mb-6 max-w-md">
              Create your first custom YouTube player to get started. 
              You&apos;ll be able to embed it on your website in minutes.
            </p>
            <Link href="/dashboard/players/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Player
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Video ID</TableHead>
                <TableHead>Plays</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-gray-400" />
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {player.youtubeVideoId}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell>{player.playCount}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      player.isInstalled 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {player.isInstalled ? 'Installed' : 'Not installed'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => copyEmbedCode(player.id)}
                        title="Copy embed code"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Link href={`/dashboard/players/${player.id}`}>
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteId(player.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Player</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this player? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
