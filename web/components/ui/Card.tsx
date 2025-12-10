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
    sm: "p-6",
    md: "p-6 md:p-8",
    lg: "p-8 md:p-10",
  };

  return (
    <div
      className={`rounded-2xl border border-slate-700/40 bg-slate-900/60 text-slate-300 backdrop-blur-sm shadow-xl ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
