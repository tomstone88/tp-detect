"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, Download, Shield, Trash2, Search, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { ScanResult, Detection } from "@/lib/types"

export default function ResultDetailPage({ params }: { params: { id: string } }) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTerminating, setIsTerminating] = useState<string | null>(null)
  const [isTracing, setIsTracing] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  useState(() => {
    async function fetchScanResult() {
      try {
        const response = await fetch(`/api/scans/${params.id}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/not-found")
            return
          }
          throw new Error("Failed to fetch scan result")
        }
        const data = await response.json()
        setScanResult(data)
      } catch (error) {
        console.error("Error fetching scan result:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchScanResult()
    }
  }, [params.id, router, user])

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40 mt-2" />
            </div>
          </div>

          <Skeleton className="h-64 w-full" />

          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!scanResult) {
    return (
      <div className="container py-10">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <Link href="/results">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Scan Result Not Found</h1>
              <p className="text-muted-foreground mt-2">The requested scan result could not be found.</p>
            </div>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">Result Not Found</h2>
              <p className="text-muted-foreground mt-2 text-center max-w-md">
                The scan result you're looking for may have been deleted or doesn't exist.
              </p>
              <Link href="/results" className="mt-6">
                <Button>View All Results</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Group detections by severity
  const highSeverity = scanResult.detections.filter((d) => d.severity === "high")
  const mediumSeverity = scanResult.detections.filter((d) => d.severity === "medium")
  const lowSeverity = scanResult.detections.filter((d) => d.severity === "low")

  async function handleTerminate(detectionId: string) {
    setIsTerminating(detectionId)
    try {
      // In a real implementation, this would call an API to terminate the miner
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update the detection status
      setScanResult((prev) => {
        if (!prev) return null

        const updatedDetections = prev.detections.map((d) => {
          if (d.id === detectionId) {
            return {
              ...d,
              canTerminate: false,
              description: d.description + " (Terminated)",
            }
          }
          return d
        })

        return {
          ...prev,
          detections: updatedDetections,
        }
      })
    } catch (error) {
      console.error("Error terminating miner:", error)
    } finally {
      setIsTerminating(null)
    }
  }

  async function handleTrace(detectionId: string) {
    setIsTracing(detectionId)
    try {
      // In a real implementation, this would call an API to trace the miner
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // For demo purposes, we'll just show a success message
      alert("Trace initiated. Results will be available in the forensics tab.")
    } catch (error) {
      console.error("Error tracing miner:", error)
    } finally {
      setIsTracing(null)
    }
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link href="/results">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scan Results</h1>
            <p className="text-muted-foreground mt-2">Scan ID: {scanResult.id}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Scan Summary</CardTitle>
                <CardDescription>{new Date(scanResult.timestamp).toLocaleString()}</CardDescription>
              </div>
              <Badge variant={scanResult.summary.totalDetections > 0 ? "destructive" : "outline"} className="w-fit">
                {scanResult.summary.totalDetections} Detections
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Provider</div>
                <div className="text-sm">{scanResult.provider}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Environment</div>
                <div className="text-sm">{scanResult.environment}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Scan Type</div>
                <div className="text-sm capitalize">{scanResult.scanType}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Status</div>
                <div className="flex items-center text-sm">
                  {scanResult.status === "completed" ? (
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                  ) : scanResult.status === "in-progress" ? (
                    <Clock className="mr-1 h-4 w-4 text-yellow-500" />
                  ) : (
                    <AlertTriangle className="mr-1 h-4 w-4 text-destructive" />
                  )}
                  <span className="capitalize">{scanResult.status}</span>
                </div>
              </div>
            </div>

            {scanResult.summary.totalDetections > 0 ? (
              <Alert variant="destructive" className="mt-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Cryptocurrency Miners Detected</AlertTitle>
                <AlertDescription>
                  We found {scanResult.summary.totalDetections} potential cryptocurrency miners in your environment.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mt-6">
                <Shield className="h-4 w-4" />
                <AlertTitle>No Cryptocurrency Miners Detected</AlertTitle>
                <AlertDescription>Your environment appears to be free of cryptocurrency miners.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {scanResult.detections.length > 0 && (
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Detections ({scanResult.detections.length})</TabsTrigger>
              {highSeverity.length > 0 && <TabsTrigger value="high">High Severity ({highSeverity.length})</TabsTrigger>}
              {mediumSeverity.length > 0 && (
                <TabsTrigger value="medium">Medium Severity ({mediumSeverity.length})</TabsTrigger>
              )}
              {lowSeverity.length > 0 && <TabsTrigger value="low">Low Severity ({lowSeverity.length})</TabsTrigger>}
            </TabsList>

            <TabsContent value="all">
              <DetectionTable
                detections={scanResult.detections}
                onTerminate={handleTerminate}
                onTrace={handleTrace}
                isTerminating={isTerminating}
                isTracing={isTracing}
              />
            </TabsContent>

            {highSeverity.length > 0 && (
              <TabsContent value="high">
                <DetectionTable
                  detections={highSeverity}
                  onTerminate={handleTerminate}
                  onTrace={handleTrace}
                  isTerminating={isTerminating}
                  isTracing={isTracing}
                />
              </TabsContent>
            )}

            {mediumSeverity.length > 0 && (
              <TabsContent value="medium">
                <DetectionTable
                  detections={mediumSeverity}
                  onTerminate={handleTerminate}
                  onTrace={handleTrace}
                  isTerminating={isTerminating}
                  isTracing={isTracing}
                />
              </TabsContent>
            )}

            {lowSeverity.length > 0 && (
              <TabsContent value="low">
                <DetectionTable
                  detections={lowSeverity}
                  onTerminate={handleTerminate}
                  onTrace={handleTrace}
                  isTerminating={isTerminating}
                  isTracing={isTracing}
                />
              </TabsContent>
            )}
          </Tabs>
        )}

        <div className="flex justify-end">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  )
}

interface DetectionTableProps {
  detections: Detection[]
  onTerminate: (id: string) => void
  onTrace: (id: string) => void
  isTerminating: string | null
  isTracing: string | null
}

function DetectionTable({ detections, onTerminate, onTrace, isTerminating, isTracing }: DetectionTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="hidden md:table-cell">Detection Pattern</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detections.map((detection) => (
              <TableRow key={detection.id}>
                <TableCell className="font-medium">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto font-medium">
                        {detection.name}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{detection.name}</DialogTitle>
                        <DialogDescription>Detection details and remediation steps</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <h4 className="text-sm font-medium">Description</h4>
                          <p className="text-sm text-muted-foreground mt-1">{detection.description}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Location</h4>
                          <p className="text-sm text-muted-foreground mt-1">{detection.location}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Detection Pattern</h4>
                          <p className="text-sm text-muted-foreground mt-1">{detection.detectionPattern}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">Recommendation</h4>
                          <p className="text-sm text-muted-foreground mt-1">{detection.recommendation}</p>
                        </div>
                      </div>
                      <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        {detection.canTerminate && (
                          <Button
                            variant="destructive"
                            onClick={() => {
                              onTerminate(detection.id)
                            }}
                            disabled={isTerminating === detection.id}
                            className="w-full sm:w-auto"
                          >
                            {isTerminating === detection.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Terminating...
                              </>
                            ) : (
                              <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Terminate
                              </>
                            )}
                          </Button>
                        )}
                        {detection.canTrace && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              onTrace(detection.id)
                            }}
                            disabled={isTracing === detection.id}
                            className="w-full sm:w-auto"
                          >
                            {isTracing === detection.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Tracing...
                              </>
                            ) : (
                              <>
                                <Search className="mr-2 h-4 w-4" />
                                Trace
                              </>
                            )}
                          </Button>
                        )}
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      detection.severity === "high"
                        ? "destructive"
                        : detection.severity === "medium"
                          ? "outline"
                          : "secondary"
                    }
                    className={
                      detection.severity === "medium"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        : ""
                    }
                  >
                    {detection.severity}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate" title={detection.location}>
                  {detection.location}
                </TableCell>
                <TableCell className="hidden md:table-cell">{detection.detectionPattern}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {detection.canTerminate && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onTerminate(detection.id)}
                        disabled={isTerminating === detection.id}
                      >
                        {isTerminating === detection.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    {detection.canTrace && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTrace(detection.id)}
                        disabled={isTracing === detection.id}
                      >
                        {isTracing === detection.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Search className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

