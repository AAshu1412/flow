import { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
} from '@xyflow/react';
import DynamicNode from './DynamicNode';
import { useDnD } from './DnDContext';

const nodeTypes = { dynamic: DynamicNode };

export default function FlowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const { screenToFlowPosition } = useReactFlow();
  const [draggedType] = useDnD();

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!draggedType) {
        return;
      }

      const payload = draggedType;
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        type: 'dynamic',
        position,
        data: {
          service: payload.service,
          operation: payload.operation,
          label: payload.label,
          selectedAccounts: '',
          inputs: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, draggedType],
  );

  // Delete selected edges on click
  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: any) => {
    setEdges((eds) => eds.filter((e: any) => e.id !== edge.id));
  }, [setEdges]);

  return (
    <div className="w-full h-full bg-gray-950" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onEdgeClick={onEdgeClick}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
      >
        <Background gap={16} size={1} color="#334155" />
        <Controls className="flex flex-col overflow-hidden rounded-lg shadow-lg [&>button]:!bg-gray-950 [&>button]:!border-b-gray-800 [&>button]:!fill-gray-400 hover:[&>button]:!bg-gray-900 hover:[&>button]:!fill-gray-200 [&>button]:transition-colors" />
        <MiniMap
          nodeColor="#3b82f6"
          maskColor="rgba(0, 0, 0, 0.4)"
          className="bg-gray-900 border-gray-800"
        />
      </ReactFlow>
    </div>
  );
}