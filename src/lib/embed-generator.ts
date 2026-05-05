// Platform-specific embed code generator
// Generates optimized embed snippets for each target platform

export type Platform = "ghl" | "kajabi" | "kartra" | "clickfunnels" | "systeme" | "skool" | "circle" | "mightynetworks" | "wordpress" | "webflow" | "framer" | "learndash" | "tutorlms" | "gutenberg" | "generic"

interface EmbedOptions {
  installationId: string
  width?: number
  height?: number
  responsive?: boolean
  autoplay?: boolean
  mutedAutoplay?: boolean
  showControls?: boolean
}

interface GeneratedEmbed {
  platform: Platform
  label: string
  description: string
  code: string
  directUrl?: string
  instructions?: string[]
}

// Resize calculation for 16:9 aspect ratio
function calculateDimensions(width: number, height?: number): { width: number; height: number; paddingBottom: string } {
  const aspectRatio = 16 / 9
  if (height) {
    return { width, height, paddingBottom: `${(height / width) * 100}%` }
  }
  return { width, height: Math.round(width / aspectRatio), paddingBottom: "56.25%" }
}

// Get player base URL
function getPlayerUrl(path: string = ""): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || "https://player.shrazen.com"}${path}`
}

// Generate responsive wrapper HTML
function wrapIframe(src: string, options: EmbedOptions, extraStyles: string = ""): string {
  const { paddingBottom } = calculateDimensions(options.width || 800, options.height)
  const autoplayParams = options.mutedAutoplay
    ? "?autoplay=1&mute=1"
    : options.autoplay
    ? "?autoplay=1"
    : ""

  return `<div style="position: relative; padding-bottom: ${paddingBottom}; height: 0; overflow: hidden; max-width: 100%;${extraStyles}">
  <iframe
    src="${src}${autoplayParams}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    allow="autoplay; fullscreen; picture-in-picture"
    allowfullscreen
    title="Shrazen Video Player"
    loading="lazy">
  </iframe>
</div>`
}

// Generate fixed-size iframe (no wrapper)
function iframeFixed(src: string, options: EmbedOptions): string {
  const { width, height } = calculateDimensions(options.width || 800, options.height)
  const autoplayParams = options.mutedAutoplay
    ? "?autoplay=1&mute=1"
    : options.autoplay
    ? "?autoplay=1"
    : ""

  return `<iframe
  src="${src}${autoplayParams}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allow="autoplay; fullscreen; picture-in-picture"
  allowfullscreen
  title="Shrazen Video Player"
  loading="lazy">
