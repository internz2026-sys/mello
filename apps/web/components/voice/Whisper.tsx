import { cn } from "@/lib/utils"

interface WhisperProps {
  children: React.ReactNode
  className?: string
}

export function Whisper({ children, className }: WhisperProps) {
  return (
    <span
      className={cn(
        "font-voice italic text-sm text-deepInk/60",
        className
      )}
    >
      {children}
    </span>
  )
}
