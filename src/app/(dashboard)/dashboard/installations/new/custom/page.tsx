"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Copy, Check, Code, CheckCircle2, Globe, Terminal } from "lucide-react"

export default function CustomInstallPage() {
  const [step, setStep] = useState(1)
  const [siteId, setSiteId] = useState("")
  const [isCopied, setIsCopied] = useState(false)

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://shrazen.com"

  const embedCode = `<script src="${appUrl}/player.min.js" data-site-id="${siteId}"></script>`

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
          <div className="w-10 h-10 rounded-lg bg-gray-700 text-white flex items-center justify-center">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Custom HTML Installation</h1>
            <p className="text-gray-500 mt-1">Add YouTube Shell to any website</p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s <= step
                  ? "bg-gray-700 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm ${s <= step ? "font-medium" : "text-gray-400"} hidden sm:inline`}>
              {s === 1 ? "Get Code" : s === 2 ? "Add to Site" : "Verify"}
            </span>
            {s < 3 && <div className="w-12 h-px bg-gray-200 ml-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Get Embed Code */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Get Your Embed Code</CardTitle>
            <CardDescription>
              Copy this code and add it to your website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Your Site ID</Label>
              <div className="flex gap-2">
                <Input
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  placeholder="Enter your site ID"
                  className="font-mono"
                />
              </div>
              <p className="text-sm text-gray-500">
                Find your Site ID in your{" "}
                <Link href="/dashboard/installations" className="text-primary hover:underline">
                  Installations
                </Link>{" "}
                or Settings page
              </p>
            </div>

            <div className="space-y-2">
              <Label>Your Embed Code</Label>
              <div className="bg-gray-900 rounded-lg p-4 relative">
                <code className="text-green-400 text-sm break-all">{embedCode}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(embedCode)}
                  className="absolute top-2 right-2 text-white hover:bg-gray-800"
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                <li>The script automatically detects YouTube embeds</li>
                <li>No changes needed to existing YouTube videos</li>
                <li>Works on any HTML website</li>
                <li>One script replaces ALL YouTube players</li>
              </ul>
            </div>

            <Button onClick={() => setStep(2)} disabled={!siteId}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add to Site */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Add Code to Your Website</CardTitle>
            <CardDescription>
              Paste the embed code before the closing &lt;/body&gt; tag
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium">Standard HTML</span>
                </div>
                <div className="p-4 bg-white">
                  <ol className="list-decimal list-inside space-y-3 text-sm">
                    <li>Open your website&apos;s HTML files</li>
                    <li>Find the main template file (usually <code className="bg-gray-100 px-1 rounded">index.html</code> or <code className="bg-gray-100 px-1 rounded">footer.php</code>)</li>
                    <li>Find the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag</li>
                    <li>Paste the embed code just before it</li>
                    <li>Save and upload the file</li>
                  </ol>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Example</span>
                </div>
                <pre className="text-sm text-green-400 overflow-x-auto">
{`<html>
  <head>
    ...
  </head>
  <body>
    ... your content ...

${embedCode}
  </body>
</html>`}
                </pre>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">React / Next.js</h4>
                  <p className="text-sm text-gray-600 mb-2">Add to your root layout or _app.tsx:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    useEffect + script tag
                  </code>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Vue / Nuxt</h4>
                  <p className="text-sm text-gray-600 mb-2">Add to nuxt.config.ts:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    head.script[]
                  </code>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Wix / Squarespace</h4>
                  <p className="text-sm text-gray-600 mb-2">Use custom code embed widget:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    Settings → Custom Code
                  </code>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Webflow</h4>
                  <p className="text-sm text-gray-600 mb-2">Project Settings → Custom Code:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                    Footer section
                  </code>
                </div>
              </div>
            </div>

            <Button onClick={() => setStep(3)}>
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Verify */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Verify Installation</CardTitle>
            <CardDescription>
              Check that YouTube Shell is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Code Added!</p>
                <p className="text-sm text-green-700">Your website is now configured</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">What happens next:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>All YouTube embeds will be automatically detected (may take 5-10 minutes)</li>
                <li>Videos will show with your custom branding</li>
                <li>Analytics will start appearing in your dashboard</li>
                <li>View stats in <Link href="/dashboard" className="text-primary">Dashboard</Link></li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Quick Test</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Open your website in a browser</li>
                <li>Find a page with a YouTube video</li>
                <li>Right-click and &quot;View Page Source&quot;</li>
                <li>Search for &quot;youtube-shell&quot; or &quot;player.min.js&quot;</li>
                <li>If found, the script is installed correctly</li>
              </ol>
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

      {/* Tips Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Pro Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Placement Matters</h4>
              <p className="text-sm text-gray-600">
                Place the script as close to the closing body tag as possible for best performance.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Multiple Pages</h4>
              <p className="text-sm text-gray-600">
                If your site uses templates, add the code to your footer template - it will appear on all pages automatically.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">CDN Caching</h4>
              <p className="text-sm text-gray-600">
                The script is served from a CDN and may be cached. Clear your site cache after adding.
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">SPA Support</h4>
              <p className="text-sm text-gray-600">
                For Single Page Apps, the script auto-detects new YouTube embeds as content changes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Script not loading?</h4>
              <p className="text-sm text-gray-600">Check browser console (F12) for errors. Make sure the Site ID matches your dashboard.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Videos not showing custom player?</h4>
              <p className="text-sm text-gray-600">Wait 5-10 minutes for CDN cache to update. Also check if your site has Content Security Policy restrictions.</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Getting CORS errors?</h4>
              <p className="text-sm text-gray-600">Make sure your site domain matches the installation domain in your dashboard.</p>
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
