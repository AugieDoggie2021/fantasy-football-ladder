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
      "inline-flex items-center justify-center gap-2 rounded-md font-sans font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface-alt disabled:opacity-60 disabled:cursor-not-allowed";

    const sizeClasses: Record<ButtonSize, string> = {
      sm: "h-9 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-5 text-base",
    };

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        "bg-brand-primary-500 text-white shadow-md hover:bg-brand-primary-600 focus:ring-brand-primary-200",
      secondary:
        "bg-brand-navy-800 text-white shadow-sm hover:bg-brand-navy-700 border border-brand-navy-600 focus:ring-brand-navy-300",
      ghost:
        "bg-transparent text-brand-navy-700 hover:bg-brand-navy-50 focus:ring-brand-navy-200",
      destructive:
        "bg-status-error text-white shadow-sm hover:bg-red-600 focus:ring-red-200",
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

