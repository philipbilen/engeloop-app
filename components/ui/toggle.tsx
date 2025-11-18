import * as React from "react"
import { cn } from "@/lib/utils"

export interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  size?: "sm" | "md"
}

const sizeStyles = {
  sm: {
    track: "h-5 w-9",
    thumb: "h-3.5 w-3.5",
    translate: "translate-x-3.5",
  },
  md: {
    track: "h-6 w-11",
    thumb: "h-4 w-4",
    translate: "translate-x-5",
  },
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      checked,
      onCheckedChange,
      disabled,
      className,
      size = "md",
      ...props
    },
    ref
  ) => {
    const { track, thumb, translate } = sizeStyles[size]

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        ref={ref}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:rgba(var(--accent-primary-rgb),0.35)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-main)] disabled:cursor-not-allowed disabled:opacity-60",
          track,
          checked
            ? "border-[var(--accent-primary)] bg-[color:rgba(var(--accent-primary-rgb),0.2)]"
            : "border-[var(--border-primary)] bg-[var(--bg-interactive)] hover:border-[color:rgba(var(--accent-primary-rgb),0.5)]",
          className
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none inline-block rounded-full bg-[var(--text-bright)] shadow transition-transform duration-150 ease-out",
            thumb,
            checked ? translate : "translate-x-0"
          )}
        />
      </button>
    )
  }
)

Toggle.displayName = "Toggle"
