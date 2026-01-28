import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type NodeMouseHandler,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useProofStore, useUIStore, isValidConnection } from '../store';
import { nodeTypes } from './nodes';
import { edgeTypes, getEdgeStyle } from './edges';
import type { ProofNode, TacticType } from '../store/types';
import { useDemoData } from '../hooks/useDemoData';
import { TACTICS } from '../data/tactics';

/**
 * ProofCanvas Component
 *
 * The main proof visualization canvas using React Flow.
 * Renders the proof tree with custom goal, tactic, and lemma nodes.
 */
export function ProofCanvas() {
  // Initialize demo data for testing
  useDemoData();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  // Get state from stores
  const nodes = useProofStore((s) => s.nodes);
  const edges = useProofStore((s) => s.edges);
  const onNodesChange = useProofStore((s) => s.onNodesChange);
  const onEdgesChange = useProofStore((s) => s.onEdgesChange);
  const onConnect = useProofStore((s) => s.onConnect);
  const addTacticNode = useProofStore((s) => s.addTacticNode);

  const selectNode = useUIStore((s) => s.selectNode);
  const setHoveredNode = useUIStore((s) => s.setHoveredNode);
  const clearDragState = useUIStore((s) => s.clearDragState);

  // Handle node click for selection
  const onNodeClick: NodeMouseHandler<ProofNode> = useCallback(
    (_event, node) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // Handle node hover
  const onNodeMouseEnter: NodeMouseHandler<ProofNode> = useCallback(
    (_event, node) => {
      setHoveredNode(node.id);
    },
    [setHoveredNode]
  );

  const onNodeMouseLeave: NodeMouseHandler<ProofNode> = useCallback(() => {
    setHoveredNode(null);
  }, [setHoveredNode]);

  // Handle pane click to deselect
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Handle drag over to allow drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  // Parameterless tactics are immediately ready (no params needed)
  const PARAMETERLESS_TACTICS = ['split', 'left', 'right'];

  // Handle drop to create a new tactic node
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const tacticType = event.dataTransfer.getData('application/tactic-type') as TacticType;
      if (!tacticType) return;

      // Get tactic info
      const tacticInfo = TACTICS.find((t) => t.type === tacticType);
      if (!tacticInfo) return;

      // Convert screen position to flow position
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Parameterless tactics start as 'ready', others start as 'incomplete'
      const isParameterless = PARAMETERLESS_TACTICS.includes(tacticType);
      const initialStatus = isParameterless ? 'ready' : 'incomplete';

      // Create the tactic node
      const newNodeId = addTacticNode(
        {
          kind: 'tactic',
          tacticType,
          displayName: tacticInfo.displayName,
          parameters: {},
          status: initialStatus,
        },
        position
      );

      // Select the new node
      selectNode(newNodeId);
      clearDragState();
    },
    [screenToFlowPosition, addTacticNode, selectNode, clearDragState]
  );

  // Validate connections before allowing them
  const handleIsValidConnection = useCallback(
    (connection: Connection | { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) => {
      // Normalize the connection object
      const conn: Connection = {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
      };
      return isValidConnection(conn, nodes);
    },
    [nodes]
  );

  // Apply edge styles based on edge type
  const styledEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      style: getEdgeStyle(edge.data?.kind),
      animated: false, // No animated edges - use solid lines
    }));
  }, [edges]);

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={handleIsValidConnection}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          maxZoom: 1.5,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
        }}
        connectionLineStyle={{ stroke: '#94a3b8', strokeWidth: 2 }}
        proOptions={{
          hideAttribution: true,
        }}
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls />
        <MiniMap
          nodeStrokeColor={(node) => {
            if (node.type === 'goal') {
              const data = node.data;
              if (data.status === 'completed') return '#22c55e';
              if (data.status === 'in-progress') return '#fbbf24';
              return '#f97316';
            }
            if (node.type === 'tactic') return '#3b82f6';
            if (node.type === 'lemma') return '#22c55e';
            return '#6b7280';
          }}
          nodeColor={(node) => {
            if (node.type === 'goal') {
              const data = node.data;
              if (data.status === 'completed') return '#dcfce7';
              if (data.status === 'in-progress') return '#fef3c7';
              return '#ffedd5';
            }
            if (node.type === 'tactic') return '#dbeafe';
            if (node.type === 'lemma') return '#dcfce7';
            return '#f3f4f6';
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          className="!bottom-24 !right-4"
        />
      </ReactFlow>
    </div>
  );
}
