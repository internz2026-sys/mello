import { cn } from "@/lib/utils"

interface SanctuaryProps {
  children: React.ReactNode
  className?: string
}

export function Sanctuary({ children, className }: SanctuaryProps) {
  return (
    <main
      className={cn(
        "mx-auto max-w-[600px] px-8 py-24 min-h-screen flex flex-col items-center justify-center",
        className
      )}
    >
      {children}
    </main>
  )
}
