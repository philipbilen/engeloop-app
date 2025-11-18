import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padding?: "none" | "sm" | "md" | "lg"
}

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, padding = "md", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border-2 border-[var(--border-primary)] bg-[var(--bg-secondary)] transition-all duration-150",
          hoverable
            ? "hover:border-[var(--accent-primary)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
            : "shadow-sm",
          paddingClasses[padding],
          className
        )}
        {...props}
      />
    )
  }
)

Card.displayName = "Card"

export interface CardSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-start justify-between gap-3", className)}
      {...props}
    />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold text-[var(--text-primary)]", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-[var(--text-muted)]", className)}
      {...props}
    />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, CardSectionProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "mt-4 border-t-2 border-[var(--border-primary)] pt-4 flex items-center justify-end gap-2",
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
