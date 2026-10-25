import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition-opacity disabled:pointer-events-none disabled:opacity-55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ireduc-navy",
  {
    variants: {
      variant: {
        default: "bg-ireduc-primary text-white hover:opacity-90",
        navy: "bg-ireduc-navy text-white hover:opacity-90",
        danger: "bg-ireduc-red text-white hover:opacity-90",
        outline:
          "border-[1.5px] border-ireduc-navy bg-[var(--bg-surface)] text-ireduc-navy hover:bg-ireduc-navy-soft dark:text-[#9eb6ff] dark:border-[#9eb6ff]",
        ghost: "text-ireduc-navy hover:bg-ireduc-navy-soft dark:text-[#9eb6ff]",
        success: "bg-ireduc-success text-white hover:opacity-90",
      },
      size: {
        default: "h-11 min-h-[44px] px-4 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-6",
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
