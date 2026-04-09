"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Check, ExternalLink, CheckCircle2, AlertCircle, ShoppingCart } from "lucide-react"

export default function ShopifyInstallPage() {
  const [step, setStep] = useState(1)
  const [shopDomain, setShopDomain] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [isCopied, setIsCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/installations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center font-bold">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Shopify Installation</h1>
            <p className="text-gray-500 mt-1">Install YouTube Shell on your Shopify store</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm ${s <= step ? "font-medium" : "text-gray-400"} hidden sm:inline`}>
              {s === 1 ? "Get API Key" : s === 2 ? "Install App" : s === 3 ? "Configure" : "Verify"}
            </span>
            {s < 4 && <div className="w-12 h-px bg-gray-200 ml-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Get API Key */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Get Your API Key</CardTitle>
            <CardDescription>
              Copy your API key from YouTube Shell dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Your API Key</Label>
              <div className="flex gap-2">
                <Input
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key here"
                  className="font-mono"
                />
                <Button variant="outline" onClick={() => copyToClipboard(apiKey)} disabled={!apiKey}>
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Find your API key in{" "}
                <Link href="/dashboard/settings" className="text-primary hover:underline">
                  Settings → API Key
                </Link>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Your Shopify Store Domain</Label>
              <Input
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                placeholder="yourstore.myshopify.com"
              />
              <p className="text-sm text-gray-500">
                Enter the domain of your Shopify store (without https://)
              </p>
            </div>

            <Button onClick={() => setStep(2)} disabled={!apiKey || !shopDomain}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Install App */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Install the Shopify App</CardTitle>
            <CardDescription>
              Add YouTube Shell to your Shopify store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Quick Install</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
                <li>Click the button below to open Shopify App Store</li>
                <li>Click &quot;Add app&quot; on the YouTube Shell listing</li>
                <li>Approve the required permissions</li>
                <li>The app will be installed automatically</li>
              </ol>
            </div>

            <div className="flex items-center gap-4">
              <Button asChild>
                <a 
                  href={`https://apps.shopify.com/youtube-shell?surface_detail=youtube+shell&surface_inter_position=1&surface_intra_position=4&surface_type=search`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Shopify App Store
                </a>
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Manual Install (Alternative)</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Go to your Shopify Admin</li>
                <li>Navigate to Apps → App Store</li>
                <li>Search for &quot;YouTube Shell&quot;</li>
                <li>Click &quot;Add app&quot; and approve permissions</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> YouTube Shell requires these permissions:
                  <ul className="list-disc list-inside mt-1">
                    <li>Read product information</li>
                    <li>Read and modify store theme</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep(3)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Configure the App</CardTitle>
            <CardDescription>
              Connect YouTube Shell to your Shopify store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <ol className="list-decimal list-inside space-y-3 text-sm">
                <li>Open the YouTube Shell app in your Shopify Admin</li>
                <li>You&apos;ll see a connection screen asking for your API key</li>
                <li>Paste your API key (from Step 1)</li>
                <li>Click <strong>Connect</strong></li>
                <li>The app will verify your account and activate</li>
              </ol>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">What gets installed:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Custom YouTube player on all pages</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Product video tracking</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Analytics dashboard in Shopify</span>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep(4)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Verify */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 4: Verify Installation</CardTitle>
            <CardDescription>
              Check that everything is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">App Connected!</p>
                  <p className="text-sm text-green-700">YouTube Shell is now active on your store</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Your Store</h4>
                  <code className="text-sm text-gray-600">{shopDomain}</code>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Status</h4>
                  <Badge className="bg-green-500">Active</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">What happens next:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li>All YouTube videos in your store will be enhanced</li>
                  <li>Videos in product descriptions will show custom player</li>
                  <li>Analytics will appear in your Shopify admin</li>
                  <li>Full analytics also available in your <Link href="/dashboard" className="text-primary">Dashboard</Link></li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">Quick Test</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Visit any product page with a YouTube video. The video should 
                  display with your custom branding.
                </p>
                <Button variant="outline" asChild>
                  <a href={`https://${shopDomain}`} target="_blank" rel="noopener noreferrer">
                    Open Store
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Link href="/dashboard/installations">
                <Button variant="outline">
                  Back to Installations
                </Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button>
                  View Analytics
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FAQ Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Shopify-Specific Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Can&apos;t find the app in Shopify?</h4>
              <p className="text-sm text-gray-600">Make sure you&apos;re logged into the correct Shopify store. Each store needs its own installation.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Videos not appearing in custom player?</h4>
              <p className="text-sm text-gray-600">YouTube Shell works with YouTube URLs embedded in: product descriptions, pages, and blog posts. Videos in apps like Ali Reviews may need additional configuration.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Theme editor not showing changes?</h4>
              <p className="text-sm text-gray-600">Some themes require you to publish the changes after adding apps. Check your theme settings.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Need help?</h4>
              <p className="text-sm text-gray-600">
                Contact support at{" "}
                <a href="mailto:support@youtubeshell.com" className="text-primary hover:underline">
                  support@youtubeshell.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
