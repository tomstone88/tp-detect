"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Info, AlertTriangle, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { ScanRequest } from "@/lib/types"

const formSchema = z.object({
  provider: z.string().min(1, {
    message: "Please select a cloud provider.",
  }),
  environment: z.string().min(1, {
    message: "Please enter an environment name.",
  }),
  resourceGroup: z.string().optional(),
  region: z.string().optional(),
  scanType: z.enum(["quick", "comprehensive", "deep"], {
    required_error: "Please select a scan type.",
  }),
})

export default function ScanPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("config")
  const router = useRouter()
  const { user } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider: "",
      environment: "",
      resourceGroup: "",
      region: "",
      scanType: "quick",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const scanRequest: ScanRequest = {
        provider: values.provider,
        environment: values.environment,
        resourceGroup: values.resourceGroup || undefined,
        region: values.region || undefined,
        scanType: values.scanType as "quick" | "comprehensive" | "deep",
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scanRequest),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to start scan")
      }

      // Redirect to the results page with the scan ID
      router.push(`/results/${data.scanId}`)
    } catch (error) {
      console.error("Error starting scan:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Scan for Cryptocurrency Miners</h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Configure your scan to detect hidden cryptocurrency miners in your environment.
          </p>
        </div>

        <Tabs defaultValue="config" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="options">Advanced Options</TabsTrigger>
            <TabsTrigger value="review">Review & Start</TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Basic Configuration</CardTitle>
                <CardDescription>Select your cloud provider and environment to begin scanning.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cloud Provider</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a cloud provider" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="aws">Amazon Web Services (AWS)</SelectItem>
                              <SelectItem value="gcp">Google Cloud Platform (GCP)</SelectItem>
                              <SelectItem value="azure">Microsoft Azure</SelectItem>
                              <SelectItem value="digitalocean">DigitalOcean</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Select the cloud provider where your resources are hosted.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="environment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Environment</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., production, staging, development" {...field} />
                          </FormControl>
                          <FormDescription>Enter the name of the environment you want to scan.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="scanType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scan Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a scan type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="quick">Quick Scan (5-10 minutes)</SelectItem>
                              <SelectItem value="comprehensive">Comprehensive Scan (15-30 minutes)</SelectItem>
                              <SelectItem value="deep">Deep Scan (30+ minutes)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>Select the type of scan you want to perform.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" disabled>
                  Back
                </Button>
                <Button onClick={() => setActiveTab("options")}>Next</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="options">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Options</CardTitle>
                <CardDescription>Provide additional details to customize your scan.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="resourceGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resource Group (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., web-servers, databases" {...field} />
                          </FormControl>
                          <FormDescription>Specify a resource group to limit the scope of your scan.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., us-east-1, eu-west-2" {...field} />
                          </FormControl>
                          <FormDescription>Specify a region to limit the scope of your scan.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-muted p-4 rounded-md flex items-start space-x-2">
                      <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium">Additional Options</p>
                        <p className="mt-1">
                          For more advanced configuration options, please contact our support team.
                        </p>
                      </div>
                    </div>
                  </div>
                </Form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("config")}>
                  Back
                </Button>
                <Button onClick={() => setActiveTab("review")}>Next</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="review">
            <Card>
              <CardHeader>
                <CardTitle>Review & Start Scan</CardTitle>
                <CardDescription>Review your scan configuration and start the scan.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium">Cloud Provider</h3>
                      <p className="text-sm mt-1">
                        {form.getValues("provider")
                          ? form.getValues("provider") === "aws"
                            ? "Amazon Web Services (AWS)"
                            : form.getValues("provider") === "gcp"
                              ? "Google Cloud Platform (GCP)"
                              : form.getValues("provider") === "azure"
                                ? "Microsoft Azure"
                                : form.getValues("provider") === "digitalocean"
                                  ? "DigitalOcean"
                                  : "Other"
                          : "Not specified"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Environment</h3>
                      <p className="text-sm mt-1">{form.getValues("environment") || "Not specified"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Scan Type</h3>
                      <p className="text-sm mt-1">
                        {form.getValues("scanType") === "quick"
                          ? "Quick Scan (5-10 minutes)"
                          : form.getValues("scanType") === "comprehensive"
                            ? "Comprehensive Scan (15-30 minutes)"
                            : "Deep Scan (30+ minutes)"}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Resource Group</h3>
                      <p className="text-sm mt-1">{form.getValues("resourceGroup") || "All resource groups"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Region</h3>
                      <p className="text-sm mt-1">{form.getValues("region") || "All regions"}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">User</h3>
                      <p className="text-sm mt-1">{user?.name || "Unknown"}</p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md flex items-start space-x-2 border border-yellow-200 dark:border-yellow-900/50">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-400">
                      <p className="font-medium">Important Information</p>
                      <p className="mt-1">
                        This scan will analyze your cloud environment for cryptocurrency miners. The scan is read-only
                        and will not make any changes to your environment.
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md flex items-start space-x-2 border border-blue-200 dark:border-blue-900/50">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-400">
                      <p className="font-medium">Privacy Notice</p>
                      <p className="mt-1">
                        We only collect information necessary to perform the scan. Your data is encrypted and stored
                        securely. See our privacy policy for more details.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("options")}>
                  Back
                </Button>
                <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Scan...
                    </>
                  ) : (
                    "Start Scan"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

