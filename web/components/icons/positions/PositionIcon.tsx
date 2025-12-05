import { QBIcon, RBIcon, WRIcon, TEIcon, KIcon, DEFIcon } from "./index";

export type PositionType = "QB" | "RB" | "WR" | "TE" | "K" | "DEF";

interface PositionIconProps {
  type: PositionType;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

export default function PositionIcon({
  type,
  size = 24,
  className = "",
  ariaLabel,
}: PositionIconProps) {
  const defaultAriaLabel = ariaLabel || type;
  
  switch (type) {
    case "QB":
      return <QBIcon size={size} className={className} ariaLabel={defaultAriaLabel} />;
    case "RB":
      return <RBIcon size={size} className={className} ariaLabel={defaultAriaLabel} />;
    case "WR":
      return <WRIcon size={size} className={className} ariaLabel={defaultAriaLabel} />;
    case "TE":
      return <TEIcon size={size} className={className} ariaLabel={defaultAriaLabel} />;
    case "K":
      return <KIcon size={size} className={className} ariaLabel={defaultAriaLabel} />;
    case "DEF":
      return <DEFIcon size={size} className={className} ariaLabel={defaultAriaLabel} />;
    default:
      return null;
  }
}

