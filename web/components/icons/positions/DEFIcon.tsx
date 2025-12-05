import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface DEFIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function DEFIcon({
  size = 24,
  className = "",
  ariaLabel = "Defense",
}: DEFIconProps) {
  return (
    <Image
      src="/assets/positions/pos-def.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

