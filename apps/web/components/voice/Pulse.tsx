"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface PulseProps {
  children: React.ReactNode
  className?: string
}

export function Pulse({ children, className }: PulseProps) {
  return (
    <motion.div
      className={cn(className)}
      animate={{ opacity: [0.6, 1, 0.6] }}
      transition={{
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      }}
    >
      {children}
    </motion.div>
  )
}
