import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

function generateSecret(): string {
  return `yt_wh_${crypto.randomUUID().replace(/-/g, "").substring(0, 32)}`
}

export async function POST(
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

    const newSecret = generateSecret()

    const updated = await prisma.webhook.update({
      where: { id },
      data: { secret: newSecret },
    })

    return NextResponse.json({ secret: updated.secret })
  } catch (error) {
    console.error("Error rotating secret:", error)
    return NextResponse.json({ error: "Failed to rotate secret" }, { status: 500 })
  }
}
