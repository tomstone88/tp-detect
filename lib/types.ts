export type User = {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  createdAt: number
}

export type ScanResult = {
  id: string
  userId: string
  timestamp: number
  provider: string
  environment: string
  resourceGroup?: string
  region?: string
  scanType: "quick" | "comprehensive" | "deep"
  detections: Detection[]
  status: "completed" | "in-progress" | "failed"
  summary: {
    totalDetections: number
    highSeverity: number
    mediumSeverity: number
    lowSeverity: number
  }
}

export type Detection = {
  id: string
  name: string
  description: string
  severity: "high" | "medium" | "low"
  location: string
  resourceId?: string
  detectionPattern: string
  recommendation: string
  canTerminate: boolean
  canTrace: boolean
}

export type ScanRequest = {
  provider: string
  environment: string
  resourceGroup?: string
  region?: string
  scanType: "quick" | "comprehensive" | "deep"
}

