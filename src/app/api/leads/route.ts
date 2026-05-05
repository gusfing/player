import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { dispatchToWebhooks } from "@/lib/webhook"
import { sendLeadNotification, sendHotLeadNotification } from "@/lib/email"
import { publicRateLimit, getClientIP } from "@/lib/rate-limit"
import { getCorsHeaders } from "@/lib/cors"

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin")

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin",
    },
  })
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin")
    const ip = getClientIP(request)

    if (publicRateLimit) {
      const { success } = await publicRateLimit.limit(ip)

      if (!success) {
        const response = NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
        response.headers.set("Access-Control-Allow-Origin", origin || "*")
        response.headers.set("Vary", "Origin")
        return response
      }
    }

    const body = await request.json()
    const { installationId, siteId, videoId, email, name, phone, url, ipHash, userAgent } = body

    const finalInstallationId = installationId || siteId

    if (!finalInstallationId || !email) {
      const response = NextResponse.json({ error: "Installation ID and email required" }, { status: 400 })
      response.headers.set("Access-Control-Allow-Origin", origin || "*")
      response.headers.set("Vary", "Origin")
      return response
    }

    const installation = await prisma.installation.findUnique({
      where: { id: finalInstallationId },
    })

    if (!installation) {
      const response = NextResponse.json({ error: "Installation not found" }, { status: 404 })
      response.headers.set("Access-Control-Allow-Origin", origin || "*")
      response.headers.set("Vary", "Origin")
      return response
    }

    const user = await prisma.user.findUnique({
      where: { id: installation.userId },
    })

    const normalizedEmail = email.toLowerCase().trim()

    const existingLead = await prisma.leadCapture.findFirst({
      where: {
        installationId: finalInstallationId,
        email: normalizedEmail,
      },
    })

    let lead
    let isNew = false
    let isHotLead = false

    if (existingLead) {
      const updatedCustomFields: Record<string, unknown> = {}
      if (typeof existingLead.customFields === "string") {
        try {
          Object.assign(updatedCustomFields, JSON.parse(existingLead.customFields))
        } catch {
          // ignore parse errors
        }
      } else if (existingLead.customFields) {
        Object.assign(updatedCustomFields, existingLead.customFields as Record<string, unknown>)
      }
      
      if (phone) {
        updatedCustomFields.phone = phone
      }

      const newSubmissionCount = existingLead.submissionCount + 1

      lead = await prisma.leadCapture.update({
        where: { id: existingLead.id },
        data: {
          name: name || existingLead.name,
          customFields: Object.keys(updatedCustomFields).length > 0 ? updatedCustomFields as unknown as Prisma.InputJsonValue : undefined,
          submissionCount: newSubmissionCount,
          lastSubmittedAt: new Date(),
          ipHash,
          userAgent,
        },
      })

      if (newSubmissionCount >= 2) {
        isHotLead = true
      }
    } else {
      isNew = true
      lead = await prisma.leadCapture.create({
        data: {
          installationId: finalInstallationId,
          userId: installation.userId,
          email: normalizedEmail,
          name,
          customFields: phone ? JSON.stringify({ phone }) : undefined,
          submissionCount: 1,
          lastSubmittedAt: new Date(),
          ipHash,
          userAgent,
        },
      })
    }

    await prisma.siteAnalytics.create({
      data: {
        installationId: finalInstallationId,
        eventType: "lead_captured",
        youtubeUrl: url || "",
      },
    })

    dispatchToWebhooks(finalInstallationId, "lead_captured", {
      email: normalizedEmail,
      name,
      phone,
      url,
      submissionCount: lead.submissionCount,
      isHotLead,
    })

    if (user?.email) {
      if (isHotLead) {
        sendHotLeadNotification(user.email, {
          email: normalizedEmail,
          name: lead.name || undefined,
          phone,
          submissionCount: lead.submissionCount,
        }, installation.domain)
      } else if (isNew) {
        sendLeadNotification(user.email, {
          email: normalizedEmail,
          name: name || undefined,
          phone,
        }, installation.domain)
      }
    }

    const response = NextResponse.json({
      success: true,
      leadId: lead.id,
      isNew,
      submissionCount: lead.submissionCount,
      isHotLead,
    })
    
    // Add CORS headers
    const corsHeaders = await getCorsHeaders(finalInstallationId)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    response.headers.set("Vary", "Origin")

    return response
  } catch (error) {
    console.error("Error capturing lead:", error)
    const response = NextResponse.json({ error: "Failed to capture lead" }, { status: 500 })
    response.headers.set("Access-Control-Allow-Origin", origin || "*")
    response.headers.set("Vary", "Origin")
    return response
  }
}

export async function GET(request: Request) {
  try {
    const origin = request.headers.get("origin")
    const { searchParams } = new URL(request.url)
    const installationId = searchParams.get("installationId") || searchParams.get("siteId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
    const skip = (page - 1) * limit

    if (!installationId) {
      const response = NextResponse.json({ error: "Installation ID required" }, { status: 400 })
      response.headers.set("Access-Control-Allow-Origin", origin || "*")
      response.headers.set("Vary", "Origin")
      return response
    }

    const [leads, total] = await Promise.all([
      prisma.leadCapture.findMany({
        where: { installationId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.leadCapture.count({
        where: { installationId },
      }),
    ])

    const response = NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
    
    // Add CORS headers
    const corsHeaders = await getCorsHeaders(installationId)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    response.headers.set("Vary", "Origin")

    return response
  } catch (error) {
    console.error("Error fetching leads:", error)
    const response = NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 })
    response.headers.set("Access-Control-Allow-Origin", origin || "*")
    response.headers.set("Vary", "Origin")
    return response
  }
}
