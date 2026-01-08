/**
 * Visual Workflow Builder (n8n-style)
 * Exaktes n8n-Design-Implementation
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { WorkflowStage, Workflow } from '../../services/workflows';
import { WorkflowNode } from './WorkflowNode';
import { NodeConfigPanel } from './NodeConfigPanel';
import { cn } from '@/lib/utils';

interface VisualWorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: {
    name: string;
    description?: string;
    stages: WorkflowStage[];
    board_id?: string;
  }) => void;
  onCancel?: () => void;
  boardId?: string;
}

const getInitialPosition = (index: number) => {
  return { x: 400 + (index % 2) * 350, y: 300 + Math.floor(index / 2) * 200 };
};

const stagesToNodes = (stages: WorkflowStage[]): Node[] => {
  return stages.map((stage, index) => {
    const nodeType = index === 0 ? 'start' : stage.is_terminal ? 'end' : 'default';
    
    return {
      id: stage.id,
      type: 'workflowNode',
      position: getInitialPosition(index),
      data: {
        label: stage.name,
        stage: stage,
        nodeType: nodeType,
      },
    };
  });
};

const stagesToEdges = (stages: WorkflowStage[]): Edge[] => {
  const edges: Edge[] = [];
  
  stages.forEach((stage) => {
    stage.transitions.forEach((targetId) => {
      edges.push({
        id: `e${stage.id}-${targetId}`,
        source: stage.id,
        target: targetId,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6366f1',
        },
      });
    });
  });
  
  return edges;
};

export const VisualWorkflowBuilder: React.FC<VisualWorkflowBuilderProps> = ({
  workflow,
  onSave,
  onCancel,
  boardId,
}) => {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const initialNodes = useMemo(
    () => (workflow?.stages ? stagesToNodes(workflow.stages) : []),
    [workflow]
  );
  const initialEdges = useMemo(
    () => (workflow?.stages ? stagesToEdges(workflow.stages) : []),
    [workflow]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      workflowNode: WorkflowNode,
    }),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return;
      
      const existingEdge = edges.find(
        (e) => e.source === params.source && e.target === params.target
      );
      if (existingEdge) return;

      setEdges((eds) => addEdge({
        ...params,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#6366f1',
        },
      }, eds));
    },
    [edges, setEdges]
  );

  const handleAddNode = useCallback(() => {
    const newId = `stage_${Date.now()}`;
    const newIndex = nodes.length;
    
    const newNode: Node = {
      id: newId,
      type: 'workflowNode',
      position: getInitialPosition(newIndex),
      data: {
        label: `Stage ${newIndex + 1}`,
        stage: {
          id: newId,
          name: `Stage ${newIndex + 1}`,
          order: newIndex,
          transitions: [],
          is_terminal: false,
        },
        nodeType: newIndex === 0 ? 'start' : 'default',
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
    setShowConfigPanel(true);
  }, [nodes.length, setNodes]);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      
      setNodes((nds) =>
        nds.map((node) => {
          const stage = node.data.stage as WorkflowStage;
          return {
            ...node,
            data: {
              ...node.data,
              stage: {
                ...stage,
                transitions: stage.transitions.filter((t) => t !== nodeId),
              },
            },
          };
        })
      );
      
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
        setShowConfigPanel(false);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setShowConfigPanel(true);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<WorkflowStage>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const currentStage = node.data.stage as WorkflowStage;
            const updatedStage = { ...currentStage, ...updates };
            const nodeType = updates.is_terminal ? 'end' : (nodeId === nodes[0]?.id ? 'start' : 'default');
            
            return {
              ...node,
              data: {
                ...node.data,
                label: updatedStage.name,
                stage: updatedStage,
                nodeType: nodeType,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes, nodes]
  );

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    if (!name.trim()) {
      errors.push('Workflow-Name ist erforderlich');
    }
    
    if (nodes.length === 0) {
      errors.push('Mindestens eine Stage ist erforderlich');
      return errors;
    }
    
    const startNodes = nodes.filter((n) => n.data.nodeType === 'start');
    if (startNodes.length === 0) {
      errors.push('Genau eine Stage muss den Typ "Start" haben');
    } else if (startNodes.length > 1) {
      errors.push('Nur eine Stage darf den Typ "Start" haben');
    }
    
    const endNodes = nodes.filter((n) => n.data.nodeType === 'end');
    if (endNodes.length === 0) {
      errors.push('Mindestens eine Stage muss den Typ "End" haben');
    }
    
    const stageNames = nodes.map((n) => {
      const stage = n.data.stage as WorkflowStage;
      return stage.name.trim().toLowerCase();
    });
    const uniqueNames = new Set(stageNames);
    if (stageNames.length !== uniqueNames.size) {
      errors.push('Stage-Namen müssen eindeutig sein');
    }
    
    return errors;
  }, [name, nodes]);

  const isValid = validationErrors.length === 0;

  const handleSaveWorkflow = useCallback(() => {
    if (!isValid) return;

    const workflowStages: WorkflowStage[] = nodes.map((node, index) => {
      const stage = node.data.stage as WorkflowStage;
      const nodeType = node.data.nodeType as string;
      
      const transitions = edges
        .filter((e) => e.source === node.id)
        .map((e) => e.target);
      
      return {
        id: stage?.id || node.id,
        name: stage?.name || node.data.label || `Stage ${index + 1}`,
        order: index,
        transitions: transitions,
        is_terminal: nodeType === 'end',
        status_mapping: stage?.status_mapping,
      };
    });

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      stages: workflowStages,
      board_id: boardId,
    });
  }, [isValid, nodes, edges, name, description, boardId, onSave]);

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Top Bar - n8n Style */}
      <div className="h-14 bg-[#252525] border-b border-[#3a3a3a] flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4 flex-1">
          {onCancel && (
            <Button 
              variant="ghost" 
              onClick={onCancel}
              className="h-8 px-3 text-gray-300 hover:text-white hover:bg-[#2a2a2a] border-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workflow Name"
            className="h-8 bg-[#1e1e1e] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-[#6366f1] w-64"
          />
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{validationErrors.length} Fehler</span>
            </div>
          )}
        </div>
        <Button 
          onClick={handleSaveWorkflow} 
          disabled={!isValid}
          className="h-8 px-4 bg-[#6366f1] hover:bg-[#4f46e5] text-white border-0"
        >
          <Save className="w-4 h-4 mr-2" />
          Speichern
        </Button>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-950/50 border-b border-red-900/50 px-4 py-2">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-red-400">
            {validationErrors.map((error, idx) => (
              <span key={idx}>• {error}</span>
            ))}
          </div>
        </div>
      )}

      {/* React Flow Canvas - n8n Style Dark */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-[#1e1e1e]"
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <Background 
            color="#2a2a2a" 
            gap={20}
            size={1}
            variant="dots"
          />
          <Controls 
            className="bg-[#252525] border border-[#3a3a3a] [&_button]:bg-[#2a2a2a] [&_button]:border-[#3a3a3a] [&_button]:text-gray-300 hover:[&_button]:bg-[#2f2f2f]"
            showInteractive={false}
          />
          <MiniMap 
            className="bg-[#252525] border border-[#3a3a3a]"
            nodeColor={(node) => {
              const type = node.data?.nodeType;
              if (type === 'start') return '#10b981';
              if (type === 'end') return '#ef4444';
              return '#6366f1';
            }}
            maskColor="rgba(0, 0, 0, 0.5)"
          />
          
          {/* Add Node Button - n8n Style */}
          <Panel position="top-left" className="m-4">
            <Button 
              onClick={handleAddNode} 
              className="h-9 px-4 bg-[#6366f1] hover:bg-[#4f46e5] text-white border-0 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Stage hinzufügen
            </Button>
          </Panel>
        </ReactFlow>

        {/* Node Configuration Panel - Right Sidebar */}
        {showConfigPanel && selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            allNodes={nodes}
            onUpdate={handleNodeUpdate}
            onDelete={handleDeleteNode}
            onClose={() => {
              setShowConfigPanel(false);
              setSelectedNode(null);
            }}
          />
        )}

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-6xl mb-4 opacity-20">⚡</div>
              <h3 className="text-xl font-medium text-gray-400 mb-2">
                Workflow erstellen
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Klicken Sie auf "Stage hinzufügen" um zu beginnen
              </p>
              <Button 
                onClick={handleAddNode}
                className="pointer-events-auto bg-[#6366f1] hover:bg-[#4f46e5] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Erste Stage hinzufügen
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