</iframe>`
}

// Platform-specific generators
const generators: Record<Platform, (options: EmbedOptions) => GeneratedEmbed> = {
  ghl: (options) => ({
    platform: "ghl",
    label: "GoHighLevel",
    description: "Drag the Custom HTML/JS element onto your funnel page",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options),
    instructions: [
      "Open your GoHighLevel funnel builder",
      "Drag the 'Custom HTML/JS' element onto your page",
      "Paste the code below into the element",
      "Save and preview",
    ],
  }),

  kajabi: (options) => ({
    platform: "kajabi",
    label: "Kajabi",
    description: "Add a Custom Code block to your course module",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options),
    instructions: [
      "Open your Kajabi course or page builder",
      "Add a 'Custom Code' block",
      "Paste the code below",
      "Save changes",
    ],
  }),

  kartra: (options) => ({
    platform: "kartra",
    label: "Kartra",
    description: "Use the Custom HTML widget in your page editor",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options),
    instructions: [
      "Open your Kartra page editor",
      "Add a 'Custom HTML' section",
      "Paste the embed code",
      "Publish",
    ],
  }),

  clickfunnels: (options) => ({
    platform: "clickfunnels",
    label: "ClickFunnels",
    description: "Add Custom Code element to your funnel step",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options, " border-radius: 8px;"),
    instructions: [
      "Open ClickFunnels 2.0 or Classic editor",
      "Add a 'Custom Code' element to your step",
      "Paste the code",
      "Preview and publish",
    ],
  }),

  systeme: (options) => ({
    platform: "systeme",
    label: "Systeme.io",
    description: "Add HTML code block to your funnel",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options),
    instructions: [
      "Open your Systeme.io funnel",
      "Add a 'HTML Code' block",
      "Paste the embed code",
      "Save",
    ],
  }),

  skool: (options) => ({
    platform: "skool",
    label: "Skool",
    description: "Paste the direct URL - Skool auto-embeds!",
    code: getPlayerUrl(`/v/${options.installationId}`),
    directUrl: getPlayerUrl(`/v/${options.installationId}`),
    instructions: [
      "No code needed! Just paste the URL below",
      "Skool automatically detects and embeds videos",
      "Works in posts, comments, and descriptions",
    ],
  }),

  circle: (options) => ({
    platform: "circle",
    label: "Circle.so",
    description: "Paste direct URL in the text editor",
    code: getPlayerUrl(`/v/${options.installationId}`),
    directUrl: getPlayerUrl(`/v/${options.installationId}`),
    instructions: [
      "Paste the URL directly into Circle's text editor",
      "Circle auto-embeds video content",
      "Works in posts, bios, and descriptions",
    ],
  }),

  mightynetworks: (options) => ({
    platform: "mightynetworks",
    label: "Mighty Networks",
    description: "Paste the direct URL in posts and descriptions",
    code: getPlayerUrl(`/v/${options.installationId}`),
    directUrl: getPlayerUrl(`/v/${options.installationId}`),
    instructions: [
      "Copy the URL below",
      "Paste into Mighty Networks posts or descriptions",
      "Video will auto-embed",
    ],
  }),

  wordpress: (options) => ({
    platform: "wordpress",
    label: "WordPress",
    description: "Use Custom HTML widget in any page/post",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options),
    instructions: [
      "Edit your WordPress page or post",
      "Add a Custom HTML block (Gutenberg) or Text widget",
      "Paste the code",
      "Update/Publish",
    ],
  }),

  webflow: (options) => ({
    platform: "webflow",
    label: "Webflow",
    description: "Add an Embed element to your page",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options, " border-radius: 4px;"),
    instructions: [
      "Open Webflow Designer",
      "Add an Embed element to your page",
      "Paste the code inside the embed",
      "Publish",
    ],
  }),

  framer: (options) => ({
    platform: "framer",
    label: "Framer",
    description: "Use the Embed component",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options),
    instructions: [
      "Add an Embed component to your Framer page",
      "Paste the code",
      "Adjust sizing as needed",
    ],
  }),

  learndash: (options) => ({
    platform: "learndash",
    label: "LearnDash",
    description: "Add Custom Content template to your lesson",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options),
    instructions: [
      "Edit your LearnDash course lesson",
      "Add a Custom Content template or use Custom HTML",
      "Paste the embed code",
      "Update lesson",
    ],
  }),

  tutorlms: (options) => ({
    platform: "tutorlms",
    label: "TutorLMS",
    description: "Add HTML block to your lesson",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options),
    instructions: [
      "Edit your TutorLMS lesson",
      "Add a HTML block or use text editor in HTML mode",
      "Paste the code",
      "Save",
    ],
  }),

  gutenberg: (options) => ({
    platform: "gutenberg",
    label: "WordPress Gutenberg",
    description: "Add a Custom HTML block",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options),
    instructions: [
      "Open the Gutenberg block editor",
      "Add a new Custom HTML block",
      "Paste the code",
      "Publish",
    ],
  }),

  generic: (options) => ({
    platform: "generic",
    label: "Generic (Any Website)",
    description: "Works on any HTML-supported platform",
    code: wrapIframe(getPlayerUrl(`/v/${options.installationId}`), options),
    instructions: [
      "Find the Custom HTML or embeds section",
      "Paste the code",
      "Adjust width/height as needed",
    ],
  }),
}

/**
 * Generate embed code for a specific platform
 */
export function generateEmbed(platform: Platform, options: EmbedOptions): GeneratedEmbed {
  return generators[platform](options)
}

/**
 * Generate embed codes for all platforms
 */
export function generateAllEmbeds(options: EmbedOptions): GeneratedEmbed[] {
  return Object.values(generators).map((gen) => gen(options))
}

/**
 * Generate JavaScript snippet for advanced features
 * (pause-on-scroll, auto-pause when out of view, etc.)
 */
export function generateScriptSnippet(installationId: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_APP_URL || "https://player.shrazen.com"
  return `<script src="${cdnBase}/player.js" data-site-id="${installationId}"></script>`
}

/**
 * Get all supported platforms grouped by category
 */
export const platformCategories = {
  funnel: ["ghl", "kajabi", "kartra", "clickfunnels", "systeme"] as Platform[],
  community: ["skool", "circle", "mightynetworks"] as Platform[],
  cms: ["wordpress", "webflow", "framer", "gutenberg"] as Platform[],
  lms: ["learndash", "tutorlms"] as Platform[],
}

export const allPlatforms = Object.keys(generators) as Platform[]
