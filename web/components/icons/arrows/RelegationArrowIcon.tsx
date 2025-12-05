import Image from "next/image";
import { strongRedGlowStyle } from "@/lib/design/neon-theme";

interface RelegationArrowIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function RelegationArrowIcon({
  size = 24,
  className = "",
  ariaLabel = "Relegation",
}: RelegationArrowIconProps) {
  // Using badge-relegation as the relegation arrow asset
  // If a dedicated arrow asset exists, update the path
  return (
    <Image
      src="/assets/badges/badge-relegation@2x.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={strongRedGlowStyle}
    />
  );
}

