import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface HomeIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function HomeIcon({
  size = 24,
  className = "",
  ariaLabel = "Home",
}: HomeIconProps) {
  return (
    <Image
      src="/assets/ui/icon-home.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

