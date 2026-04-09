import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const webhook = await prisma.webhook.findUnique({
      where: { id },
      include: {
        stats: true,
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail! },
    })

    if (!dbUser || webhook.userId !== dbUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(webhook)
  } catch (error) {
    console.error("Error fetching webhook:", error)
    return NextResponse.json({ error: "Failed to fetch webhook" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const webhook = await prisma.webhook.findUnique({
      where: { id },
    })

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail! },
    })

    if (!dbUser || webhook.userId !== dbUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const allowedUpdates = ["name", "url", "events", "enabled"]
    const updateData: Record<string, unknown> = {}

    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        if (key === "events") {
          const validEvents = [
            "video_played",
            "video_progress",
            "video_completed",
            "video_paused",
            "video_session_ended",
            "cta_clicked",
            "lead_captured",
          ]
          const invalidEvents = (body[key] as string[]).filter((e: string) => !validEvents.includes(e))
          if (invalidEvents.length > 0) {
            return NextResponse.json(
              { error: `Invalid events: ${invalidEvents.join(", ")}` },
              { status: 400 }
            )
          }
        }
        updateData[key] = body[key]
      }
    }

    const updated = await prisma.webhook.update({
      where: { id },
      data: updateData,
      include: {
        stats: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating webhook:", error)
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const webhook = await prisma.webhook.findUnique({
      where: { id },
    })

    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail! },
    })

    if (!dbUser || webhook.userId !== dbUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.webhook.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting webhook:", error)
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 })
  }
}
