import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import type { ScanRequest, ScanResult, Detection } from "@/lib/types"
import { saveScanResult, getDetectionPatterns } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    // Get the user from the cookie
    const userCookie = request.cookies.get("user")?.value
    if (!userCookie) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const user = JSON.parse(userCookie)
    const body = await request.json()
    const { provider, environment, resourceGroup, region, scanType } = body as ScanRequest

    if (!provider || !environment || !scanType) {
      return NextResponse.json({ error: "Provider, environment, and scan type are required" }, { status: 400 })
    }

    // Generate a unique scan ID
    const scanId = uuidv4()

    // In a real implementation, this would initiate an actual scan
    // For demo purposes, we'll generate a mock result
    const scanResult = await generateMockScanResult(
      scanId,
      {
        provider,
        environment,
        resourceGroup,
        region,
        scanType,
      },
      user.id,
    )

    // Save the scan result to Redis
    await saveScanResult(scanResult)

    return NextResponse.json({ scanId })
  } catch (error) {
    console.error("Error processing scan:", error)
    return NextResponse.json({ error: "Failed to process scan request" }, { status: 500 })
  }
}

async function generateMockScanResult(scanId: string, request: ScanRequest, userId: string): Promise<ScanResult> {
  // Get all possible detections
  const possibleDetections = await getDetectionPatterns()

  // Determine number of detections based on scan type
  let maxDetections = 3
  if (request.scanType === "comprehensive") {
    maxDetections = 5
  } else if (request.scanType === "deep") {
    maxDetections = 8
  }

  // Generate between 0 and maxDetections random detections
  const numDetections = Math.floor(Math.random() * (maxDetections + 1))
  const detections: Detection[] = []

  // Randomly select detections
  const selectedIndices = new Set<number>()
  while (selectedIndices.size < numDetections && selectedIndices.size < possibleDetections.length) {
    selectedIndices.add(Math.floor(Math.random() * possibleDetections.length))
  }

  Array.from(selectedIndices).forEach((index) => {
    const detection = { ...possibleDetections[index] }

    // Customize the location based on the scan request
    detection.location = `${request.provider}/${request.environment}${request.resourceGroup ? `/${request.resourceGroup}` : ""}${request.region ? `/${request.region}` : ""}/${detection.location}`

    detections.push(detection)
  })

  // Count detections by severity
  const highSeverity = detections.filter((d) => d.severity === "high").length
  const mediumSeverity = detections.filter((d) => d.severity === "medium").length
  const lowSeverity = detections.filter((d) => d.severity === "low").length

  return {
    id: scanId,
    userId,
    timestamp: Date.now(),
    provider: request.provider,
    environment: request.environment,
    resourceGroup: request.resourceGroup,
    region: request.region,
    scanType: request.scanType,
    detections,
    status: "completed",
    summary: {
      totalDetections: detections.length,
      highSeverity,
      mediumSeverity,
      lowSeverity,
    },
  }
}

