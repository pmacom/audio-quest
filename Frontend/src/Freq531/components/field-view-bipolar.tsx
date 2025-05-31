import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ColorSwatch, DisplayBipolarProps } from "../types";
import { getColorStyles, getSwatchColor } from "../utils";

const FieldViewBipolar = ({ label, value, color, className = "" }: DisplayBipolarProps) => {
  const widthPercentage = Math.abs(value) * 50;
  const isNegative = value < 0;
  const position = isNegative ? "right" : "left";
  const wrapperClasses = useMemo(() => cn("relative field-view-bipolar w-full h-[1rem] pointer-events-none", className), [className]);
  const barClasses = useMemo(() => cn("absolute top-0 bottom-0 h-full"), []);

  return (
    <div className={wrapperClasses} style={getColorStyles(color)}>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20" />
        <div
          className={barClasses}
          style={{
            width: `${widthPercentage}%`,
            [position]: "50%",
            backgroundColor: `var(${getSwatchColor(color)}, #22c55e)`,
            opacity: isNegative ? 0.3 : 0.5,
          }}
        />
      </div>
    </div>
  );
};

export default FieldViewBipolar; 