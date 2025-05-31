import { DisplayType, ColorSwatch } from "./types";
import DisplayBipolar from "./DisplayBipolar";
import DisplayBoolean from "./DisplayBoolean";
import DisplayNormal from "./DisplayNormal";
import DisplayChromaVector from "./DisplayChromaVector";
import DisplayDefault from "./DisplayDefault";
const DisplayComponent = ({ displayType, value, color, chromaVector }: { displayType: DisplayType; value: number; color: ColorSwatch; chromaVector?: Float32Array }) => {
  switch (displayType) {
    case DisplayType.Bipolar:
      return <DisplayBipolar label="" value={value} color={color} />;
    case DisplayType.Boolean:
      return <DisplayBoolean value={!!value} color={color} />;
    case DisplayType.Normal:
      return <DisplayNormal value={value} color={color} />;
    case DisplayType.ChromaVector:
      return <DisplayChromaVector label="" value={value} chromaVector={chromaVector!} color={color} />;
    default:
      return <DisplayDefault value={value} color={color} />;
  }
};

export default DisplayComponent; 