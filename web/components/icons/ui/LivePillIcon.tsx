import Image from "next/image";
import { strongGreenGlowStyle } from "@/lib/design/neon-theme";

interface LivePillIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function LivePillIcon({
  size = 24,
  className = "",
  ariaLabel = "Live",
}: LivePillIconProps) {
  return (
    <Image
      src="/assets/ui/icon-live-pill.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={strongGreenGlowStyle}
    />
  );
}

