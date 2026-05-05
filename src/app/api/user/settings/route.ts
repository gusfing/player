import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { User } from "@prisma/client"
import { getActiveUser } from "@/lib/mock-auth"

function generateApiKey(): string {
  return `yt_shell_${crypto.randomUUID().replace(/-/g, "")}`
}

async function getOrCreateUser(user: any): Promise<User> {
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
    const user = await getActiveUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dbUser = await getOrCreateUser(user)

    return NextResponse.json({
      masterApiKey: dbUser.masterApiKey,
      globalBrandingConfig: dbUser.globalBrandingConfig,
      globalCtaConfig: dbUser.globalCtaConfig,
      globalMetaPixelId: dbUser.globalMetaPixelId,
    })
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getActiveUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let dbUser: { id: string; masterApiKey: string; globalBrandingConfig: unknown; globalCtaConfig: unknown; globalMetaPixelId: string | null }
    try {
      dbUser = await getOrCreateUser(user) as { id: string; masterApiKey: string; globalBrandingConfig: unknown; globalCtaConfig: unknown; globalMetaPixelId: string | null }
    } catch (emailError) {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    const body = await request.json()
    const { globalBrandingConfig, globalCtaConfig, globalMetaPixelId, regenerateApiKey } = body

    const updateData: Record<string, unknown> = {}

    if (globalBrandingConfig !== undefined) {
      updateData.globalBrandingConfig = globalBrandingConfig
    }
    if (globalCtaConfig !== undefined) {
      updateData.globalCtaConfig = globalCtaConfig
    }
    if (globalMetaPixelId !== undefined) {
      updateData.globalMetaPixelId = globalMetaPixelId
    }
    if (regenerateApiKey) {
      updateData.masterApiKey = generateApiKey()
    }

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: updateData,
    })

    return NextResponse.json({
      masterApiKey: updated.masterApiKey,
      globalBrandingConfig: updated.globalBrandingConfig,
      globalCtaConfig: updated.globalCtaConfig,
      globalMetaPixelId: updated.globalMetaPixelId,
    })
  } catch (error) {
    console.error("Error updating user settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
