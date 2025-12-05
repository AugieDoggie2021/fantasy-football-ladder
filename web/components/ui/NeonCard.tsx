import { ReactNode } from "react";
import { neonPanelStyle } from "@/lib/design/neon-theme";
import { colors, glow } from "@/lib/design/design-tokens";

interface NeonCardProps {
  children: ReactNode;
  className?: string;
  elevation?: "soft" | "medium" | "strong";
}

export default function NeonCard({
  children,
  className = "",
  elevation = "soft",
}: NeonCardProps) {
  const elevationStyles = {
    soft: { boxShadow: glow.softGreen },
    medium: { boxShadow: `0 0 16px ${colors.kellyGreenSoft}` },
    strong: { boxShadow: glow.strongGreen },
  };

  const combinedClassName = `ff-neon-panel ${className}`.trim();

  return (
    <div
      className={combinedClassName}
      style={{
        ...neonPanelStyle,
        ...elevationStyles[elevation],
      }}
    >
      {children}
    </div>
  );
}

