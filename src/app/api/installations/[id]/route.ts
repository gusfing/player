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

    const installation = await prisma.installation.findUnique({
      where: { id },
    })

    if (!installation) {
      return NextResponse.json({ error: "Installation not found" }, { status: 404 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail! },
    })

    if (!dbUser || installation.userId !== dbUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(installation)
  } catch (error) {
    console.error("Error fetching installation:", error)
    return NextResponse.json({ error: "Failed to fetch installation" }, { status: 500 })
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

    const installation = await prisma.installation.findUnique({
      where: { id },
    })

    if (!installation) {
      return NextResponse.json({ error: "Installation not found" }, { status: 404 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail! },
    })

    if (!dbUser || installation.userId !== dbUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const allowedUpdates = [
      "domain",
      "brandingConfig",
      "ctaConfig",
      "metaPixelId",
      "googleAnalyticsId",
      "debugMode",
      "allowedDomains",
      "status",
    ]

    const updateData: Record<string, unknown> = {}
    for (const key of allowedUpdates) {
      if (body[key] !== undefined) {
        updateData[key] = body[key]
      }
    }

    const updated = await prisma.installation.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating installation:", error)
    return NextResponse.json({ error: "Failed to update installation" }, { status: 500 })
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

    const installation = await prisma.installation.findUnique({
      where: { id },
    })

    if (!installation) {
      return NextResponse.json({ error: "Installation not found" }, { status: 404 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail! },
    })

    if (!dbUser || installation.userId !== dbUser.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.installation.update({
      where: { id },
      data: { status: "deleted" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting installation:", error)
    return NextResponse.json({ error: "Failed to delete installation" }, { status: 500 })
  }
}
