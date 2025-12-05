import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface LeagueTrophyIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function LeagueTrophyIcon({
  size = 24,
  className = "",
  ariaLabel = "League",
}: LeagueTrophyIconProps) {
  return (
    <Image
      src="/assets/ui/icon-league-trophy.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

