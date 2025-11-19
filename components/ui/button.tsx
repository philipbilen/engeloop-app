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
        "bg-[var(--accent-primary)] text-white border border-[var(--accent-primary)] shadow-[0_6px_16px_rgba(79,70,229,0.18)] hover:shadow-[0_8px_18px_rgba(79,70,229,0.2)] active:brightness-[0.96]",
      secondary:
        "bg-[color:rgba(var(--accent-primary-rgb),0.08)] text-[var(--accent-primary)] border border-[color:rgba(var(--accent-primary-rgb),0.28)] hover:bg-[color:rgba(var(--accent-primary-rgb),0.12)] active:bg-[color:rgba(var(--accent-primary-rgb),0.18)]",
      danger:
        "bg-[var(--accent-danger)] text-white border border-[var(--accent-danger)] shadow-[0_6px_16px_rgba(239,68,68,0.14)] hover:brightness-[1.02] active:brightness-[0.95]",
      warning:
        "bg-[var(--accent-warning)] text-[var(--text-bright)] border border-[var(--accent-warning)] shadow-[0_4px_12px_rgba(245,158,11,0.14)] hover:brightness-[1.02] active:brightness-[0.95]",
      ghost:
        "bg-transparent text-[var(--text-dim)] border border-transparent hover:border-[var(--border-primary)] hover:bg-[var(--bg-interactive)] hover:text-[var(--text-bright)] active:bg-[var(--bg-tertiary)] active:text-[var(--text-bright)]",
      icon:
        "bg-transparent text-[var(--text-dimmer)] border border-transparent hover:bg-[var(--bg-interactive)] hover:text-[var(--text-bright)] active:bg-[var(--bg-tertiary)]",
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
