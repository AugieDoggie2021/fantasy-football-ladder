import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface HomeFootballIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function HomeFootballIcon({
  size = 24,
  className = "",
  ariaLabel = "Home",
}: HomeFootballIconProps) {
  return (
    <Image
      src="/assets/ui/icon-home-football.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

