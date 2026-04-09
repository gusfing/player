"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Check, Loader2, Save, Globe, RefreshCw, Users, ArrowRight, Lock, Play, Zap, Settings, CheckSquare, Square, Mail, User, Phone, Shield, Volume2, AlertTriangle, Bug, Info, ExternalLink } from "lucide-react"
import { useDebugStore } from "@/hooks/useDebugStore"
import { DomainList } from "@/components/DomainList"
import { DomainInput } from "@/components/DomainInput"

interface Installation {
  id: string
  domain: string
  platform: string
  status: string
  apiKey: string
  brandingConfig: Record<string, unknown>
  ctaConfig: Record<string, unknown>
  metaPixelId: string | null
  googleAnalyticsId: string | null
  allowedDomains: string[]
  debugMode: string
  totalPlays: number
  totalViews: number
  lastActivityAt: string | null
  lastHeartbeatAt: string | null
  createdAt: string
}

export default function InstallationSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [installation, setInstallation] = useState<Installation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [testUrl, setTestUrl] = useState("")
  const [urlCopied, setUrlCopied] = useState(false)

  const [formData, setFormData] = useState({
    domain: "",
    branding: {
      primaryColor: "#FF0000",
      progressColor: "#FF0000",
    },
    cta: {
      enabled: false,
      captureMode: "smart_pause",
      trigger: {
        type: "time",
        value: 30,
      },
      rules: {
        skipIfKnownUser: true,
        reTriggerAfterDays: 7,
      },
      form: {
        fields: ["email"],
        headline: "Get Started",
        description: "Enter your details to continue watching",
        ctaText: "Unlock Video",
        buttonText: "Submit",
        thankYouMessage: "Thanks! enjoy the video.",
      },
      onSubmit: {
        action: "resume",
        redirectUrl: "",
      },
      buttonColor: "#2563eb",
      secondaryButtonText: "",
      autoPlayMuted: false,
      skipProtection: {
        enabled: false,
        blockAfterSeconds: 30,
      },
      socialProof: {
        enabled: false,
        baseCount: 0,
        incrementPerDay: 2,
        text: "Join {count} others",
      },
    },
    metaPixelId: "",
    googleAnalyticsId: "",
    debugMode: "inherit",
    allowedDomains: [] as string[],
  })

  useEffect(() => {
    fetchInstallation()
  }, [resolvedParams.id])

  const fetchInstallation = async () => {
    try {
      const response = await fetch(`/api/installations/${resolvedParams.id}`)
      if (response.ok) {
        const data = await response.json()
        setInstallation(data)
        setFormData({
          domain: data.domain,
          branding: {
            primaryColor: (data.brandingConfig as Record<string, string>)?.primaryColor || "#FF0000",
            progressColor: (data.brandingConfig as Record<string, string>)?.progressColor || "#FF0000",
          },
          cta: {
            enabled: Boolean((data.ctaConfig as Record<string, unknown>)?.enabled),
            captureMode: (data.ctaConfig as Record<string, string>)?.captureMode || "smart_pause",
            trigger: {
              type: (data.ctaConfig as { trigger?: { type?: string; value?: number } })?.trigger?.type || "time",
              value: Number((data.ctaConfig as { trigger?: { type?: string; value?: number } })?.trigger?.value) || 30,
            },
          rules: {
            skipIfKnownUser: Boolean((data.ctaConfig as { rules?: { skipIfKnownUser?: boolean; reTriggerAfterDays?: number } })?.rules?.skipIfKnownUser ?? true),
            reTriggerAfterDays: Number((data.ctaConfig as { rules?: { skipIfKnownUser?: boolean; reTriggerAfterDays?: number } })?.rules?.reTriggerAfterDays) || 7,
          },
          form: {
            fields: (data.ctaConfig as { form?: { fields?: string[]; headline?: string; description?: string; ctaText?: string; buttonText?: string; thankYouMessage?: string } })?.form?.fields || ["email"],
            headline: (data.ctaConfig as { form?: { fields?: string[]; headline?: string; description?: string; ctaText?: string; buttonText?: string; thankYouMessage?: string } })?.form?.headline || "Get Started",
            description: (data.ctaConfig as { form?: { fields?: string[]; headline?: string; description?: string; ctaText?: string; buttonText?: string; thankYouMessage?: string } })?.form?.description || "Enter your details to continue watching",
            ctaText: (data.ctaConfig as { form?: { fields?: string[]; headline?: string; description?: string; ctaText?: string; buttonText?: string; thankYouMessage?: string } })?.form?.ctaText || "Unlock Video",
            buttonText: (data.ctaConfig as { form?: { fields?: string[]; headline?: string; description?: string; ctaText?: string; buttonText?: string; thankYouMessage?: string } })?.form?.buttonText || "Submit",
            thankYouMessage: (data.ctaConfig as { form?: { fields?: string[]; headline?: string; description?: string; ctaText?: string; buttonText?: string; thankYouMessage?: string } })?.form?.thankYouMessage || "Thanks! enjoy the video.",
          },
          onSubmit: {
            action: (data.ctaConfig as { onSubmit?: { action?: string; redirectUrl?: string } })?.onSubmit?.action || "resume",
            redirectUrl: (data.ctaConfig as { onSubmit?: { action?: string; redirectUrl?: string } })?.onSubmit?.redirectUrl || "",
          },
          buttonColor: (data.ctaConfig as Record<string, string>)?.buttonColor || "#2563eb",
          secondaryButtonText: (data.ctaConfig as Record<string, string>)?.secondaryButtonText || "",
          autoPlayMuted: Boolean((data.ctaConfig as { autoPlayMuted?: boolean })?.autoPlayMuted) || false,
          skipProtection: {
            enabled: Boolean((data.ctaConfig as { skipProtection?: { enabled?: boolean; blockAfterSeconds?: number } })?.skipProtection?.enabled) || false,
            blockAfterSeconds: Number((data.ctaConfig as { skipProtection?: { enabled?: boolean; blockAfterSeconds?: number } })?.skipProtection?.blockAfterSeconds) || 30,
          },
          socialProof: {
            enabled: Boolean((data.ctaConfig as { socialProof?: { enabled?: boolean; baseCount?: number; incrementPerDay?: number; text?: string } })?.socialProof?.enabled) || false,
            baseCount: Number((data.ctaConfig as { socialProof?: { enabled?: boolean; baseCount?: number; incrementPerDay?: number; text?: string } })?.socialProof?.baseCount) || 0,
            incrementPerDay: Number((data.ctaConfig as { socialProof?: { enabled?: boolean; baseCount?: number; incrementPerDay?: number; text?: string } })?.socialProof?.incrementPerDay) || 2,
            text: (data.ctaConfig as { socialProof?: { enabled?: boolean; baseCount?: number; incrementPerDay?: number; text?: string } })?.socialProof?.text || "Join {count} others",
          },
        },
        metaPixelId: data.metaPixelId || "",
        googleAnalyticsId: data.googleAnalyticsId || "",
        debugMode: data.debugMode || "inherit",
        allowedDomains: (data.allowedDomains as string[]) || [],
      })

      const { setGa4Id, setPixelId, setInstallationDebugSetting } = useDebugStore.getState()
      setGa4Id(data.googleAnalyticsId || data.resolvedGA4Id || null)
      setPixelId(data.metaPixelId || data.resolvedPixelId || null)
      setInstallationDebugSetting(data.debugMode || "inherit")
      }
    } catch (err) {
      console.error("Failed to fetch installation:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!installation) return

    setIsSaving(true)
    
    const { setEnabled, setInstallationDebugSetting } = useDebugStore.getState()
    
    const normalizedMainDomain = formData.domain
      .toLowerCase()
      .replace(/^(https?:\/\/)?(www\.)?/, "")
      .replace(/\/$/, "")
    
    let finalAllowedDomains = [...formData.allowedDomains]
    if (normalizedMainDomain && !finalAllowedDomains.includes(normalizedMainDomain)) {
      finalAllowedDomains.unshift(normalizedMainDomain)
    }

    setInstallationDebugSetting(formData.debugMode as 'inherit' | 'enabled' | 'disabled')
    
    if (formData.debugMode === "enabled") {
      setEnabled(true)
    }

    try {
      const response = await fetch(`/api/installations/${installation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: formData.domain,
          brandingConfig: formData.branding,
          ctaConfig: formData.cta,
          metaPixelId: formData.metaPixelId || null,
          googleAnalyticsId: formData.googleAnalyticsId || null,
          debugMode: formData.debugMode,
          allowedDomains: finalAllowedDomains,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setInstallation({ ...installation, ...data })
        setFormData(prev => ({
          ...prev,
          allowedDomains: (data.allowedDomains as string[]) || finalAllowedDomains,
        }))
      }
    } catch (err) {
      console.error("Failed to save:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const addAllowedDomain = (domain: string) => {
    if (!formData.allowedDomains.includes(domain)) {
      setFormData({
        ...formData,
        allowedDomains: [...formData.allowedDomains, domain],
      })
    }
  }

  const removeAllowedDomain = (domain: string) => {
    setFormData({
      ...formData,
      allowedDomains: formData.allowedDomains.filter((d) => d !== domain),
    })
  }

  const copyEmbedCode = () => {
    if (!installation) return
    const code = `<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://shrazen.com"}/player.min.js" data-site-id="${installation.id}"></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyApiKey = () => {
    if (!installation) return
    navigator.clipboard.writeText(installation.apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openTestPreview = () => {
    if (!testUrl) return
    
    let url = testUrl
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    const separator = url.includes('?') ? '&' : '?'
    const debugUrl = `${url}${separator}debug=true`
    
    window.open(debugUrl, '_blank')
  }

  const copyDebugUrl = async () => {
    if (!testUrl) return
    
    let url = testUrl
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    const separator = url.includes('?') ? '&' : '?'
    const debugUrl = `${url}${separator}debug=true`
    
    try {
      await navigator.clipboard.writeText(debugUrl)
      setUrlCopied(true)
      setTimeout(() => setUrlCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case "wordpress":
        return "WordPress"
      case "shopify":
        return "Shopify"
      default:
        return "Custom HTML"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "disconnected":
        return <Badge className="bg-orange-500">Disconnected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!installation) {
    return null
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/installations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{installation.domain}</h1>
            {getStatusBadge(installation.status)}
          </div>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {getPlatformName(installation.platform)} • Added {new Date(installation.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{installation.totalPlays.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Plays</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{installation.totalViews.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Views</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {installation.lastActivityAt
                ? new Date(installation.lastActivityAt).toLocaleDateString()
                : "Never"}
            </p>
            <p className="text-sm text-gray-500">Last Activity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">
              {installation.lastHeartbeatAt
                ? `${Math.round((Date.now() - new Date(installation.lastHeartbeatAt).getTime()) / 60000)}m`
                : "Never"}
            </p>
            <p className="text-sm text-gray-500">Last Heartbeat</p>
            </CardContent>
          </Card>
        <Link href={`/dashboard/installations/${installation.id}/leads`}>
          <Card className="hover:border-blue-500 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full">
              <Users className="w-6 h-6 text-blue-500 mb-1" />
              <p className="text-2xl font-bold">Leads</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                View <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="settings">
        <TabsList className="mb-6">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="cta">CTA & Leads</TabsTrigger>
          <TabsTrigger value="embed">Embed Code</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Installation Settings</CardTitle>
              <CardDescription>Basic settings for this installation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="domain">Installation Domain</Label>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Primary</span>
                </div>
                <Input
                  id="domain"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  The primary website where this player is installed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaPixelId">Meta Pixel ID</Label>
                <Input
                  id="metaPixelId"
                  placeholder="e.g., 123456789"
                  value={formData.metaPixelId}
                  onChange={(e) => setFormData({ ...formData, metaPixelId: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  🔹 Overrides default Meta Pixel for this domain
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  placeholder="e.g., G-XXXXXXXXXX"
                  value={formData.googleAnalyticsId}
                  onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                />
                <p className="text-sm text-gray-500">
                  🔹 Overrides default Google Analytics for this domain
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Debug Mode</Label>
                    {formData.debugMode === "enabled" && (
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="debugMode-inherit"
                      name="debugMode"
                      value="inherit"
                      checked={formData.debugMode === "inherit"}
                      onChange={() => setFormData({ ...formData, debugMode: "inherit" })}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <label htmlFor="debugMode-inherit" className="text-sm cursor-pointer">
                      Use global setting
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="debugMode-enabled"
                      name="debugMode"
                      value="enabled"
                      checked={formData.debugMode === "enabled"}
                      onChange={() => setFormData({ ...formData, debugMode: "enabled" })}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <label htmlFor="debugMode-enabled" className="text-sm cursor-pointer">
                      Enable for this installation
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="debugMode-disabled"
                      name="debugMode"
                      value="disabled"
                      checked={formData.debugMode === "disabled"}
                      onChange={() => setFormData({ ...formData, debugMode: "disabled" })}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <label htmlFor="debugMode-disabled" className="text-sm cursor-pointer">
                      Disable for this installation
                    </label>
                  </div>
                </div>

                {formData.debugMode === "enabled" && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200 space-y-4">
                    <div className="flex items-start gap-2">
                      <Bug className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Debug mode enabled for this site</p>
                        <p className="text-xs text-green-600 mt-1">
                          The debug panel will appear on your website when you visit with ?debug=true
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="testUrl" className="text-sm font-medium text-gray-700">
                        Test URL
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="testUrl"
                          placeholder="https://yourwebsite.com/page-with-video"
                          value={testUrl}
                          onChange={(e) => setTestUrl(e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Enter your website URL where the player is installed
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={openTestPreview}
                        disabled={!testUrl}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyDebugUrl}
                        disabled={!testUrl}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy URL
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Allowed Domains */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Additional Allowed Domains</Label>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Optional</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formData.allowedDomains.length} domain{formData.allowedDomains.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <p className="text-sm text-gray-500 flex items-start gap-2 -mt-1">
                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Other domains that can embed this player. Subdomains of allowed domains are auto-permitted.</span>
                  </p>
                  <DomainList
                    domains={formData.allowedDomains}
                    onRemove={removeAllowedDomain}
                    disabled={isSaving}
                  />
                  <DomainInput
                    existingDomains={formData.allowedDomains}
                    onAdd={addAllowedDomain}
                    disabled={isSaving}
                  />
                  {formData.allowedDomains.length === 0 && installation?.status === "active" && (
                    <div className="flex items-center gap-2 text-amber-600 text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Only the installation domain will be allowed</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={installation.apiKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" onClick={copyApiKey}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
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

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>
                Customize player colors (overrides global settings)
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
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cta">
          <Card>
            <CardHeader>
              <CardTitle>Smart Lead Capture</CardTitle>
              <CardDescription>
                Design your own lead capture funnel inside every video
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
                  <span className="font-medium">Enable Lead Capture</span>
                </label>
              </div>

              {formData.cta.enabled && (
                <>
                  {/* Capture Mode Selection */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-5">
                    <h4 className="font-semibold text-purple-900 mb-4">Capture Mode</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          cta: { ...formData.cta, captureMode: "instant_unlock" },
                        })}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.cta.captureMode === "instant_unlock"
                            ? "border-purple-500 bg-white shadow-md"
                            : "border-gray-200 bg-white/50 hover:border-purple-300"
                        }`}
                      >
                        <Lock className={`w-6 h-6 mb-2 ${formData.cta.captureMode === "instant_unlock" ? "text-purple-500" : "text-gray-400"}`} />
                        <h5 className="font-medium text-gray-900">Instant Unlock</h5>
                        <p className="text-xs text-gray-500 mt-1">Video locked until email submitted</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          cta: { ...formData.cta, captureMode: "smart_pause" },
                        })}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.cta.captureMode === "smart_pause"
                            ? "border-purple-500 bg-white shadow-md"
                            : "border-gray-200 bg-white/50 hover:border-purple-300"
                        }`}
                      >
                        <Play className={`w-6 h-6 mb-2 ${formData.cta.captureMode === "smart_pause" ? "text-purple-500" : "text-gray-400"}`} />
                        <h5 className="font-medium text-gray-900">Smart Pause</h5>
                        <p className="text-xs text-gray-500 mt-1">Video pauses, form appears, resumes after submit</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          cta: { ...formData.cta, captureMode: "adaptive" },
                        })}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          formData.cta.captureMode === "adaptive"
                            ? "border-purple-500 bg-white shadow-md"
                            : "border-gray-200 bg-white/50 hover:border-purple-300"
                        }`}
                      >
                        <Zap className={`w-6 h-6 mb-2 ${formData.cta.captureMode === "adaptive" ? "text-purple-500" : "text-gray-400"}`} />
                        <h5 className="font-medium text-gray-900">Adaptive</h5>
                        <p className="text-xs text-gray-500 mt-1">Auto-optimized timing for best conversion</p>
                      </button>
                    </div>
                  </div>

                  {/* Trigger Timing */}
                  {formData.cta.captureMode !== "instant_unlock" && (
                    <div className="border rounded-lg p-5">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gray-500" />
                        Trigger Timing
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Trigger Type</Label>
                          <select
                            value={formData.cta.trigger.type}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cta: {
                                  ...formData.cta,
                                  trigger: { ...formData.cta.trigger, type: e.target.value },
                                },
                              })
                            }
                            className="w-full h-10 px-3 border rounded-md bg-white"
                          >
                            <option value="time">After Time (seconds)</option>
                            <option value="percentage">After Percentage</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {formData.cta.trigger.type === "time" ? "Seconds" : "Percentage"} Value
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max={formData.cta.trigger.type === "time" ? 600 : 100}
                            value={formData.cta.trigger.value}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cta: {
                                  ...formData.cta,
                                  trigger: { ...formData.cta.trigger, value: parseInt(e.target.value) || 30 },
                                },
                              })
                            }
                            placeholder={formData.cta.trigger.type === "time" ? "30" : "50"}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="border rounded-lg p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Form Customization</h4>
                    
                    {/* Field Selection */}
                    <div className="space-y-3 mb-4">
                      <Label>Form Fields</Label>
                      <div className="flex flex-wrap gap-4">
                        {(["email", "name", "phone"] as const).map((field) => (
                          <label key={field} className="flex items-center gap-2 cursor-pointer">
                            <button
                              type="button"
                              onClick={() => {
                                const fields = formData.cta.form.fields.includes(field)
                                  ? formData.cta.form.fields.filter((f: string) => f !== field)
                                  : [...formData.cta.form.fields, field]
                                setFormData({
                                  ...formData,
                                  cta: {
                                    ...formData.cta,
                                    form: { ...formData.cta.form, fields },
                                  },
                                })
                              }}
                              className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                              style={{
                                borderColor: formData.cta.form.fields.includes(field) ? formData.cta.buttonColor : "#d1d5db",
                                backgroundColor: formData.cta.form.fields.includes(field) ? formData.cta.buttonColor : "transparent",
                              }}
                            >
                              {formData.cta.form.fields.includes(field) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </button>
                            <span className="text-sm flex items-center gap-1">
                              {field === "email" && <Mail className="w-4 h-4" />}
                              {field === "name" && <User className="w-4 h-4" />}
                              {field === "phone" && <Phone className="w-4 h-4" />}
                              {field.charAt(0).toUpperCase() + field.slice(1)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Form Text */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Gate Icon Text</Label>
                        <Input
                          value={formData.cta.form.ctaText || "Get Started"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta: {
                                ...formData.cta,
                                form: { ...formData.cta.form, ctaText: e.target.value },
                              },
                            })
                          }
                          placeholder="Get Started"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Headline</Label>
                        <Input
                          value={formData.cta.form.headline}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta: {
                                ...formData.cta,
                                form: { ...formData.cta.form, headline: e.target.value },
                              },
                            })
                          }
                          placeholder="Get Started"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          value={formData.cta.form.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta: {
                                ...formData.cta,
                                form: { ...formData.cta.form, description: e.target.value },
                              },
                            })
                          }
                          placeholder="Enter your details to continue"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Button Text</Label>
                        <Input
                          value={formData.cta.form.buttonText}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta: {
                                ...formData.cta,
                                form: { ...formData.cta.form, buttonText: e.target.value },
                              },
                            })
                          }
                          placeholder="Submit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Thank You Message</Label>
                        <Input
                          value={formData.cta.form.thankYouMessage}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta: {
                                ...formData.cta,
                                form: { ...formData.cta.form, thankYouMessage: e.target.value },
                              },
                            })
                          }
                          placeholder="Thanks! Enjoy the video."
                        />
                      </div>
                    </div>

                    {/* Button Color */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label>Button Color</Label>
                        <div className="flex gap-3">
                          <input
                            type="color"
                            value={formData.cta.buttonColor}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cta: { ...formData.cta, buttonColor: e.target.value },
                              })
                            }
                            className="w-12 h-10 p-1 border rounded cursor-pointer"
                          />
                          <Input
                            value={formData.cta.buttonColor}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cta: { ...formData.cta, buttonColor: e.target.value },
                              })
                            }
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Skip Button Text</Label>
                        <Input
                          value={formData.cta.secondaryButtonText || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta: { ...formData.cta, secondaryButtonText: e.target.value },
                            })
                          }
                          placeholder="Skip for now"
                        />
                        <p className="text-sm text-gray-500">Optional dismiss button</p>
                      </div>
                    </div>
                  </div>

                  {/* Smart Rules */}
                  <div className="border rounded-lg p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Smart Rules</h4>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.cta.rules.skipIfKnownUser}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta: {
                                ...formData.cta,
                                rules: { ...formData.cta.rules, skipIfKnownUser: e.target.checked },
                              },
                            })
                          }
                          className="w-4 h-4"
                        />
                        <div>
                          <span className="font-medium">Skip for known users</span>
                          <p className="text-sm text-gray-500">Don&apos;t show gate to visitors who already submitted</p>
                        </div>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Re-show after (days)</Label>
                          <Input
                            type="number"
                            min="1"
                            max="365"
                            value={formData.cta.rules.reTriggerAfterDays}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cta: {
                                  ...formData.cta,
                                  rules: { ...formData.cta.rules, reTriggerAfterDays: parseInt(e.target.value) || 7 },
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Submit Action */}
                  <div className="border rounded-lg p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">After Submission</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Action</Label>
                          <select
                            value={formData.cta.onSubmit.action}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                cta: {
                                  ...formData.cta,
                                  onSubmit: { ...formData.cta.onSubmit, action: e.target.value },
                                },
                              })
                            }
                            className="w-full h-10 px-3 border rounded-md bg-white"
                          >
                            <option value="resume">Resume Video</option>
                            <option value="redirect">Redirect to URL</option>
                          </select>
                        </div>
                        {formData.cta.onSubmit.action === "redirect" && (
                          <div className="space-y-2">
                            <Label>Redirect URL</Label>
                            <Input
                              value={formData.cta.onSubmit.redirectUrl}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  cta: {
                                    ...formData.cta,
                                    onSubmit: { ...formData.cta.onSubmit, redirectUrl: e.target.value },
                                  },
                                })
                              }
                              placeholder="https://example.com/thank-you"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Player Behavior */}
                  <div className="border rounded-lg p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Player Behavior</h4>
                    <div className="space-y-4">
                      {/* Auto-play Muted */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.cta.autoPlayMuted}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta: { ...formData.cta, autoPlayMuted: e.target.checked },
                            })
                          }
                          className="w-4 h-4"
                        />
                        <div>
                          <span className="font-medium">Auto-play muted</span>
                          <p className="text-sm text-gray-500">Videos start muted (better for user experience)</p>
                        </div>
                      </label>

                      {/* Skip Protection */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.cta.skipProtection.enabled}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta: {
                                ...formData.cta,
                                skipProtection: { ...formData.cta.skipProtection, enabled: e.target.checked },
                              },
                            })
                          }
                          className="w-4 h-4"
                        />
                        <div>
                          <span className="font-medium">Skip Protection</span>
                          <p className="text-sm text-gray-500">Prevent viewers from skipping past the gate</p>
                        </div>
                      </label>

                      {formData.cta.skipProtection.enabled && (
                        <div className="ml-7 grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Block seek after (seconds)</Label>
                            <Input
                              type="number"
                              min="1"
                              max="600"
                              value={formData.cta.skipProtection.blockAfterSeconds}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  cta: {
                                    ...formData.cta,
                                    skipProtection: {
                                      ...formData.cta.skipProtection,
                                      blockAfterSeconds: parseInt(e.target.value) || 30,
                                    },
                                  },
                                })
                              }
                              placeholder="30"
                            />
                            <p className="text-xs text-gray-500">Viewers can't seek past this point</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social Proof */}
                  <div className="border rounded-lg p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Social Proof</h4>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.cta.socialProof.enabled}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              cta: {
                                ...formData.cta,
                                socialProof: { ...formData.cta.socialProof, enabled: e.target.checked },
                              },
                            })
                          }
                          className="w-4 h-4"
                        />
                        <div>
                          <span className="font-medium">Show lead count</span>
                          <p className="text-sm text-gray-500">Display "Join X others" badge on the gate</p>
                        </div>
                      </label>

                      {formData.cta.socialProof.enabled && (
                        <div className="ml-7 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Starting count</Label>
                              <Input
                                type="number"
                                min="0"
                                value={formData.cta.socialProof.baseCount}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    cta: {
                                      ...formData.cta,
                                      socialProof: {
                                        ...formData.cta.socialProof,
                                        baseCount: parseInt(e.target.value) || 0,
                                      },
                                    },
                                  })
                                }
                                placeholder="1240"
                              />
                              <p className="text-xs text-gray-500">Initial display count</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Daily increment</Label>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.cta.socialProof.incrementPerDay}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    cta: {
                                      ...formData.cta,
                                      socialProof: {
                                        ...formData.cta.socialProof,
                                        incrementPerDay: parseInt(e.target.value) || 0,
                                      },
                                    },
                                  })
                                }
                                placeholder="2"
                              />
                              <p className="text-xs text-gray-500">Gradually increase over time</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Display text</Label>
                            <Input
                              value={formData.cta.socialProof.text}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  cta: {
                                    ...formData.cta,
                                    socialProof: { ...formData.cta.socialProof, text: e.target.value },
                                  },
                                })
                              }
                              placeholder="Join {count} others"
                            />
                            <p className="text-xs text-gray-500">Use {"{count}"} as placeholder</p>
                          </div>
                        </div>
                      )}
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
                Add this code to your website to enable the custom player
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm">
                <code className="text-green-400 break-all">
                  {`<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://shrazen.com"}/player.min.js" data-site-id="${installation.id}"></script>`}
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
                  <li>Paste it before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag on your website</li>
                  <li>All YouTube embeds will be automatically replaced!</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
