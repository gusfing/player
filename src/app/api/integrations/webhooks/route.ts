import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

const WEBHOOK_LIMITS: Record<string, number> = {
  free: 1,
  starter: 5,
  pro: -1,
}

function generateSecret(): string {
  return `yt_wh_${crypto.randomUUID().replace(/-/g, "").substring(0, 32)}`
}

async function getOrCreateUser(user: { id: string; emailAddresses: Array<{ emailAddress: string }> }): Promise<{ id: string; tier: string }> {
  const userEmail = user.emailAddresses[0]?.emailAddress
  if (!userEmail) {
    throw new Error("No email found")
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  if (dbUser) {
    return dbUser
  }

  return prisma.user.create({
    data: {
      clerkId: user.id,
      email: userEmail,
    },
  })
}

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let dbUser: { id: string; tier: string }
    try {
      dbUser = await getOrCreateUser(user) as { id: string; tier: string }
    } catch {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    const webhooks = await prisma.webhook.findMany({
      where: { userId: dbUser.id },
      include: {
        stats: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const limit = WEBHOOK_LIMITS[dbUser.tier] || 1

    return NextResponse.json({
      webhooks,
      limit,
      used: webhooks.length,
      unlimited: limit === -1,
    })
  } catch (error) {
    console.error("Error fetching webhooks:", error)
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let dbUser: { id: string; tier: string }
    try {
      dbUser = await getOrCreateUser(user) as { id: string; tier: string }
    } catch {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    const currentCount = await prisma.webhook.count({
      where: { userId: dbUser.id },
    })

    const limit = WEBHOOK_LIMITS[dbUser.tier] || 1
    if (limit !== -1 && currentCount >= limit) {
      return NextResponse.json(
        { error: `Webhook limit reached (${limit}). Upgrade to create more.` },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, url, events } = body

    if (!name || !url || !events || events.length === 0) {
      return NextResponse.json(
        { error: "Name, URL, and at least one event required" },
        { status: 400 }
      )
    }

    const validEvents = [
      "video_played",
      "video_progress",
      "video_completed",
      "video_paused",
      "video_session_ended",
      "cta_clicked",
      "lead_captured",
    ]

    const invalidEvents = events.filter((e: string) => !validEvents.includes(e))
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: `Invalid events: ${invalidEvents.join(", ")}` },
        { status: 400 }
      )
    }

    const secret = generateSecret()

    const webhook = await prisma.webhook.create({
      data: {
        userId: dbUser.id,
        name,
        url,
        secret,
        events,
        stats: {
          create: {
            successCount: 0,
            failureCount: 0,
          },
        },
      },
      include: {
        stats: true,
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    console.error("Error creating webhook:", error)
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}
