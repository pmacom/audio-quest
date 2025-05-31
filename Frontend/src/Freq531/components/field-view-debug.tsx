import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ColorSwatch } from "../types";
import { getColorStyles, getSwatchColor } from "../utils";

const FieldViewDebug = ({ value, color }: { value: number | number[]; color: ColorSwatch }) => {
  return (
    <div className="field-view-default text-xs w-full h-full text-right pointer-events-none" style={getColorStyles(color)}>
      { JSON.stringify(value)}
    </div>
  );
};

export default FieldViewDebug; 