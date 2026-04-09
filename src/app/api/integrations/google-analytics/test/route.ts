import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { testGoogleAnalyticsConnection } from "@/lib/google-analytics"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { measurementId, apiSecret } = body

    if (!measurementId || !apiSecret) {
      return NextResponse.json(
        { error: "Measurement ID and API Secret are required" },
        { status: 400 }
      )
    }

    const result = await testGoogleAnalyticsConnection(measurementId, apiSecret)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error testing Google Analytics connection:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
