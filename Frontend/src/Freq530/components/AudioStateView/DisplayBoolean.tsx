import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ColorSwatch } from "./types";
import { getColorStyles, getSwatchColor } from "./utils";

const DisplayBoolean = ({ value, color }: { value: boolean; color: ColorSwatch }) => {
  const circleClasses = useMemo(() => cn("w-3 h-3 mr-[10px] rounded-full"), []);

  return (
    <div className="absolute flex flex-row gap-[1px] mb-[1px] top-0 left-0 w-full h-full" style={getColorStyles(color)}>
      <div className="grow z-[2] flex flex-row items-center justify-end">
        <div
          className={circleClasses}
          style={{
            backgroundColor: `var(${getSwatchColor(color)}, #22c55e)`,
            opacity: value ? 0.5 : 0.3,
          }}
        />
      </div>
      <div className="z-[2] w-15 text-right" />
    </div>
  );
};

export default DisplayBoolean; 