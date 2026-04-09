"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, Eye, Copy } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Delivery {
  id: string
  event: string
  payload: Record<string, unknown>
  status: string
  attempts: number
  lastError: string | null
  createdAt: string
}

interface Webhook {
  id: string
  name: string
  url: string
}

export default function WebhookDeliveriesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [webhook, setWebhook] = useState<Webhook | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id, page])

  const fetchData = async () => {
    try {
      const [webhookRes, deliveriesRes] = await Promise.all([
        fetch(`/api/integrations/webhooks/${resolvedParams.id}`),
        fetch(`/api/integrations/webhooks/${resolvedParams.id}/deliveries?page=${page}`),
      ])

      if (webhookRes.ok) {
        const webhookData = await webhookRes.json()
        setWebhook({ id: webhookData.id, name: webhookData.name, url: webhookData.url })
      }

      if (deliveriesRes.ok) {
        const deliveriesData = await deliveriesRes.json()
        setDeliveries(deliveriesData.deliveries)
        setTotal(deliveriesData.total)
        setTotalPages(deliveriesData.totalPages)
      }
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const copyPayload = () => {
    if (!selectedDelivery) return
    navigator.clipboard.writeText(JSON.stringify(selectedDelivery.payload, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Success</Badge>
      case "failed":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString()
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
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{webhook?.name} - Deliveries</h1>
          <p className="text-gray-500 mt-1">{total} total deliveries</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Delivery Log</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-normal">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No deliveries yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {deliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedDelivery?.id === delivery.id ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {delivery.event}
                        </span>
                        {getStatusBadge(delivery.status)}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">
                          {formatDate(delivery.createdAt)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {delivery.attempts} attempt{delivery.attempts !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    {delivery.status === "failed" && delivery.lastError && (
                      <p className="text-xs text-red-500 mt-2 truncate">
                        Error: {delivery.lastError}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Payload Details</span>
              {selectedDelivery && (
                <Button variant="ghost" size="sm" onClick={copyPayload}>
                  {copied ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDelivery ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Event</p>
                    <p className="font-mono">{selectedDelivery.event}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedDelivery.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Attempts</p>
                    <p>{selectedDelivery.attempts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p>{formatDate(selectedDelivery.createdAt)}</p>
                  </div>
                </div>
                {selectedDelivery.lastError && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Error</p>
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-600">
                      {selectedDelivery.lastError}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payload</p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(selectedDelivery.payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a delivery to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
