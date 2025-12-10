import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?:
    | "primary"
    | "success"
    | "warning"
    | "info"
    | "neutral"
    | "accent"
    | "destructive"
    // Legacy mappings
    | "tier1"
    | "promoted"
    | "commissioner"
    | "default";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  const baseClasses =
    "inline-flex items-center gap-1 px-3 py-1 rounded-pill text-xs font-sans font-semibold tracking-tight";

  const variantClasses = {
    primary: "bg-brand-primary-100 text-brand-nav border border-brand-primary-200",
    success: "bg-brand-primary-50 text-brand-primary-700 border border-brand-primary-200",
    warning: "bg-brand-gold-50 text-brand-nav border border-brand-gold-200",
    info: "bg-brand-navy-50 text-brand-navy-700 border border-brand-navy-200",
    neutral: "bg-brand-navy-50 text-brand-navy-600 border border-brand-navy-100",
    accent: "bg-brand-gold-400 text-brand-nav border border-brand-gold-500",
    destructive: "bg-status-error text-white border border-status-error",
    tier1: "bg-brand-primary-500 text-white",
    promoted: "bg-brand-gold-400 text-brand-nav",
    commissioner: "bg-brand-gold-500 text-brand-nav",
    default: "bg-brand-navy-800 text-white",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

