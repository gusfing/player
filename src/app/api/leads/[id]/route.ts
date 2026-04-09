import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const lead = await prisma.leadCapture.findUnique({
      where: { id },
      include: {
        installation: true,
      },
    })

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    if (lead.installation.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error("Error fetching lead:", error)
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, notes, tags } = body

    const existingLead = await prisma.leadCapture.findUnique({
      where: { id },
      include: {
        installation: true,
      },
    })

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    if (existingLead.installation.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const customFields: Record<string, unknown> = {}
    if (typeof existingLead.customFields === "string") {
      try {
        Object.assign(customFields, JSON.parse(existingLead.customFields))
      } catch {
        // ignore
      }
    } else if (existingLead.customFields) {
      Object.assign(customFields, existingLead.customFields as Record<string, unknown>)
    }

    if (notes !== undefined) {
      customFields.notes = notes
    }
    if (tags !== undefined) {
      customFields.tags = tags
    }

    const lead = await prisma.leadCapture.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingLead.name,
          customFields: customFields as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error("Error updating lead:", error)
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existingLead = await prisma.leadCapture.findUnique({
      where: { id },
      include: {
        installation: true,
      },
    })

    if (!existingLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 })
    }

    if (existingLead.installation.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.leadCapture.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting lead:", error)
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 })
  }
}
