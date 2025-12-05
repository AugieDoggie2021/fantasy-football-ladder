import Image from "next/image";
import { strongGreenGlowStyle } from "@/lib/design/neon-theme";

interface PromotionArrowIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function PromotionArrowIcon({
  size = 24,
  className = "",
  ariaLabel = "Promotion",
}: PromotionArrowIconProps) {
  // Using badge-promotion as the promotion arrow asset
  // If a dedicated arrow asset exists, update the path
  return (
    <Image
      src="/assets/badges/badge-promotion@2x.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={strongGreenGlowStyle}
    />
  );
}

