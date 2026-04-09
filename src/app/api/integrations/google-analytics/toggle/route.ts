import { NextRequest, NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { User } from "@prisma/client"

async function getOrCreateUser(user: { id: string; emailAddresses: Array<{ emailAddress: string }> }): Promise<User> {
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

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let dbUser: User
    try {
      dbUser = await getOrCreateUser(user)
    } catch {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    const body = await request.json()
    const { enabled } = body

    const gaConfig = await prisma.googleAnalytics.findUnique({
      where: { userId: dbUser.id },
    })

    if (!gaConfig) {
      return NextResponse.json(
        { error: "Google Analytics not configured" },
        { status: 404 }
      )
    }

    const updated = await prisma.googleAnalytics.update({
      where: { userId: dbUser.id },
      data: { enabled },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error toggling Google Analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
