import React, { useEffect } from "react";
import { useFreq530 } from "./stores/useFreq530";

const enum FieldType {
  Neg1To1 = "neg1to1",
  Zero1 = "zero1",
  Number = "number",
}

const fieldTypes: Record<string, FieldType> = {
  time: FieldType.Number,
  adjustedTime: FieldType.Number,
  sin: FieldType.Neg1To1,
  cos: FieldType.Neg1To1,
  sinNormal: FieldType.Zero1,
  cosNormal: FieldType.Zero1,
  adjustedSin: FieldType.Neg1To1,
  adjustedCos: FieldType.Neg1To1,
  adjustedSinNormal: FieldType.Zero1,
  adjustedCosNormal: FieldType.Zero1,
  low: FieldType.Zero1,
  mid: FieldType.Zero1,
  high: FieldType.Zero1,
  kick: FieldType.Zero1,
  snare: FieldType.Zero1,
  hihat: FieldType.Zero1,
  vocalLikelihood: FieldType.Zero1,
  amplitude: FieldType.Zero1,
  rawAmplitude: FieldType.Number,
  beatIntensity: FieldType.Zero1,
  bps: FieldType.Number,
  lowDynamic: FieldType.Zero1,
  midDynamic: FieldType.Zero1,
  highDynamic: FieldType.Zero1,
  kickDynamic: FieldType.Zero1,
  snareDynamic: FieldType.Zero1,
  hihatDynamic: FieldType.Zero1,
  amplitudeDynamic: FieldType.Zero1,
  rawAmplitudeDynamic: FieldType.Number,
};

const fieldKeys = [
  "time",
  "adjustedTime",
  "sin",
  "cos",
  "sinNormal",
  "cosNormal",
  "adjustedSin",
  "adjustedCos",
  "adjustedSinNormal",
  "adjustedCosNormal",
  "low",
  "mid",
  "high",
  "kick",
  "snare",
  "hihat",
  "vocalLikelihood",
  "amplitude",
  "rawAmplitude",
  "beatIntensity",
  "bps",
  "lowDynamic",
  "midDynamic",
  "highDynamic",
  "kickDynamic",
  "snareDynamic",
  "hihatDynamic",
  "amplitudeDynamic",
  "rawAmplitudeDynamic",
] as const;

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

  // Select each field individually to avoid infinite loops
  const fieldValues = fieldKeys.map(key => useFreq530(s => s[key]));
  const fields: Record<string, number> = Object.fromEntries(fieldKeys.map((key, i) => [key, fieldValues[i]]));

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
    <div style={{
      fontFamily: "sans-serif",
      background: "#181818",
      color: "#eee",
      padding: "2em",
      minHeight: "100vh"
    }}>
      <h2>Audio WebSocket State</h2>
      <div>
        {Object.entries(fields).map(([key, value]) => {
          const type = fieldTypes[key] || "number";
          return (
            <div className="field text-xs" key={key} style={{ marginBottom: "1em" }}>
              <span className="label" style={{ display: "inline-block", width: 180, fontWeight: "bold" }}>{key}</span>
              {(type === "neg1to1" || type === "zero1") ? (() => {
                const { percent, color } = getBarProps(value as number, type);
                return (
                  <span className="bar-bg" style={{
                    display: "inline-block",
                    width: 300,
                    height: 12,
                    background: "#333",
                    borderRadius: 9,
                    verticalAlign: "middle",
                    marginRight: 10,
                    overflow: "hidden"
                  }}>
                    <span className="bar-fill" style={{
                      display: "inline-block",
                      height: "100%",
                      width: `${percent}%`,
                      background: color,
                      borderRadius: 9,
                      transition: "width 0.15s, background 0.15s"
                    }} />
                  </span>
                );
              })() : null}
              <span className="value" style={{
                display: "inline-block",
                minWidth: 60,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums"
              }}>
                {typeof value === "number" ? (value as number).toFixed(3) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
