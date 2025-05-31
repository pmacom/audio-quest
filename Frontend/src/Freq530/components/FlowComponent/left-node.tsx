"use client"

import { memo, useMemo } from "react"
import { Handle, Position } from "reactflow"
import { useFreq530 } from "@/Freq531/stores/useFreq530"
import { getDisplayConfig } from "../AudioStateView/displayConfig"
import DisplayComponent from "../AudioStateView/DisplayComponent"

type Connection = {
  id: string
  name: string
}

type LeftNodeProps = {
  data: {
    connections: Connection[]
  }
}

const LeftNode = ({ data }: LeftNodeProps) => {
  const state = useFreq530();

  const connections = useMemo(() => {
    if (!data.connections) return null;
    return data.connections.map((connection) => {
      const config = getDisplayConfig(connection.id as any);
      if (!config) return null;
      let value = state[connection.id as keyof typeof state];
      if (typeof value === 'boolean') value = value ? 1 : 0;
      if (value instanceof Float32Array) value = 0;
      if (typeof value !== 'number') value = 0;
      return (
        <div key={connection.id} className="flex justify-between items-center relative h-5">
          <div className="w-full mr-2 overflow-hidden flex items-center gap-2">
            <div className="text-xs opacity-50">{config.label}</div>
            <div className="flex-1">
              <DisplayComponent displayType={config.displayType} value={value} color={config.color} />
            </div>
          </div>
          <Handle
            type="source"
            position={Position.Right}
            id={connection.id}
            style={{
              background: "#555",
              width: 10,
              height: 10,
              right: -5,
              top: "50%",
              border: "1px solid #555",
              transform: "translateY(-50%)",
            }}
            isConnectable={true}
          />
        </div>
      );
    });
  }, [data.connections, state]);

  return (
    <div className="border-r-2 border-gray-300/20 bg-transparent h-screen overflow-y-auto fixed top-0 left-0 w-64 z-10">
      <div className="sticky top-0 bg-transparent p-2 border-b border-gray-200/20 z-20">
        <div className="text-center font-bold mb-1 text-lg">Audio Data</div>
      </div>
      <div className="p-2 space-y-1">
        {connections}
      </div>
    </div>
  );
};

export default memo(LeftNode);
