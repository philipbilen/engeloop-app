import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "warning" | "ghost" | "icon"
  size?: "sm" | "default" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", style, ...props }, ref) => {
    const sizeClasses = {
      sm: "px-3 py-1 text-xs",
      default: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
      icon: "h-9 w-9",
    }

    // Using inline styles to leverage the CSS variables defined in globals.css,
    // as Tailwind's config isn't set up to use them directly in class definitions.
    const variantStyles = {
      primary: {
        backgroundColor: "var(--accent-primary)",
        color: "var(--bg-deep-dark)",
        border: "2px solid var(--accent-primary)",
      },
      secondary: {
        backgroundColor: "transparent",
        color: "var(--accent-primary)",
        border: "2px solid var(--accent-primary)",
      },
      danger: {
        backgroundColor: "var(--accent-danger)",
        color: "var(--text-bright)",
        border: "2px solid var(--accent-danger)",
      },
      warning: {
        backgroundColor: "var(--accent-warning)",
        color: "var(--bg-deep-dark)",
        border: "2px solid var(--accent-warning)",
      },
      ghost: {
        backgroundColor: "transparent",
        color: "var(--text-dim)",
        border: "2px solid transparent",
      },
      icon: {
        backgroundColor: "transparent",
        color: "var(--text-dimmer)",
        border: "2px solid transparent",
      }
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-semibold uppercase tracking-wider rounded transition-colors focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClasses[size],
          className
        )}
        style={{
          ...variantStyles[variant],
          ...style,
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }