import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-stone-100 bg-stone-50 px-4 py-2 text-sm font-medium transition-colors file:border-0 file:bg-transparent file:text-sm file:font-bold placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
