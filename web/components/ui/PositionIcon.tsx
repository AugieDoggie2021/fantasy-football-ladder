import { PositionIcon as BasePositionIcon, PositionType } from "@/components/icons";

interface PositionIconProps {
  type: PositionType;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * UI wrapper for PositionIcon with sensible defaults for app usage
 */
export default function PositionIcon({
  type,
  size = 32,
  className = "",
  ariaLabel,
}: PositionIconProps) {
  return (
    <BasePositionIcon
      type={type}
      size={size}
      className={className}
      ariaLabel={ariaLabel}
    />
  );
}

