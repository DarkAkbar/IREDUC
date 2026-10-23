import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ireduc-navy active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-ireduc-navy text-white shadow-sm hover:bg-ireduc-navy-light hover:shadow-md",
        danger:
          "bg-ireduc-red text-white shadow-sm hover:bg-ireduc-red-dark hover:shadow-md",
        outline:
          "border border-ireduc-border bg-white text-ireduc-navy hover:border-ireduc-navy/30 hover:bg-ireduc-navy-soft/60",
        ghost: "text-ireduc-navy hover:bg-ireduc-navy-soft",
        success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
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
