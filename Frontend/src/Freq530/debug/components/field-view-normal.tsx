import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ColorSwatch } from "../../types";
import { getColorStyles, getSwatchColor } from "../../utils";

const FieldViewNormal = ({ value, color }: { value: number; color: ColorSwatch }) => {
  const widthPercentage = Math.abs(value) * 100
  const barClasses = useMemo(() => cn("absolute top-0 bottom-0 h-full"), []);
  const opacity = 1

  return (
    <div className="field-view-normal h-[1rem] relative w-full pointer-events-none" style={getColorStyles(color)}>
      <div className="relative h-full rounded-sm overflow-hidden" aria-hidden="true">
        <div className="border-2 absolute h-full top-0 bottom-0 left-1/2 w-px bg-white/20" />
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

export default FieldViewNormal; 