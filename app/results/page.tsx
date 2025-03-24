import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { getScanHistory, getScanResult } from "@/lib/redis"
import type { ScanResult } from "@/lib/redis"

export const dynamic = "force_dynamic"

export default async function ResultsPage() {
  const scanIds = await getScanHistory(20)

  const results: ScanResult[] = []
  for (const id of scanIds) {
    const result = await getScanResult(id)
    if (result) results.push(result)
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Scan Results</h1>
          <p className="text-muted-foreground mt-2 mb-4">View and analyze your scan results.</p>
          <Link href="/scan">
            <Button>New Scan</Button>
          </Link>
        </div>

        <div className="grid gap-6">
          {results.length > 0 ? (
            results.map((result) => (
              <Card key={result.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle>Scan {result.id.substring(0, 8)}</CardTitle>
                    <Badge variant={result.summary.totalDetections > 0 ? "destructive" : "outline"}>
                      {result.summary.totalDetections} Detections
                    </Badge>
                  </div>
                  <CardDescription>{new Date(result.timestamp).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Provider</div>
                      <div className="text-sm">{result.provider}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Environment</div>
                      <div className="text-sm">{result.environment}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Status</div>
                      <div className="flex items-center text-sm">
                        {result.status === "completed" ? (
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                        ) : result.status === "in-progress" ? (
                          <Clock className="mr-1 h-4 w-4 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="mr-1 h-4 w-4 text-destructive" />
                        )}
                        <span className="capitalize">{result.status}</span>
                      </div>
                    </div>
                  </div>

                  {result.summary.totalDetections > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Detection Summary</div>
                      <div className="flex flex-wrap gap-2">
                        {result.summary.highSeverity > 0 && (
                          <Badge variant="destructive">{result.summary.highSeverity} High Severity</Badge>
                        )}
                        {result.summary.mediumSeverity > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                          >
                            {result.summary.mediumSeverity} Medium Severity
                          </Badge>
                        )}
                        {result.summary.lowSeverity > 0 && (
                          <Badge variant="outline">{result.summary.lowSeverity} Low Severity</Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Link href={`/results/${result.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Detailed Results
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Scan Results</CardTitle>
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
      </div>
    </div>
  )
}

