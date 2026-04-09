import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { sendTestEmail } from "@/lib/email"

export async function POST() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = user.emailAddresses[0]?.emailAddress
    if (!userEmail) {
      return NextResponse.json({ error: "No email found" }, { status: 400 })
    }

    const success = await sendTestEmail(userEmail)

    if (success) {
      return NextResponse.json({ success: true, message: "Test email sent" })
    } else {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error sending test email:", error)
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 })
  }
}
