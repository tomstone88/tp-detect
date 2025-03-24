"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut } from "lucide-react"

export function Navbar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Don't show navbar on login/signup pages
  if (pathname === "/login" || pathname === "/signup") {
    return null
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/tp-main-light.png"
            alt="TargetProof Logo"
            width={150}
            height={40}
            className="dark:hidden"
          />
          <Image
            src="/images/tp-main-light-alt.png"
            alt="TargetProof Logo"
            width={150}
            height={40}
            className="hidden dark:block"
          />
        </Link>
        <nav className="ml-auto flex items-center space-x-1">
          <Link
            href="/"
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === "/" ? "text-primary" : "text-muted-foreground",
            )}
          >
            <div className="px-4 py-2">Home</div>
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/dashboard" ? "text-primary" : "text-muted-foreground",
                )}
              >
                <div className="px-4 py-2">Dashboard</div>
              </Link>
              <Link
                href="/scan"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/scan" ? "text-primary" : "text-muted-foreground",
                )}
              >
                <div className="px-4 py-2">Scan</div>
              </Link>
              <Link
                href="/results"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/results" ? "text-primary" : "text-muted-foreground",
                )}
              >
                <div className="px-4 py-2">Results</div>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>{user.name}</DropdownMenuItem>
                  <DropdownMenuItem disabled>{user.email}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">
                Log In
              </Button>
            </Link>
          )}

          <ModeToggle />
        </nav>
      </div>
    </header>
  )
}

