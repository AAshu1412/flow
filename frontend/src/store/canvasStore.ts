import { create } from 'zustand';
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  OnNodesChange,
  OnEdgesChange,
  OnConnect
} from '@xyflow/react';
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

export interface BackendNodeData {
    service: string;
    operation: string;
    selectedAccounts: string;
    inputs: Record<string, any>;
    // extra ui data
    label?: string;
}


export interface AshuNode {
  id: string;
  position: {x: number, y: number};
  data: any;
  type: string;
}
export type AppNode = Node<BackendNodeData>;

interface CanvasState {
  aaNode: AshuNode[];
  setAaNode: (node: AshuNode[]) => void;
  nodes: AppNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (node: AppNode) => void;
  updateNodeData: (id: string, data: Partial<BackendNodeData>) => void;
  setSelectedNodeId: (id: string | null) => void;
  getWorkflowPayload: () => { nodes: Record<string, any>; edges: any[] };
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  aaNode: [],
  setAaNode: (node: AshuNode[]) => set({ aaNode: node }),
  nodes: [],
  edges: [],
  selectedNodeId: null,


  onNodesChange: (changes: NodeChange[]) => {
    console.log('[STORE] 🟢 onNodesChange Fired!', changes);
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    console.log('[STORE] 🟡 onEdgesChange Fired!', changes);
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection: Connection) => {
    console.log('[STORE] 🔵 onConnect Fired! Trying to connect:', connection);
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  addNode: (node: AppNode) => {
    set({ nodes: [...get().nodes, node] });
  },

  updateNodeData: (id: string, partialData: Partial<BackendNodeData>) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...partialData } } : node
      ),
    });
  },

  setSelectedNodeId: (id: string | null) => {
    if (get().selectedNodeId !== id) {
      set({ selectedNodeId: id });
    }
  },

  getWorkflowPayload: () => {
    const { nodes, edges } = get();
    const backendNodes: Record<string, any> = {};

    nodes.forEach((node) => {
      backendNodes[node.id] = {
        id: node.id,
        service: node.data.service,
        operation: node.data.operation,
        selectedAccounts: node.data.selectedAccounts || "",
        inputs: node.data.inputs || {},
      };
    });

    const backendEdges = edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || "default"
    }));

    return {
      nodes: backendNodes,
      edges: backendEdges,
    };
  }
}));
