import { Star } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = 20,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" role={onChange ? "radiogroup" : undefined} aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= shown;
        const icon = (
          <Star
            style={{ width: size, height: size }}
            className={cn("transition-all", filled ? "fill-gold text-gold" : "text-border")}
            strokeWidth={1.5}
          />
        );
        if (!onChange) return <span key={n}>{icon}</span>;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} bintang`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
}
