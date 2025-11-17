import * as React from "react"
import { cn } from "@/lib/utils"

export type SelectProps = React.ComponentPropsWithoutRef<'select'>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, style, onFocus, onBlur, children, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true)
      if (onFocus) onFocus(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false)
      if (onBlur) onBlur(e)
    }

    const baseStyles: React.CSSProperties = {
      backgroundColor: 'var(--bg-main)',
      borderWidth: '2px',
      borderStyle: 'solid',
      borderColor: 'var(--border-primary)',
      color: 'var(--text-bright)',
      transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    }

    const focusStyles: React.CSSProperties = {
      borderColor: 'var(--accent-primary)',
      boxShadow: '0 0 0 2px rgba(0, 224, 255, 0.3)',
    }

    return (
      <select
        className={cn(
          "w-full px-3 py-2 rounded focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        style={{
          ...baseStyles,
          ...(isFocused ? focusStyles : {}),
          ...style,
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }