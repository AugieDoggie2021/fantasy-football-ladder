import { TierBadgeIcon } from "@/components/icons";

interface TierBadgeProps {
  tier: 1 | 2 | 3 | 4;
  label?: string;
  size?: number;
  className?: string;
}

export default function TierBadge({
  tier,
  label,
  size = 40,
  className = "",
}: TierBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <TierBadgeIcon tier={tier} size={size} />
      {label && (
        <span className="ff-neon-text text-sm font-medium">{label}</span>
      )}
    </div>
  );
}

