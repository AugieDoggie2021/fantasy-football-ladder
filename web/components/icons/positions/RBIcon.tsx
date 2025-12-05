import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface RBIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function RBIcon({
  size = 24,
  className = "",
  ariaLabel = "Running Back",
}: RBIconProps) {
  return (
    <Image
      src="/assets/positions/pos-rb.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

