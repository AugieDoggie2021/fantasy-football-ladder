"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface TabsProps {
  children: ReactNode;
  className?: string;
}

interface TabProps {
  href: string;
  children: ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}

export function Tabs({ children, className = "" }: TabsProps) {
  return (
    <nav className={`mb-6 ${className}`}>
      <div className="flex flex-wrap gap-4 border-b border-brand-navy-100 pb-2">
        {children}
      </div>
    </nav>
  );
}

Tabs.Tab = function Tab({
  href,
  children,
  icon: Icon,
  className = "",
}: TabProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname?.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-2 px-1 py-3 transition-colors font-sans text-sm font-semibold border-b-2
        ${
          isActive
            ? "text-brand-navy-900 border-brand-primary-500"
            : "text-brand-navy-500 border-transparent hover:text-brand-navy-700 hover:border-brand-navy-200"
        }
        ${className}
      `}
    >
      {Icon && (
        <Icon size={18} className={isActive ? "text-brand-navy-900" : "text-brand-navy-400"} />
      )}
      <span>{children}</span>
    </Link>
  );
};

