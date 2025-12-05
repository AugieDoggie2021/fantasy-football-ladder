import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface TEIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function TEIcon({
  size = 24,
  className = "",
  ariaLabel = "Tight End",
}: TEIconProps) {
  return (
    <Image
      src="/assets/positions/pos-te.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

