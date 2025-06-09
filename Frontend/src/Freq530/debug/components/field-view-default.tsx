import { ColorSwatch } from "../../types";
import { getColorStyles } from "../../utils";

const FieldViewDefault = ({ value, color }: { value: number; color: ColorSwatch }) => {
  return (
    <div className="field-view-default text-xs text-white w-full h-full text-right pointer-events-none" style={getColorStyles(color)}>
      {value.toFixed(2)}
    </div>
  );
};

export default FieldViewDefault; 