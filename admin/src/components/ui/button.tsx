import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ireduc-navy",
  {
    variants: {
      variant: {
        default: "bg-ireduc-navy text-white hover:bg-ireduc-navy-light",
        danger: "bg-ireduc-red text-white hover:bg-ireduc-red-dark",
        outline:
          "border border-ireduc-border bg-white text-ireduc-navy hover:bg-slate-50",
        ghost: "text-ireduc-navy hover:bg-slate-100",
        success: "bg-emerald-700 text-white hover:bg-emerald-800",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
