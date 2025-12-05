import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface FantasyPointsIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function FantasyPointsIcon({
  size = 24,
  className = "",
  ariaLabel = "Fantasy Points",
}: FantasyPointsIconProps) {
  return (
    <Image
      src="/assets/ui/icon-fantasy-points.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

