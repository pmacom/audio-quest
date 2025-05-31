"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import ReactFlow, {
  type Node,
  type NodeTypes,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  ConnectionLineType,
  Panel,
  type EdgeChange,
} from "reactflow"
import "reactflow/dist/style.css"
import LeftNode from "./left-node"
import RightNode from "./right-node"
import AnimatedAudioEdge from "./AnimatedAudioEdge"
import { BASE_AUDIO_KEYS, getDisplayConfig } from "../AudioStateView/displayConfig"
import { useTweakStore } from "./right-node"
import { useFreq530 } from "@/Freq530/stores/useFreq530"

// Dynamically generate leftConnections from BASE_AUDIO_KEYS and displayConfig
const leftConnections = BASE_AUDIO_KEYS.map((key) => {
  const config = getDisplayConfig(key);
  return { id: key, name: config ? config.label : key };
});

// Generate connection names for right node (10 tweaks)
const rightConnections = Array.from({ length: 10 }, (_, i) => ({
  id: `right-${i}`,
  name: `Tweak ${i + 1}`,
}))

const FlowComponent = () => {
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200)
  const connectionState = useFreq530(s => s.connectionState);
  const connectWebSocket = useFreq530(s => s.connectWebSocket);

  useEffect(() => {
    if (connectionState === "idle") {
      connectWebSocket();
    }
  }, [connectionState, connectWebSocket]);


  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Define custom node and edge types
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      leftNode: LeftNode,
      rightNode: RightNode,
    }),
    [],
  )
  const edgeTypes = useMemo(() => ({ animatedAudio: AnimatedAudioEdge }), [])

  // Initial nodes setup
  const initialNodes: Node[] = [
    {
      id: "left-node",
      type: "leftNode",
      position: { x: 0, y: 0 },
      data: { connections: leftConnections },
      style: { height: "100%", width: 300 },
    },
    {
      id: "right-node",
      type: "rightNode",
      position: { x: windowWidth - 300, y: 0 },
      data: { connections: rightConnections },
      style: { height: "100%", width: 300 },
    },
  ]

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Update right node position on window resize
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === "right-node") {
          node.position = { x: windowWidth - 300, y: 0 }
        }
        return node
      }),
    )
  }, [windowWidth, setNodes])

  // Handle new connections (enforce one-to-one for right node connectors)
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => {
        // Remove any existing edge to this target handle
        const filtered = eds.filter(
          (e) => !(e.target === params.target && e.targetHandle === params.targetHandle)
        )
        // Get color for the source handle
        const config = getDisplayConfig(params.sourceHandle as any)
        const color = config ? `var(--color-${config.color}, #22c55e)` : "#22c55e"
        // Defer zustand setter to after render
        setTimeout(() => {
          useTweakStore.getState().setConnection(params.targetHandle!, params.sourceHandle!)
        }, 0)
        return addEdge(
          {
            ...params,
            type: "animatedAudio",
            animated: true,
            style: { stroke: color, strokeWidth: 3 },
            data: { sourceField: params.sourceHandle },
          },
          filtered
        )
      })
    },
    [setEdges]
  )

  // Custom onEdgesChange to clear tweak connection when edge is removed
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    changes.forEach((change: any) => {
      if (change.type === "remove" && change.id) {
        // Find the edge being removed
        const edge = edges.find((e) => e.id === change.id)
        if (edge && edge.targetHandle) {
          useTweakStore.getState().setConnection(edge.targetHandle, null)
        }
      }
    })
    onEdgesChange(changes)
  }, [edges, onEdgesChange])


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
    <div className="text-white flow-container relative h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.Bezier}
        fitView={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        panOnScroll={false}
        panOnDrag={false}
        nodesDraggable={false}
        nodesConnectable={true}
        elementsSelectable={true}
        minZoom={1}
        maxZoom={1}
        className="h-full"
        proOptions={{ hideAttribution: true }}
      >
        <Panel position="top-center" className="fixed !z-[-1] w-full h-full !m-0 p-0">
          <div className="fixed !z-[-1] w-full h-full"></div>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export default FlowComponent
