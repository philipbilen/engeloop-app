import * as React from "react"
import { cn } from "@/lib/utils"

export type LabelProps = React.ComponentPropsWithoutRef<'label'>;

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-xs font-medium uppercase tracking-wider mb-2 block",
          className
        )}
        style={{ color: 'var(--text-dimmer)' }}
        {...props}
      />
    )
  }
)
Label.displayName = "Label"

export { Label }
