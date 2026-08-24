import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[1.2rem] text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eco-500 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-eco-600 text-white shadow-md shadow-eco-600/20 hover:bg-eco-700",
        destructive:
          "bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700",
        outline:
          "border border-stone-200 bg-transparent shadow-sm hover:bg-stone-50 text-stone-700",
        secondary:
          "bg-stone-100 text-stone-700 shadow-sm hover:bg-stone-200",
        ghost: "hover:bg-stone-100 text-stone-700",
        link: "text-eco-600 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-[1rem] px-4 text-xs",
        lg: "h-12 rounded-[1.5rem] px-8 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
