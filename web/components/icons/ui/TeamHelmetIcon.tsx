import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface TeamHelmetIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function TeamHelmetIcon({
  size = 24,
  className = "",
  ariaLabel = "Team",
}: TeamHelmetIconProps) {
  return (
    <Image
      src="/assets/ui/icon-team-helmet.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

