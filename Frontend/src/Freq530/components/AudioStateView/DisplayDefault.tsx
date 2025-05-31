import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { ColorSwatch } from "./types";
import { getColorStyles, getSwatchColor } from "./utils";

const DisplayDefault = ({ value, color }: { value: number; color: ColorSwatch }) => {
  return (
    <div className="text-xs w-full h-full mb-1 text-right" style={getColorStyles(color)}>
      {value.toFixed(2)}
    </div>
  );
};

export default DisplayDefault; 