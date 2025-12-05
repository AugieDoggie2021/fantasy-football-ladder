import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface QBIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function QBIcon({
  size = 24,
  className = "",
  ariaLabel = "Quarterback",
}: QBIconProps) {
  return (
    <Image
      src="/assets/positions/pos-qb.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

