"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    // Always coerce to a boolean so the inner input stays controlled for its
    // whole lifetime (avoids the "uncontrolled input to be controlled" warning
    // when `checked` is briefly undefined while data is loading).
    const isChecked = checked ?? false

    return (
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        className={cn(
          "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
          isChecked ? "bg-rose-600" : "bg-muted dark:bg-muted",
          className
        )}
        onClick={() => onCheckedChange?.(!isChecked)}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
            isChecked ? "translate-x-5" : "translate-x-0"
          )}
        />
        <input
          type="checkbox"
          ref={ref}
          checked={isChecked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          className="sr-only"
          {...props}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }

