"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, BarChart3, CheckCircle, Clock, Shield } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import type { ScanResult } from "@/lib/types"

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentScans, setRecentScans] = useState<ScanResult[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchUserScans() {
      try {
        const response = await fetch(`/api/scans/user`)
        if (!response.ok) {
          throw new Error("Failed to fetch scans")
        }
        const data = await response.json()
        setRecentScans(data)
      } catch (error) {
        console.error("Error fetching scans:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchUserScans()
    }
  }, [user])

  // Calculate summary statistics
  const totalScans = recentScans.length
  const totalDetections = recentScans.reduce((sum, scan) => sum + scan.summary.totalDetections, 0)
  const highSeverityDetections = recentScans.reduce((sum, scan) => sum + scan.summary.highSeverity, 0)
  const mediumSeverityDetections = recentScans.reduce((sum, scan) => sum + scan.summary.mediumSeverity, 0)
  const lowSeverityDetections = recentScans.reduce((sum, scan) => sum + scan.summary.lowSeverity, 0)

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.name}. Monitor your environment for cryptocurrency mining activity.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalScans}</div>
                  <p className="text-xs text-muted-foreground">Your scan activity</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalDetections}</div>
                  <p className="text-xs text-muted-foreground">Across all your scans</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Severity</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{highSeverityDetections}</div>
                  <p className="text-xs text-muted-foreground">Critical issues requiring attention</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium/Low Severity</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{mediumSeverityDetections + lowSeverityDetections}</div>
                  <p className="text-xs text-muted-foreground">Issues to monitor</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="recent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recent">Recent Scans</TabsTrigger>
            <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          </TabsList>
          <TabsContent value="recent" className="space-y-4">
            <div className="grid gap-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-32 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-10 w-full mt-4" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : recentScans.length > 0 ? (
                recentScans.map((scan) => (
                  <Card key={scan.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle>Scan {scan.id.substring(0, 8)}</CardTitle>
                        <Badge variant={scan.summary.totalDetections > 0 ? "destructive" : "outline"}>
                          {scan.summary.totalDetections} Detections
                        </Badge>
                      </div>
                      <CardDescription>{new Date(scan.timestamp).toLocaleString()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Provider:</span>
                          <span className="font-medium">{scan.provider}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Environment:</span>
                          <span className="font-medium">{scan.environment}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Scan Type:</span>
                          <span className="font-medium capitalize">{scan.scanType}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <div className="flex items-center">
                            {scan.status === "completed" ? (
                              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                            ) : scan.status === "in-progress" ? (
                              <Clock className="mr-1 h-4 w-4 text-yellow-500" />
                            ) : (
                              <AlertTriangle className="mr-1 h-4 w-4 text-destructive" />
                            )}
                            <span className="font-medium capitalize">{scan.status}</span>
                          </div>
                        </div>
                        {scan.summary.totalDetections > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Severity:</span>
                            <div className="flex items-center space-x-2">
                              {scan.summary.highSeverity > 0 && (
                                <Badge variant="destructive">{scan.summary.highSeverity} High</Badge>
                              )}
                              {scan.summary.mediumSeverity > 0 && (
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                                >
                                  {scan.summary.mediumSeverity} Medium
                                </Badge>
                              )}
                              {scan.summary.lowSeverity > 0 && (
                                <Badge variant="outline">{scan.summary.lowSeverity} Low</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <Link href={`/results/${scan.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Recent Scans</CardTitle>
                    <CardDescription>You haven't run any scans yet.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href="/scan">
                      <Button>Run Your First Scan</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          <TabsContent value="alerts" className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : highSeverityDetections > 0 ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Critical Alerts</AlertTitle>
                <AlertDescription>
                  You have {highSeverityDetections} high severity detections that require immediate attention.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>No Critical Alerts</AlertTitle>
                <AlertDescription>No high severity issues have been detected in your recent scans.</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Alert Summary</CardTitle>
                <CardDescription>Overview of current alerts in your environment</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : totalDetections > 0 ? (
                  <div className="space-y-4">
                    {highSeverityDetections > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 rounded-full bg-destructive" />
                          <span>High Severity</span>
                        </div>
                        <span className="font-bold">{highSeverityDetections}</span>
                      </div>
                    )}
                    {mediumSeverityDetections > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 rounded-full bg-yellow-500" />
                          <span>Medium Severity</span>
                        </div>
                        <span className="font-bold">{mediumSeverityDetections}</span>
                      </div>
                    )}
                    {lowSeverityDetections > 0 && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2 h-4 w-4 rounded-full bg-muted" />
                          <span>Low Severity</span>
                        </div>
                        <span className="font-bold">{lowSeverityDetections}</span>
                      </div>
                    )}
                    <div className="pt-4">
                      <Link href="/results">
                        <Button variant="outline" className="w-full">
                          View All Results
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Shield className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium">All Clear</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      No cryptocurrency miners have been detected in your environment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

