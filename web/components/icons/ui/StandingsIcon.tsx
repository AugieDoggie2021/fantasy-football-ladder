import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface StandingsIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function StandingsIcon({
  size = 24,
  className = "",
  ariaLabel = "Standings",
}: StandingsIconProps) {
  return (
    <Image
      src="/assets/ui/icon-standings.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

