"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
})

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      const success = await login(values.email, values.name)
      if (success) {
        router.push("/dashboard")
      } else {
        form.setError("root", {
          message: "Failed to log in. Please try again.",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      form.setError("root", {
        message: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/tp-main-light.png"
            alt="TargetProof Logo"
            width={220}
            height={60}
            className="dark:hidden"
          />
          <Image
            src="/images/tp-main-light-alt.png"
            alt="TargetProof Logo"
            width={220}
            height={60}
            className="hidden dark:block"
          />
          <h1 className="text-2xl font-bold mt-4 text-center">CryptoDetector Login</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Log in or Sign up</CardTitle>
            <CardDescription>Enter your information to access the CryptoDetector tool.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your.email@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <div className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Want to provide more details?{" "}
              <Link href="/signup" className="text-targetblue hover:underline">
                Complete signup
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

