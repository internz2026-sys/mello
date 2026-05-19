import { cn } from "@/lib/utils"

interface VoiceProps {
  children: React.ReactNode
  className?: string
}

export function Voice({ children, className }: VoiceProps) {
  return (
    <p
      className={cn(
        "font-voice text-xl leading-relaxed text-deepInk",
        className
      )}
    >
      {children}
    </p>
  )
}
