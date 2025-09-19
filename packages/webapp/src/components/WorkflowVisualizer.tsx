import type { NodeTypes, Node, Edge } from "@xyflow/react";
import React, { useCallback, useLayoutEffect } from "react";
import Dagre from "@dagrejs/dagre";

import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Position,
  ReactFlowProvider,
  Handle,
  useReactFlow,
} from "@xyflow/react";

import "./WorkflowVisualizer.css";

interface ToolNodeData {
  label: string;
  filePath: string;
}

const ToolNode = ({ data }: { data: ToolNodeData }) => {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div className="tool-node">
        <div className="tool-name">{data.label}</div>
        <div className="tool-path">{data.filePath}</div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

interface AgentNodeData {
  label: string;
  systemPrompt: string;
}

const AgentNode = ({ data }: { data: AgentNodeData }) => {
  return (
    <>
      <Handle type="target" position={Position.Top} />
      <div className="group-header">
        <strong>{data.label}</strong>
      </div>
      <div className="system-prompt">{data.systemPrompt}</div>
      <Handle type="source" position={Position.Bottom} />
    </>
  );
};

const nodeTypes: NodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
};

interface WorkflowData {
  strands_agent_import_aliases: string[];
  import_aliases: Record<string, string>;
  agent_instances: AgentInstance[];
}

interface AgentInstance {
  system_prompt: string;
  agent_name?: string;
  tools: Tool[];
}

interface Tool {
  tool_name: string;
  file_path: string;
  strands_agent_import_aliases: string[];
  import_aliases: Record<string, string>;
  agent_instances: AgentInstance[];
}

interface WorkflowVisualizerProps {
  data: WorkflowData;
}

const getLayoutedElements = (data: WorkflowData, direction: string) => {
  const dagreGraph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeIdCounter = 0;

  const generateId = () => `node_${nodeIdCounter++}`;

  const processAgentInstance = (agent: AgentInstance, level = 0): string => {
    const agentId = generateId();

    // Create agent node
    const agentNode = {
      id: agentId,
      type: "agent",
      position: { x: 0, y: 0 },
      data: {
        label: agent.agent_name,
        systemPrompt: agent.system_prompt,
      },
      style: {
        background: "#e1f5fe",
        border: "2px solid #0277bd",
        borderRadius: "8px",
        padding: "10px",
        minWidth: "250px",
      },
    };

    nodes.push(agentNode);
    dagreGraph.setNode(agentId, { width: 250, height: 150 });

    // Process tools for this agent
    agent.tools?.forEach((tool) => {
      const toolId = generateId();

      const toolNode = {
        id: toolId,
        type: "tool",
        position: { x: 0, y: 0 },
        data: {
          label: tool.tool_name,
          filePath: tool.file_path,
        },
        style: {
          background: "#fff3e0",
          border: "1px solid #f57c00",
          borderRadius: "4px",
          padding: "8px",
          minWidth: "200px",
        },
      };

      nodes.push(toolNode);
      dagreGraph.setNode(toolId, { width: 200, height: 80 });

      // Connect agent to tool
      const agentToolEdge = {
        id: `${agentId}-${toolId}`,
        source: agentId,
        target: toolId,
        type: "default",
        style: { stroke: "#666" },
      };

      edges.push(agentToolEdge);
      dagreGraph.setEdge(agentId, toolId);

      // Process nested agents
      for (const nestedAgent of tool.agent_instances) {
        const nestedAgentId = processAgentInstance(nestedAgent, level + 1);

        // Connect tool to nested agent
        const toolAgentEdge = {
          id: `${toolId}-${nestedAgentId}`,
          source: toolId,
          target: nestedAgentId,
          type: "default",
          style: { stroke: "#999", strokeDasharray: "5,5" },
        };

        edges.push(toolAgentEdge);
        dagreGraph.setEdge(toolId, nestedAgentId);
      }
    });

    return agentId;
  };

  processAgentInstance(data.agent_instances[0], 0);

  // Apply dagre layout
  Dagre.layout(dagreGraph);

  // Update node positions based on dagre layout
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,

      position: {
        x: nodeWithPosition.x - (nodeWithPosition.width || 200) / 2,
        y: nodeWithPosition.y - (nodeWithPosition.height || 80) / 2,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges: edges,
  };
};

export const WorkflowVisualizer: React.FC<WorkflowVisualizerProps> = ({
  data,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } =
        getLayoutedElements(data, direction);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      fitView();
    },
    [data, fitView, setEdges, setNodes]
  );

  useLayoutEffect(() => {
    onLayout("TB");
  }, [onLayout]);

  return (
    <div className="w-full h-[600px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        colorMode="dark"
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};

export const WorkflowVisualizerWrapper: React.FC<WorkflowVisualizerProps> = (
  props
) => (
  <ReactFlowProvider>
    <WorkflowVisualizer {...props} />
  </ReactFlowProvider>
);
