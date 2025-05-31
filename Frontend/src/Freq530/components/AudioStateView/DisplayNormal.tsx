import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ColorSwatch } from "./types";
import { getColorStyles, getSwatchColor } from "./utils";

const DisplayNormal = ({ value, color }: { value: number; color: ColorSwatch }) => {
  const widthPercentage = Math.max(value, 0) * 50; // Only positive values, scaled to 50% max
  const barClasses = useMemo(() => cn("absolute top-0 bottom-0 h-full"), []);
  // Opacity is proportional to value, clamped between 0 and 1
  const opacity = Math.max(0, Math.min(1, value));

  return (
    <div className="w-full h-full mb-1" style={getColorStyles(color)}>
      <div className="relative h-[1rem] rounded-sm overflow-hidden" aria-hidden="true">
        <div className="border-2 absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
        <div
          className={barClasses}
          style={{
            width: `${widthPercentage}%`,
            left: "50%",
            backgroundColor: `var(${getSwatchColor(color)}, #22c55e)`,
            opacity,
          }}
        />
      </div>
    </div>
  );
};

export default DisplayNormal; 