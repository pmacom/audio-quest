import { useMemo } from "react";
import { DisplayRowProps } from "./types";
import { getColorStyles, getSwatchColor, getNormalizedUnit } from "./utils";
import DisplayComponent from "./DisplayComponent";
import { useFreq530 } from "@/Freq530/stores/useFreq530";

const DisplayRow = ({ label, value, labelColor, displayType }: DisplayRowProps) => {
  const labelColorClass = useMemo(() => `text-[var(${getSwatchColor(labelColor)}, #ffffff)]`, [labelColor]);
  const normalized = useMemo(() => getNormalizedUnit(typeof value === 'number' ? value : 0), [value]);
  const { chromaVector } = useFreq530();

  return (
    <div className="relative flex flex-row gap-[1px] mb-[1px] text-[12px]" style={getColorStyles(labelColor)}>
      <div className={`grow relative z-[2] ${labelColorClass}`}>
        <div className={`opacity-50 w-32 text-right ${labelColorClass}`}>hi hi {label}</div>
        <div className="absolute top-0 left-0 w-full h-full opacity-50">
          <DisplayComponent
            displayType={displayType}
            value={value}
            color={labelColor}
            chromaVector={displayType === 3 ? chromaVector : undefined}
          />
        </div>
      </div>
      <div className={`z-[2] w-20 text-right font-mono ${labelColorClass}`}>
        {displayType === 3 ? '' : normalized.formatted}
      </div>
    </div>
  );
};

export default DisplayRow; 