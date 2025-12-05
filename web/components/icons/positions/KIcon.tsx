import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface KIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function KIcon({
  size = 24,
  className = "",
  ariaLabel = "Kicker",
}: KIconProps) {
  return (
    <Image
      src="/assets/positions/pos-k.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

