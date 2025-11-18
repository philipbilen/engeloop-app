import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "warning" | "ghost" | "icon"
  size?: "sm" | "default" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-9 px-3 text-[11px]",
      default: "h-10 px-4 text-xs",
      lg: "h-12 px-6 text-sm",
      icon: "h-10 w-10",
    }

    const variantClasses = {
      primary:
        "bg-[var(--accent-primary)] text-[var(--bg-deep-dark)] border-2 border-[var(--accent-primary)] hover:brightness-[1.1] active:brightness-[0.95]",
      secondary:
        "bg-transparent text-[var(--accent-primary)] border-2 border-[var(--accent-primary)] hover:bg-[color:rgba(var(--accent-primary-rgb),0.14)] active:bg-[color:rgba(var(--accent-primary-rgb),0.2)]",
      danger:
        "bg-[var(--accent-danger)] text-[var(--text-bright)] border-2 border-[var(--accent-danger)] hover:brightness-[1.05] active:brightness-[0.95]",
      warning:
        "bg-[var(--accent-warning)] text-[var(--bg-deep-dark)] border-2 border-[var(--accent-warning)] hover:brightness-[1.05] active:brightness-[0.95]",
      ghost:
        "bg-transparent text-[var(--text-dim)] border-2 border-transparent hover:border-[var(--border-primary)] hover:bg-[color:rgba(44,50,64,0.6)] hover:text-[var(--text-bright)] active:bg-[color:rgba(44,50,64,0.85)] active:text-[var(--text-bright)]",
      icon:
        "bg-transparent text-[var(--text-dimmer)] border-2 border-transparent hover:bg-[color:rgba(44,50,64,0.7)] hover:text-[var(--text-bright)] active:bg-[color:rgba(44,50,64,0.9)]",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-wider rounded-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(var(--accent-primary-rgb),0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
