import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.ComponentPropsWithoutRef<'input'>;

const inputBaseClasses =
  "h-10 w-full rounded-md border border-[var(--border-primary)] bg-[var(--bg-deep-dark)] px-3 text-sm text-[var(--text-bright)] placeholder:text-[var(--text-dimmer)] transition-all duration-150 ease-out focus-visible:outline-none focus-visible:border-[var(--accent-primary)] focus-visible:shadow-[0_0_0_3px_rgba(var(--accent-primary-rgb),0.18)] focus-visible:ring-0 hover:border-[color:rgba(var(--accent-primary-rgb),0.35)] disabled:opacity-50 disabled:cursor-not-allowed shadow-[var(--shadow-soft)]";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputBaseClasses, className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
