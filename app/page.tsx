import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Globe, Shield, BarChart } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Detect Hidden
                <br />
                <span className="text-targetblue">Cryptocurrency Miners</span>
              </h1>
              <p className="text-muted-foreground md:text-xl mx-auto">
                Protect your cloud and datacenter environments from unauthorized cryptojacking with our advanced
                detection tool.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row justify-center pt-4">
                <Link href="/scan">
                  <Button size="lg" className="bg-targetblue hover:bg-targetblue/90">
                    Detect Hidden Miners Now
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button size="lg" variant="outline">
                    View Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Advanced Cryptojacking Detection
              </h2>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our tool uses advanced techniques to identify hidden cryptocurrency miners in your environment.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 lg:gap-12 mt-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-targetblue/10">
                <Globe className="h-8 w-8 text-targetblue" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Cloud Provider Support</h3>
                <p className="text-muted-foreground">
                  Scan AWS, GCP, and Azure environments for hidden miners in startup scripts and configurations.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-targetblue/10">
                <Shield className="h-8 w-8 text-targetblue" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Advanced Detection</h3>
                <p className="text-muted-foreground">
                  Over 100 detection patterns with weighted scoring and severity classification.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-targetblue/10">
                <BarChart className="h-8 w-8 text-targetblue" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Comprehensive Reporting</h3>
                <p className="text-muted-foreground">
                  Detailed reports with visualizations and export options for further analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">How It Works</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our simple process helps you identify and remove cryptocurrency miners from your environment.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 mt-12">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-targetblue text-white">1</div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Configure Scan</h3>
                <p className="text-muted-foreground">Select your cloud provider and environment to scan.</p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-targetblue text-white">2</div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Run Detection</h3>
                <p className="text-muted-foreground">
                  Our tool scans your environment for signs of cryptocurrency miners.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-targetblue text-white">3</div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Review Results</h3>
                <p className="text-muted-foreground">Get detailed reports and recommendations for remediation.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-12">
            <Link href="/scan">
              <Button size="lg" className="bg-targetblue hover:bg-targetblue/90">
                Start Scanning Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

