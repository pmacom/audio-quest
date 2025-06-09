import { ColorSwatch } from "../../types";
import { getColorStyles } from "../../utils";

const FieldViewNumber = ({ value, color }: { value: number; color: ColorSwatch }) => {
  const fValue = Math.abs(value).toFixed(2);
  const isNegative = value < 0;

  return (
    <div className="field-view-normal h-[1rem] relative w-full pointer-events-none" style={getColorStyles(isNegative ? ColorSwatch.red : color)}>
      <div className="relative h-full rounded-sm overflow-hidden" aria-hidden="true">
        <div className="border-2 absolute h-full top-0 bottom-0 left-1/2 w-px bg-white/20" />
        <div className="w-full text-right">{fValue}</div>
      </div>
    </div>
  );
};

export default FieldViewNumber; 