import { type NextRequest, NextResponse } from "next/server"
import { getUserScanResults } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    // Get the user from the cookie
    const userCookie = request.cookies.get("user")?.value
    if (!userCookie) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = JSON.parse(userCookie)

    // Get the user's scan results
    const scanResults = await getUserScanResults(user.id, 10)

    return NextResponse.json(scanResults)
  } catch (error) {
    console.error("Error fetching user scans:", error)
    return NextResponse.json({ error: "Failed to fetch user scans" }, { status: 500 })
  }
}

