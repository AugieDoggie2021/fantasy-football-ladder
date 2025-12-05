import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface MatchupsIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function MatchupsIcon({
  size = 24,
  className = "",
  ariaLabel = "Matchups",
}: MatchupsIconProps) {
  return (
    <Image
      src="/assets/ui/icon-matchups.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

