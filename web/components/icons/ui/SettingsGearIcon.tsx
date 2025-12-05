import Image from "next/image";
import { mediumGreenGlowStyle } from "@/lib/design/neon-theme";

interface SettingsGearIconProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function SettingsGearIcon({
  size = 24,
  className = "",
  ariaLabel = "Settings",
}: SettingsGearIconProps) {
  return (
    <Image
      src="/assets/ui/icon-settings-gear.png"
      alt={ariaLabel}
      width={size}
      height={size}
      className={className}
      style={mediumGreenGlowStyle}
    />
  );
}

