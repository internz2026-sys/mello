"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-ui tracking-widest uppercase text-xs transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dawn disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-dawn text-vellum hover:bg-dawn/80",
        ghost:
          "text-deepInk/50 border border-oat/60 hover:border-dawn/50 hover:text-dawn bg-transparent",
        bare:
          "text-deepInk/40 hover:text-dawn bg-transparent",
      },
      size: {
        default: "px-10 py-3",
        sm: "px-6 py-2 text-xs",
        lg: "px-14 py-4",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
