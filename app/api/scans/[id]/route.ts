import { type NextRequest, NextResponse } from "next/server"
import { getScanResult } from "@/lib/redis"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the user from the cookie
    const userCookie = request.cookies.get("user")?.value
    if (!userCookie) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = JSON.parse(userCookie)

    // Get the scan result
    const scanResult = await getScanResult(params.id)

    if (!scanResult) {
      return NextResponse.json({ error: "Scan result not found" }, { status: 404 })
    }

    // Check if the scan belongs to the user
    if (scanResult.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json(scanResult)
  } catch (error) {
    console.error("Error fetching scan result:", error)
    return NextResponse.json({ error: "Failed to fetch scan result" }, { status: 500 })
  }
}

