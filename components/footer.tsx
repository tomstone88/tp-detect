import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-center gap-4 py-8">
        <Image src="/images/tp-main-light.png" alt="TargetProof Logo" width={150} height={35} className="dark:hidden" />
        <Image
          src="/images/tp-main-light-alt.png"
          alt="TargetProof Logo"
          width={150}
          height={35}
          className="hidden dark:block"
        />
        <p className="text-center text-sm leading-loose text-muted-foreground">
          &copy; {new Date().getFullYear()} TargetProof. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

