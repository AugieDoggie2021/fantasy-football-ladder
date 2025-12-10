import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  padding = "md",
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={`bg-brand-surface-alt text-brand-nav rounded-lg shadow-lg border border-brand-navy-100 ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

