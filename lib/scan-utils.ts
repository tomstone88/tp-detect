import { v4 as uuidv4 } from "uuid"
import type { Detection, ScanResult } from "./redis"

export type ScanRequest = {
  provider: string
  environment: string
}

export async function startScan(request: ScanRequest): Promise<string> {
  const scanId = uuidv4()

  // In a real implementation, this would initiate an actual scan
  // For demo purposes, we'll simulate a scan with a timeout

  return scanId
}

export async function generateMockScanResult(scanId: string, request: ScanRequest): Promise<ScanResult> {
  // Generate between 0 and 5 random detections
  const numDetections = Math.floor(Math.random() * 6)
  const detections: Detection[] = []

  const possibleDetections: Detection[] = [
    {
      id: "crypto-miner-1",
      name: "XMRig Cryptocurrency Miner",
      description: "XMRig is a high-performance Monero (XMR) CPU miner",
      severity: "high",
      location: `${request.provider}/${request.environment}/compute/instance-01`,
      detectionPattern: "xmrig",
      recommendation: "Terminate the process and remove the malicious executable",
    },
    {
      id: "crypto-miner-2",
      name: "Coinhive JavaScript Miner",
      description: "In-browser cryptocurrency miner that uses visitors' CPU resources",
      severity: "medium",
      location: `${request.provider}/${request.environment}/web/app-server-03`,
      detectionPattern: "coinhive.min.js",
      recommendation: "Remove the script from your web pages",
    },
    {
      id: "crypto-miner-3",
      name: "Hidden Cryptojacking Script",
      description: "Obfuscated JavaScript that mines cryptocurrency in the background",
      severity: "high",
      location: `${request.provider}/${request.environment}/web/cdn-assets`,
      detectionPattern: "Cryptonight",
      recommendation: "Audit all JavaScript files and remove malicious code",
    },
    {
      id: "crypto-miner-4",
      name: "EternalBlue Exploit with Miner Payload",
      description: "Uses EternalBlue vulnerability to deploy cryptocurrency miners",
      severity: "high",
      location: `${request.provider}/${request.environment}/network/subnet-private`,
      detectionPattern: "ms17-010",
      recommendation: "Patch systems with the latest security updates",
    },
    {
      id: "crypto-miner-5",
      name: "Docker Container Cryptojacking",
      description: "Unauthorized cryptocurrency mining in Docker containers",
      severity: "medium",
      location: `${request.provider}/${request.environment}/containers/pod-backend-07`,
      detectionPattern: "dockerized miner",
      recommendation: "Review all running containers and implement proper security controls",
    },
    {
      id: "crypto-miner-6",
      name: "Cron Job Cryptocurrency Miner",
      description: "Scheduled task that runs a cryptocurrency miner",
      severity: "medium",
      location: `${request.provider}/${request.environment}/compute/instance-05`,
      detectionPattern: "cron mining",
      recommendation: "Review all cron jobs and remove unauthorized entries",
    },
    {
      id: "crypto-miner-7",
      name: "NPM Package with Mining Code",
      description: "NPM package that contains hidden cryptocurrency mining code",
      severity: "medium",
      location: `${request.provider}/${request.environment}/web/app-server-01`,
      detectionPattern: "package mining",
      recommendation: "Audit all NPM packages and remove suspicious dependencies",
    },
    {
      id: "crypto-miner-8",
      name: "GPU-Based Ethereum Miner",
      description: "Unauthorized Ethereum mining using GPU resources",
      severity: "high",
      location: `${request.provider}/${request.environment}/compute/gpu-instance-02`,
      detectionPattern: "ethminer",
      recommendation: "Terminate the process and implement GPU monitoring",
    },
    {
      id: "crypto-miner-9",
      name: "Base64 Encoded Mining Payload",
      description: "Obfuscated mining code hidden in base64 encoded strings",
      severity: "low",
      location: `${request.provider}/${request.environment}/storage/backup-scripts`,
      detectionPattern: "base64 mining",
      recommendation: "Implement code scanning and review for obfuscated payloads",
    },
    {
      id: "crypto-miner-10",
      name: "WebAssembly Cryptocurrency Miner",
      description: "Uses WebAssembly to efficiently mine cryptocurrency in browsers",
      severity: "medium",
      location: `${request.provider}/${request.environment}/web/frontend-assets`,
      detectionPattern: "wasm miner",
      recommendation: "Monitor WebAssembly usage and implement Content Security Policy",
    },
  ]

  // Randomly select detections
  const selectedIndices = new Set<number>()
  while (selectedIndices.size < numDetections) {
    selectedIndices.add(Math.floor(Math.random() * possibleDetections.length))
  }

  Array.from(selectedIndices).forEach((index) => {
    detections.push(possibleDetections[index])
  })

  // Count detections by severity
  const highSeverity = detections.filter((d) => d.severity === "high").length
  const mediumSeverity = detections.filter((d) => d.severity === "medium").length
  const lowSeverity = detections.filter((d) => d.severity === "low").length

  return {
    id: scanId,
    timestamp: Date.now(),
    provider: request.provider,
    environment: request.environment,
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

