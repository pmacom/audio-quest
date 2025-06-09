import { ColorSwatch } from "../../types";
import FieldViewBipolar from "./field-view-bipolar";
import FieldViewNormal from "./field-view-normal";
import { Freq530FieldType } from "../../types";
import { FieldViewNumberArray } from "./field-view-numberArray";
import FieldViewNumber from "./field-view-number";
import FieldViewDebug from "./field-view-debug";
import { FieldViewNumberArrayBars } from "./field-view-numberArrayBars";
import { FieldViewSpectogram } from "./field-view-spectogram";

interface FieldViewComponentProps {
  displayType: Freq530FieldType;
  value: number | number[];
  color: ColorSwatch;
}

const FieldViewComponent = ({ displayType, value, color }: FieldViewComponentProps) => {
  switch (displayType) {
    case Freq530FieldType.Neg1To1:
      return (
        <div className="border-2b border-red-500b w-full h-full pointer-events-none">
          <FieldViewBipolar label="" value={value as number} color={color} />
        </div>
      );
    case Freq530FieldType.Zero1:
      return (
        <div className="border-2b border-green-500b w-full h-full pointer-events-none">
          <FieldViewNormal value={value as number} color={color} />
        </div>
      );
    case Freq530FieldType.Number:
      return (
        <div className="border-2b border-grey-500b w-full h-full pointer-events-none">
          <FieldViewNumber value={value as number} color={color} />
        </div>
      );
    case Freq530FieldType.NumberArray:
      return (
        <div className="border-2b border-orange-500b w-full h-full pointer-events-none">
          <FieldViewNumberArray values={value as number[]} color={color} />
        </div>
      );
    case Freq530FieldType.Debug:
      return (
        <div className="border-2b border-purple-500b w-full h-full pointer-events-none">
          <FieldViewDebug value={value as number} color={color} />
        </div>
      );
    case Freq530FieldType.NumberArrayBars:
      return (
        <div className="border-2b border-purple-500b w-full h-full pointer-events-none">
          <FieldViewNumberArrayBars values={value as number[]} color={color} />
        </div>
      );
    case Freq530FieldType.Spectogram:
      return (
        <div className="border-2b border-purple-500b w-full h-full pointer-events-none">
          <FieldViewSpectogram value={value as unknown as Uint8Array} />
        </div>
      );
    default:
      return <>NOIDEA</>
  }
};

export default FieldViewComponent; 