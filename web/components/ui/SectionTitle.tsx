import { ReactNode } from "react";

interface SectionTitleProps {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
  className?: string;
}

export function SectionTitle({
  children,
  as: Component = "h2",
  className = "",
}: SectionTitleProps) {
  const baseClasses = "font-display font-semibold text-brand-nav";

  const sizeClasses = {
    h1: "text-4xl md:text-5xl",
    h2: "text-3xl md:text-4xl",
    h3: "text-2xl md:text-3xl",
    h4: "text-xl md:text-2xl",
  };

  return (
    <Component
      className={`${baseClasses} ${sizeClasses[Component]} ${className}`}
    >
      {children}
    </Component>
  );
}

