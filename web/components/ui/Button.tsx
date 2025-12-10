import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", children, className = "", ...props },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 rounded-full font-sans font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400/60 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed";

    const sizeClasses: Record<ButtonSize, string> = {
      sm: "h-9 px-4 text-sm",
      md: "h-10 px-5 text-sm",
      lg: "h-11 px-6 text-base",
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        "bg-ladder-primary text-slate-950 shadow-md hover:bg-emerald-400",
      secondary:
        "bg-slate-800 text-slate-200 shadow-sm hover:bg-slate-700 border border-slate-700/60",
      ghost:
        "bg-transparent text-slate-300 hover:bg-slate-800/60",
      destructive:
        "bg-status-error text-white shadow-sm hover:bg-red-600",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${sizeClasses[size]} ${
          variantClasses[variant]
        } ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
