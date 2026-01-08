/**
 * Workflow Node Component
 * n8n-Style Node Design
 */
import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { Play, Circle, Square } from 'lucide-react';

interface WorkflowNodeData {
  label: string;
  stage: {
    id: string;
    name: string;
    order: number;
    transitions: string[];
    is_terminal: boolean;
  };
  nodeType: 'start' | 'default' | 'end';
}

export const WorkflowNode: React.FC<NodeProps<WorkflowNodeData>> = ({ data, selected }) => {
  const { label, nodeType } = data;
  
  // n8n-style node colors
  const getNodeConfig = () => {
    if (nodeType === 'start') {
      return {
        bg: 'bg-[#10b981]',
        border: 'border-[#10b981]',
        icon: Play,
        iconColor: 'text-white',
      };
    }
    if (nodeType === 'end') {
      return {
        bg: 'bg-[#ef4444]',
        border: 'border-[#ef4444]',
        icon: Square,
        iconColor: 'text-white',
      };
    }
    return {
      bg: 'bg-white',
      border: 'border-[#d1d5db]',
      icon: Circle,
      iconColor: 'text-[#6366f1]',
    };
  };

  const config = getNodeConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'group relative rounded-lg border-2 shadow-lg transition-all',
        config.bg,
        config.border,
        selected && 'ring-2 ring-[#6366f1] ring-offset-2 ring-offset-[#1e1e1e]',
        nodeType === 'default' && 'min-w-[200px]',
        nodeType !== 'default' && 'min-w-[180px]'
      )}
    >
      {/* Input Handle - n8n style */}
      {nodeType !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-4 !h-4 !bg-white !border-2 !border-[#6366f1] !-top-2"
        />
      )}

      {/* Node Content - n8n style */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-3',
        nodeType === 'default' ? 'bg-white text-gray-900' : 'text-white'
      )}>
        {/* Icon */}
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded flex items-center justify-center',
          nodeType === 'default' 
            ? 'bg-[#f3f4f6]' 
            : 'bg-white/20'
        )}>
          <Icon className={cn('w-5 h-5', config.iconColor)} />
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className={cn(
            'font-semibold text-sm truncate',
            nodeType === 'default' ? 'text-gray-900' : 'text-white'
          )}>
            {label}
          </div>
          {nodeType !== 'default' && (
            <div className="text-xs opacity-80 mt-0.5">
              {nodeType === 'start' ? 'Start' : 'Ende'}
            </div>
          )}
        </div>
      </div>

      {/* Output Handle - n8n style */}
      {nodeType !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-4 !h-4 !bg-white !border-2 !border-[#6366f1] !-bottom-2"
        />
      )}
    </div>
  );
};
