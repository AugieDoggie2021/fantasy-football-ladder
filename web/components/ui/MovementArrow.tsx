import {
  PromotionArrowIcon,
  RelegationArrowIcon,
} from "@/components/icons";

interface MovementArrowProps {
  direction: "up" | "down";
  magnitude?: number;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * MovementArrow component for showing promotion/relegation
 * @param direction - "up" for promotion, "down" for relegation
 * @param magnitude - Optional number to scale the arrow (e.g., for big jumps)
 * @param size - Base size of the arrow
 */
export default function MovementArrow({
  direction,
  magnitude = 1,
  size = 24,
  className = "",
  ariaLabel,
}: MovementArrowProps) {
  const scaledSize = Math.round(size * (1 + magnitude * 0.2)); // Scale up to 20% for large movements
  const defaultAriaLabel =
    ariaLabel || (direction === "up" ? "Promoted" : "Relegated");

  if (direction === "up") {
    return (
      <PromotionArrowIcon
        size={scaledSize}
        className={className}
        ariaLabel={defaultAriaLabel}
      />
    );
  }

  return (
    <RelegationArrowIcon
      size={scaledSize}
      className={className}
      ariaLabel={defaultAriaLabel}
    />
  );
}

