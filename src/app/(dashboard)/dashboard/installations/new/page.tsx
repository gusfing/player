"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, Copy, Check, ExternalLink } from "lucide-react"

type Platform = "wordpress" | "shopify" | "custom" | null

interface Installation {
  id: string
  domain: string
  platform: string
  apiKey: string
}

export default function NewInstallationPage() {
  const [step, setStep] = useState(1)
  const [platform, setPlatform] = useState<Platform>(null)
  const [domain, setDomain] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [installation, setInstallation] = useState<Installation | null>(null)

  const handlePlatformSelect = (p: Platform) => {
    setPlatform(p)
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!platform || !domain.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/installations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim(),
          platform,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setInstallation(data)
        setStep(3)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to create installation")
      }
    } catch (err) {
      console.error("Failed to create installation:", err)
      alert("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const copyEmbedCode = () => {
    const code = `<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://shrazen.com"}/player.min.js" data-site-id="${installation?.id}"></script>`
    navigator.clipboard.writeText(code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const copyApiKey = () => {
    navigator.clipboard.writeText(installation?.apiKey || "")
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/installations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Installation</h1>
          <p className="text-gray-500 mt-1">Connect your website or platform</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
            <span className={`text-sm ${s <= step ? "font-medium" : "text-gray-400"}`}>
              {s === 1 ? "Platform" : s === 2 ? "Configure" : "Install"}
            </span>
            {s < 3 && <div className="w-12 h-px bg-gray-200 ml-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Platform */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Platform</CardTitle>
              <CardDescription>
                Select the platform where you want to install YouTube Shell
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <button
                onClick={() => handlePlatformSelect("wordpress")}
                className="p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-xl mb-4">
                  W
                </div>
                <h3 className="font-semibold text-lg mb-1">WordPress</h3>
                <p className="text-sm text-gray-500">
                  Install our plugin on your WordPress site
                </p>
              </button>
              <button
                onClick={() => handlePlatformSelect("shopify")}
                className="p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-green-500 text-white flex items-center justify-center font-bold text-xl mb-4">
                  S
                </div>
                <h3 className="font-semibold text-lg mb-1">Shopify</h3>
                <p className="text-sm text-gray-500">
                  Add our app to your Shopify store
                </p>
              </button>
              <button
                onClick={() => handlePlatformSelect("custom")}
                className="p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-500 text-white flex items-center justify-center font-bold text-xl mb-4">
                  C
                </div>
                <h3 className="font-semibold text-lg mb-1">Custom HTML</h3>
                <p className="text-sm text-gray-500">
                  Add our script to any website
                </p>
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {platform === "wordpress" && "Install WordPress Plugin"}
                {platform === "shopify" && "Install Shopify App"}
                {platform === "custom" && "Add Custom Embed Code"}
              </CardTitle>
              <CardDescription>
                {platform === "wordpress" && "Enter your WordPress site domain"}
                {platform === "shopify" && "Enter your Shopify store domain"}
                {platform === "custom" && "Enter your website domain"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="domain">Website Domain</Label>
                <Input
                  id="domain"
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                />
                <p className="text-sm text-gray-500">
                  Enter the domain where you want to track YouTube videos
                </p>
              </div>

              {platform === "custom" && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Embed Code</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    After creating, you&apos;ll get a code to add to your website
                  </p>
                  <code className="text-sm bg-gray-100 px-3 py-2 rounded block">
                    {`<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://shrazen.com"}/player.min.js" data-site-id="YOUR_ID"></script>`}
                  </code>
                </div>
              )}

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={!domain.trim() || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Installation"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Installation Instructions */}
      {step === 3 && installation && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Installation Created!</CardTitle>
              <CardDescription>
                Your installation for {installation.domain} is ready. Follow the detailed guide below.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {platform === "wordpress" && (
                <>
                  <div className="space-y-2">
                    <Label>Your API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        value={installation.apiKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" onClick={copyApiKey}>
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link href={`/dashboard/installations/new/wordpress?apiKey=${installation.apiKey}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open WordPress Guide
                      </Link>
                    </Button>
                  </div>
                </>
              )}

              {platform === "shopify" && (
                <>
                  <div className="space-y-2">
                    <Label>Your API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        value={installation.apiKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button variant="outline" onClick={copyApiKey}>
                        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link href={`/dashboard/installations/new/shopify?apiKey=${installation.apiKey}&domain=${installation.domain}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Shopify Guide
                      </Link>
                    </Button>
                  </div>
                </>
              )}

              {platform === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label>Embed Code</Label>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <code className="text-green-400 text-sm break-all">
                        {`<script src="${process.env.NEXT_PUBLIC_APP_URL || "https://shrazen.com"}/player.min.js" data-site-id="${installation.id}"></script>`}
                      </code>
                    </div>
                    <Button variant="outline" onClick={copyEmbedCode}>
                      {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {isCopied ? "Copied!" : "Copy Code"}
                    </Button>
                  </div>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link href={`/dashboard/installations/new/custom?siteId=${installation.id}`}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Custom HTML Guide
                      </Link>
                    </Button>
                  </div>
                </>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-4">
                  After completing installation, your site will show as &quot;Active&quot; once the plugin sends its first heartbeat.
                </p>
                <div className="flex gap-4">
                  <Link href="/dashboard/installations">
                    <Button variant="outline">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link href={`/dashboard/installations/${installation.id}`}>
                    <Button>
                      Configure Settings
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
