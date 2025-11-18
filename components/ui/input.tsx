import * as React from "react"
import { cn } from "@/lib/utils"

export type InputProps = React.ComponentPropsWithoutRef<'input'>;

const inputBaseClasses =
  "h-10 w-full rounded-md border-2 border-[var(--border-primary)] bg-[var(--bg-main)] px-3 text-sm text-[var(--text-bright)] placeholder:text-[var(--text-dimmer)] transition-all duration-150 ease-out focus-visible:outline-none focus-visible:border-[var(--accent-primary)] focus-visible:shadow-[0_0_0_3px_rgba(0,224,255,0.18)] focus-visible:ring-0 hover:border-[color:rgba(var(--accent-primary-rgb),0.5)] disabled:opacity-50 disabled:cursor-not-allowed";

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
