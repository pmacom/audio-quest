import React, { useEffect } from "react";
import { Freq530FieldKeys, Freq530FieldTypes, useFreq530 } from "./stores/useFreq530";
import { GetFieldType } from "./utils";
import { ColorSwatch } from "./types";
import FieldViewComponent from "./components/field-view-component";

function getBarProps(value: number, type: string) {
  let min = 0, max = 1, percent = 0, color = "#4caf50";
  if (type === "neg1to1") {
    min = -1; max = 1;
    percent = ((value - min) / (max - min)) * 100;
    color = value < 0 ? "#e53935" : "#4caf50";
  } else if (type === "zero1") {
    min = 0; max = 1;
    percent = ((value - min) / (max - min)) * 100;
    color = "#2196f3";
  }
  return { percent, color };
}

export const FreqTest = () => {
  const connectionState = useFreq530(s => s.connectionState);
  const connectWebSocket = useFreq530(s => s.connectWebSocket);

  // Filter out 'beatTimes' from both keys and values to keep indices aligned
  const filteredKeys = Freq530FieldKeys.filter(key => key !== "beatTimes");
  const filteredValues = filteredKeys.map(key => useFreq530(s => s.values[key]));
  const fields: Record<string, number> = Object.fromEntries(
    filteredKeys.map((key, i) => [key, filteredValues[i]])
  );

  useEffect(() => {
    if (connectionState === "idle") {
      connectWebSocket();
    }
  }, [connectionState, connectWebSocket]);

  if (connectionState !== "connected") {
    return (
      <div style={{
        fontFamily: "sans-serif",
        background: "#181818",
        color: "#eee",
        padding: "2em",
        minHeight: "100vh"
      }}>
        <h2>Audio WebSocket State</h2>
        <div>Connection state: {connectionState}</div>
      </div>
    );
  }

  return (
    <div className="z-[100] hidden flex flex-col gap-2 text-white p-2 w-full h-full pointer-events-none">
      {Object.entries(fields).map(([key, value]) => {
        const type = Freq530FieldTypes[key as keyof typeof Freq530FieldTypes] || "number";
        return (
          <div key={key} className="pointer-events-none rounded-md p-2 relative flex flex-row gap-2 items-center justify-center">
            <div className="pointer-events-none text-normal h-full flex px-2 items-center justify-center absolute top-0 left-0">{key}</div>
            <FieldViewComponent
              displayType={type}
              value={value}
              color={ColorSwatch.blue}
            />
          </div>
        );
      })}
    </div>
  );
};
