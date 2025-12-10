import { ReactNode } from "react";
import {
  neonPanelStyle,
  softGreenGlowStyle,
  mediumGreenGlowStyle,
  strongGreenGlowStyle,
} from "@/lib/design/neon-theme";

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
    soft: softGreenGlowStyle,
    medium: mediumGreenGlowStyle,
    strong: strongGreenGlowStyle,
  };

  return (
    <div
      className={className}
      style={{
        ...neonPanelStyle,
        ...elevationStyles[elevation],
      }}
    >
      {children}
    </div>
  );
}

