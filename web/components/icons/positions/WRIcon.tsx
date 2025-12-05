import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface WRIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function WRIcon({
  size = 24,
  className = "",
  ariaLabel = "Wide Receiver",
}: WRIconProps) {
  return (
    <Image
      src="/assets/positions/pos-wr.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

