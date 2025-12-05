import Image from "next/image";
import { getTierGlow } from "@/lib/design/neon-theme";

interface TierBadgeIconProps {
  tier: 1 | 2 | 3 | 4;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function TierBadgeIcon({
  tier,
  size = 40,
  className = "",
  ariaLabel,
}: TierBadgeIconProps) {
  const defaultAriaLabel = ariaLabel || `Tier ${tier} Badge`;
  const imagePath = `/assets/badges/badge-tier-${tier}@2x.png`;
  const glowStyle = { filter: getTierGlow(tier) };

  return (
    <Image
      src={imagePath}
      alt={defaultAriaLabel}
      width={size}
      height={size}
      className={className}
      style={glowStyle}
    />
  );
}

