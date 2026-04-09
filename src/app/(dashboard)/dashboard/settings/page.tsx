"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Loader2, Copy, Check, RefreshCw, Plus, Trash2, Webhook, AlertTriangle, CheckCircle, XCircle, RotateCcw, Zap, BarChart3, ExternalLink, Save } from "lucide-react"

interface GlobalSettings {
  masterApiKey: string
  globalBrandingConfig: {
    primaryColor?: string
    progressColor?: string
  }
  globalCtaConfig: {
    enabled?: boolean
    primaryText?: string
    primaryUrl?: string
    secondaryText?: string
    secondaryUrl?: string
  }
  globalMetaPixelId: string
}

interface Webhook {
  id: string
  name: string
  url: string
  secret: string
  events: string[]
  enabled: boolean
  consecutiveFailures: number
  stats: {
    successCount: number
    failureCount: number
    lastStatus: string | null
    lastAttempt: string | null
  } | null
  createdAt: string
}

interface GoogleAnalytics {
  id: string
  measurementId: string
  apiSecret: string
  enabled: boolean
  createdAt: string
}

const AVAILABLE_EVENTS = [
  { id: "video_played", label: "Video Played", description: "When a user starts watching" },
  { id: "video_progress", label: "Video Progress", description: "At 25%, 50%, 75% milestones" },
  { id: "video_completed", label: "Video Completed", description: "When video finishes" },
  { id: "video_paused", label: "Video Paused", description: "When user pauses" },
  { id: "video_session_ended", label: "Session Ended", description: "When user leaves" },
  { id: "cta_clicked", label: "CTA Clicked", description: "When CTA button clicked" },
  { id: "lead_captured", label: "Lead Captured", description: "When email is submitted" },
]

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [settings, setSettings] = useState<GlobalSettings | null>(null)
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [webhookLimit, setWebhookLimit] = useState({ limit: 1, used: 0, unlimited: false })
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(true)
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false)
  const [isTestingWebhook, setIsTestingWebhook] = useState<string | null>(null)
  const [isRotatingSecret, setIsRotatingSecret] = useState<string | null>(null)
  const [isDeletingWebhook, setIsDeletingWebhook] = useState<string | null>(null)

  const [googleAnalytics, setGoogleAnalytics] = useState<GoogleAnalytics | null>(null)
  const [isLoadingGA, setIsLoadingGA] = useState(true)
  const [isSavingGA, setIsSavingGA] = useState(false)
  const [isTestingGA, setIsTestingGA] = useState(false)
  const [gaForm, setGaForm] = useState({ measurementId: "", apiSecret: "" })

  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
  })

  const [formData, setFormData] = useState({
    branding: {
      primaryColor: "#FF0000",
      progressColor: "#FF0000",
    },
    cta: {
      enabled: false,
      primaryText: "",
      primaryUrl: "",
      secondaryText: "",
      secondaryUrl: "",
    },
    metaPixelId: "",
  })

  useEffect(() => {
    fetchSettings()
    fetchWebhooks()
    fetchGoogleAnalytics()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/user/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData({
          branding: {
            primaryColor: data.globalBrandingConfig?.primaryColor || "#FF0000",
            progressColor: data.globalBrandingConfig?.progressColor || "#FF0000",
          },
          cta: {
            enabled: data.globalCtaConfig?.enabled || false,
            primaryText: data.globalCtaConfig?.primaryText || "",
            primaryUrl: data.globalCtaConfig?.primaryUrl || "",
            secondaryText: data.globalCtaConfig?.secondaryText || "",
            secondaryUrl: data.globalCtaConfig?.secondaryUrl || "",
          },
          metaPixelId: data.globalMetaPixelId || "",
        })
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err)
    }
  }

  const fetchWebhooks = async () => {
    try {
      const response = await fetch("/api/integrations/webhooks")
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks)
        setWebhookLimit({
          limit: data.limit,
          used: data.used,
          unlimited: data.unlimited,
        })
      }
    } catch (err) {
      console.error("Failed to fetch webhooks:", err)
    } finally {
      setIsLoadingWebhooks(false)
    }
  }

  const fetchGoogleAnalytics = async () => {
    try {
      const response = await fetch("/api/integrations/google-analytics")
      if (response.ok) {
        const data = await response.json()
        setGoogleAnalytics(data.googleAnalytics)
        if (data.googleAnalytics) {
          setGaForm({
            measurementId: data.googleAnalytics.measurementId,
            apiSecret: data.googleAnalytics.apiSecret,
          })
        }
      }
    } catch (err) {
      console.error("Failed to fetch Google Analytics:", err)
    } finally {
      setIsLoadingGA(false)
    }
  }

  const saveGoogleAnalytics = async () => {
    if (!gaForm.measurementId || !gaForm.apiSecret) return

    setIsSavingGA(true)
    try {
      const response = await fetch("/api/integrations/google-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gaForm),
      })

      if (response.ok) {
        const data = await response.json()
        setGoogleAnalytics(data)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save Google Analytics")
      }
    } catch (err) {
      console.error("Failed to save Google Analytics:", err)
    } finally {
      setIsSavingGA(false)
    }
  }

  const testGoogleAnalytics = async () => {
    if (!gaForm.measurementId || !gaForm.apiSecret) return

    setIsTestingGA(true)
    try {
      const response = await fetch("/api/integrations/google-analytics/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gaForm),
      })
      const result = await response.json()
      alert(result.success ? "Test event sent successfully! Check GA4 Real-time." : `Test failed: ${result.error}`)
    } catch (err) {
      console.error("Failed to test Google Analytics:", err)
    } finally {
      setIsTestingGA(false)
    }
  }

  const deleteGoogleAnalytics = async () => {
    if (!confirm("Remove Google Analytics integration?")) return

    try {
      const response = await fetch("/api/integrations/google-analytics", {
        method: "DELETE",
      })
      if (response.ok) {
        setGoogleAnalytics(null)
        setGaForm({ measurementId: "", apiSecret: "" })
      }
    } catch (err) {
      console.error("Failed to delete Google Analytics:", err)
    }
  }

  const toggleGoogleAnalytics = async (enabled: boolean) => {
    try {
      await fetch("/api/integrations/google-analytics/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      fetchGoogleAnalytics()
    } catch (err) {
      console.error("Failed to toggle Google Analytics:", err)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          globalBrandingConfig: formData.branding,
          globalCtaConfig: formData.cta,
          globalMetaPixelId: formData.metaPixelId || null,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (err) {
      console.error("Failed to save settings:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRegenerateKey = async () => {
    if (!confirm("Are you sure? This will invalidate your current API key. Any connected plugins will need to be updated.")) return

    setIsRegenerating(true)
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateApiKey: true }),
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (err) {
      console.error("Failed to regenerate key:", err)
    } finally {
      setIsRegenerating(false)
    }
  }

  const copyApiKey = () => {
    if (!settings?.masterApiKey) return
    navigator.clipboard.writeText(settings.masterApiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const createWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) return

    setIsCreatingWebhook(true)
    try {
      const response = await fetch("/api/integrations/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      })

      if (response.ok) {
        const webhook = await response.json()
        setWebhooks([webhook, ...webhooks])
        setWebhookLimit({ ...webhookLimit, used: webhookLimit.used + 1 })
        setNewWebhook({ name: "", url: "", events: [] })
        fetchWebhooks()
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create webhook")
      }
    } catch (err) {
      console.error("Failed to create webhook:", err)
    } finally {
      setIsCreatingWebhook(false)
    }
  }

  const testWebhook = async (webhookId: string) => {
    setIsTestingWebhook(webhookId)
    try {
      const response = await fetch(`/api/integrations/webhooks/${webhookId}/test`, {
        method: "POST",
      })
      const result = await response.json()
      alert(result.success ? "Test webhook sent successfully!" : `Test failed: ${result.error}`)
      fetchWebhooks()
    } catch (err) {
      console.error("Failed to test webhook:", err)
    } finally {
      setIsTestingWebhook(null)
    }
  }

  const rotateSecret = async (webhookId: string) => {
    if (!confirm("This will generate a new secret. Update your receiver with the new secret.")) return

    setIsRotatingSecret(webhookId)
    try {
      const response = await fetch(`/api/integrations/webhooks/${webhookId}/rotate-secret`, {
        method: "POST",
      })
      if (response.ok) {
        fetchWebhooks()
      }
    } catch (err) {
      console.error("Failed to rotate secret:", err)
    } finally {
      setIsRotatingSecret(null)
    }
  }

  const deleteWebhook = async (webhookId: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return

    setIsDeletingWebhook(webhookId)
    try {
      const response = await fetch(`/api/integrations/webhooks/${webhookId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        setWebhooks(webhooks.filter(w => w.id !== webhookId))
        setWebhookLimit({ ...webhookLimit, used: webhookLimit.used - 1 })
      }
    } catch (err) {
      console.error("Failed to delete webhook:", err)
    } finally {
      setIsDeletingWebhook(null)
    }
  }

  const toggleWebhookEnabled = async (webhookId: string, enabled: boolean) => {
    try {
      await fetch(`/api/integrations/webhooks/${webhookId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      fetchWebhooks()
    } catch (err) {
      console.error("Failed to toggle webhook:", err)
    }
  }

  if (!isLoaded) {
    return (
      <div className="p-6 lg:p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and default settings</p>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Default Branding</TabsTrigger>
          <TabsTrigger value="cta">Default CTA</TabsTrigger>
          <TabsTrigger value="api">API Key</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Google Analytics 4</CardTitle>
                      <CardDescription>
                        Track all video events in your GA4 property
                      </CardDescription>
                    </div>
                  </div>
                  {googleAnalytics && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Enabled</span>
                      <Switch
                        checked={googleAnalytics.enabled}
                        onCheckedChange={toggleGoogleAnalytics}
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingGA ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : googleAnalytics ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500">Measurement ID</Label>
                        <p className="font-mono text-sm">{googleAnalytics.measurementId}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={testGoogleAnalytics} disabled={isTestingGA || !googleAnalytics.enabled}>
                          {isTestingGA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          <span className="ml-1">Test</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={deleteGoogleAnalytics}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Connected!</strong> All video events are being sent to GA4.
                        Check your Real-time reports to see activity.
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      <a
                        href="https://analytics.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        Open Google Analytics <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Measurement ID</Label>
                        <Input
                          placeholder="G-XXXXXXXXXX"
                          value={gaForm.measurementId}
                          onChange={(e) => setGaForm({ ...gaForm, measurementId: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>API Secret</Label>
                        <Input
                          placeholder="Generated in GA4"
                          value={gaForm.apiSecret}
                          onChange={(e) => setGaForm({ ...gaForm, apiSecret: e.target.value })}
                          type="password"
                        />
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">
                        To get your API secret: GA4 Admin → Data Streams → Web Stream → Measurement Protocol API Secrets → Create
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveGoogleAnalytics} disabled={isSavingGA || !gaForm.measurementId || !gaForm.apiSecret}>
                        {isSavingGA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span className="ml-1">Connect Google Analytics</span>
                      </Button>
                      <Button variant="outline" onClick={testGoogleAnalytics} disabled={isTestingGA || !gaForm.measurementId || !gaForm.apiSecret}>
                        {isTestingGA ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        <span className="ml-1">Test Connection</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Webhook className="w-5 h-5" />
                      Webhooks
                    </CardTitle>
                    <CardDescription>
                      Send real-time events to your external systems
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {webhookLimit.unlimited 
                        ? "Unlimited webhooks" 
                        : `${webhookLimit.used}/${webhookLimit.limit} webhooks`}
                    </span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button disabled={!webhookLimit.unlimited && webhookLimit.used >= webhookLimit.limit}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Webhook
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md bg-white rounded-lg">
                        <DialogHeader>
                          <DialogTitle>Add Webhook</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                              placeholder="My Webhook"
                              value={newWebhook.name}
                              onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                              placeholder="https://example.com/webhook"
                              value={newWebhook.url}
                              onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Events</Label>
                            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                              {AVAILABLE_EVENTS.map((event) => (
                                <label
                                  key={event.id}
                                  className="flex items-start gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={newWebhook.events.includes(event.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewWebhook({
                                          ...newWebhook,
                                          events: [...newWebhook.events, event.id],
                                        })
                                      } else {
                                        setNewWebhook({
                                          ...newWebhook,
                                          events: newWebhook.events.filter((ev) => ev !== event.id),
                                        })
                                      }
                                    }}
                                    className="mt-1"
                                  />
                                  <div>
                                    <p className="text-sm font-medium">{event.label}</p>
                                    <p className="text-xs text-gray-500">{event.description}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setNewWebhook({ name: "", url: "", events: [] })}>
                              Cancel
                            </Button>
                            <Button
                              onClick={createWebhook}
                              disabled={isCreatingWebhook || !newWebhook.name || !newWebhook.url || newWebhook.events.length === 0}
                            >
                              {isCreatingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingWebhooks ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : webhooks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No webhooks configured</p>
                    <p className="text-sm">Add a webhook to receive real-time events</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {webhooks.map((webhook) => (
                      <div key={webhook.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{webhook.name}</h3>
                              {webhook.enabled ? (
                                <Badge className="bg-green-500">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Disabled</Badge>
                              )}
                              {webhook.consecutiveFailures >= 3 && (
                                <Badge className="bg-red-500">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Failing
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 font-mono truncate max-w-md">{webhook.url}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                              <span>Events: {webhook.events.join(", ")}</span>
                            </div>
                            {webhook.stats && (
                              <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  {webhook.stats.successCount} delivered
                                </span>
                                {webhook.stats.failureCount > 0 && (
                                  <span className="flex items-center gap-1 text-red-600">
                                    <XCircle className="w-3 h-3" />
                                    {webhook.stats.failureCount} failed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/dashboard/settings/webhooks/${webhook.id}/deliveries`}>
                              <Button variant="ghost" size="sm">
                                View Logs
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleWebhookEnabled(webhook.id, !webhook.enabled)}
                            >
                              {webhook.enabled ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => testWebhook(webhook.id)}
                              disabled={isTestingWebhook === webhook.id}
                            >
                              {isTestingWebhook === webhook.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Zap className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => rotateSecret(webhook.id)}
                              disabled={isRotatingSecret === webhook.id}
                            >
                              {isRotatingSecret === webhook.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RotateCcw className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteWebhook(webhook.id)}
                              disabled={isDeletingWebhook === webhook.id}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-gray-50 rounded text-xs font-mono truncate">
                          Secret: {webhook.secret}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Zapier Integration</CardTitle>
                <CardDescription>
                  Connect YouTube Shell to 5000+ apps via Zapier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Use our webhooks with Zapier to connect to any app. Create a webhook above and use the URL in your Zap.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Available Events for Zapier:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• video_played - When a video starts playing</li>
                      <li>• video_progress - At 25%, 50%, 75% watch milestones</li>
                      <li>• video_completed - When a video finishes</li>
                      <li>• lead_captured - When someone submits their email</li>
                      <li>• cta_clicked - When someone clicks your CTA button</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="space-y-6 max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={user?.emailAddresses[0]?.emailAddress || ""}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    defaultValue={user?.fullName || ""}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Meta Pixel (Default)</CardTitle>
                <CardDescription>
                  This pixel ID will be used for all installations unless overridden
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Pixel ID</Label>
                  <Input
                    placeholder="e.g., 123456789"
                    value={formData.metaPixelId}
                    onChange={(e) => setFormData({ ...formData, metaPixelId: e.target.value })}
                  />
                  <p className="text-sm text-gray-500">
                    Find your Pixel ID in Meta Events Manager
                  </p>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Default Branding</CardTitle>
              <CardDescription>
                These colors will be applied to all installations unless overridden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Button Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.branding.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branding: { ...formData.branding, primaryColor: e.target.value },
                        })
                      }
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.branding.primaryColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branding: { ...formData.branding, primaryColor: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Progress Bar Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.branding.progressColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branding: { ...formData.branding, progressColor: e.target.value },
                        })
                      }
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={formData.branding.progressColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          branding: { ...formData.branding, progressColor: e.target.value },
                        })
                      }
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
                  "Save Defaults"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA Tab */}
        <TabsContent value="cta">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Default CTA Button</CardTitle>
              <CardDescription>
                These CTA settings will be applied to all installations unless overridden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.cta.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cta: { ...formData.cta, enabled: e.target.checked },
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Enable CTA Button</span>
                </label>
              </div>

              {formData.cta.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Primary Button Text</Label>
                      <Input
                        value={formData.cta.primaryText}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cta: { ...formData.cta, primaryText: e.target.value },
                          })
                        }
                        placeholder="Learn More"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Button URL</Label>
                      <Input
                        value={formData.cta.primaryUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cta: { ...formData.cta, primaryUrl: e.target.value },
                          })
                        }
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Secondary Button Text (optional)</Label>
                      <Input
                        value={formData.cta.secondaryText}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cta: { ...formData.cta, secondaryText: e.target.value },
                          })
                        }
                        placeholder="Maybe Later"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Button URL</Label>
                      <Input
                        value={formData.cta.secondaryUrl}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cta: { ...formData.cta, secondaryUrl: e.target.value },
                          })
                        }
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Defaults"
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Key Tab */}
        <TabsContent value="api">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>API Key</CardTitle>
              <CardDescription>
                Use this API key to connect WordPress and Shopify plugins to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Master API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings?.masterApiKey || "Loading..."}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" onClick={copyApiKey}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Each plugin installation uses this key to authenticate
                </p>
              </div>
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleRegenerateKey}
                  disabled={isRegenerating}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate API Key
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Warning: This will invalidate your current key. All connected plugins will need to be updated.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
