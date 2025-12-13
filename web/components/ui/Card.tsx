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
      className={`rounded-3xl border border-slate-700/70 bg-slate-900/90 text-slate-300 backdrop-blur-sm shadow-[0_18px_45px_rgba(0,0,0,0.75)] ${paddingClasses[padding]} ${className}`}
    >
      {children}
    </div>
  );
}
