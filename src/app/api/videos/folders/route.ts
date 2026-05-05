import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const MOCK_USER = {
  id: "user_2test1234567890",
  emailAddresses: [{ emailAddress: "test@example.com" }],
}

async function getUserFromRequest(): Promise<{ id: string } | null> {
  const user = MOCK_USER
  const userEmail = user?.emailAddresses?.[0]?.emailAddress
  if (!userEmail) return null

  const dbUser = await prisma.user.findUnique({
    where: { email: userEmail },
  })

  return dbUser || null
}

export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folders = await prisma.folder.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { videos: true },
        },
      },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({
      folders: folders.map((f) => ({
        ...f,
        videoCount: f._count?.videos || 0,
      })),
    })
  } catch (error) {
    console.error("Error fetching folders:", error)
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, color } = body

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    const existing = await prisma.folder.findFirst({
      where: { userId: user.id, name },
    })

    if (existing) {
      return NextResponse.json({ error: "Folder with this name already exists" }, { status: 409 })
    }

    const maxOrder = await prisma.folder.aggregate({
      where: { userId: user.id },
      _max: { sortOrder: true },
    })

    const folder = await prisma.folder.create({
      data: {
        userId: user.id,
        name: name.trim(),
        color: color || "#6366f1",
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    })

    return NextResponse.json({ folder }, { status: 201 })
  } catch (error) {
    console.error("Error creating folder:", error)
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, color, sortOrder } = body

    if (!id) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 })
    }

    const folder = await prisma.folder.findFirst({
      where: { id, userId: user.id },
    })

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    const updated = await prisma.folder.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json({ folder: updated })
  } catch (error) {
    console.error("Error updating folder:", error)
    return NextResponse.json({ error: "Failed to update folder" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUserFromRequest()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 })
    }

    const folder = await prisma.folder.findFirst({
      where: { id, userId: user.id },
    })

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    await prisma.video.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    })

    await prisma.folder.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting folder:", error)
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 })
  }
}