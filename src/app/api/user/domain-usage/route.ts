import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { User } from "@prisma/client"
import { getUserDomainUsage, syncDomainCache } from "@/lib/plans"

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

export async function GET() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getOrCreateUser(clerkUser)
    const usage = await getUserDomainUsage(user.id)

    return NextResponse.json(usage)
  } catch (error) {
    console.error("Error fetching domain usage:", error)
    return NextResponse.json({ error: "Failed to fetch domain usage" }, { status: 500 })
  }
}

export async function POST() {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await getOrCreateUser(clerkUser)
    const count = await syncDomainCache(user.id)

    return NextResponse.json({
      used: count,
      message: "Domain cache synced successfully"
    })
  } catch (error) {
    console.error("Error syncing domain cache:", error)
    return NextResponse.json({ error: "Failed to sync domain cache" }, { status: 500 })
  }
}
