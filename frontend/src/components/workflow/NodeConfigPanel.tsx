/**
 * Node Configuration Panel
 * n8n-Style Right Sidebar
 */
import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkflowStage } from '../../services/workflows';
import { cn } from '@/lib/utils';

interface NodeConfigPanelProps {
  node: Node;
  allNodes: Node[];
  onUpdate: (nodeId: string, updates: Partial<WorkflowStage>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  allNodes,
  onUpdate,
  onDelete,
  onClose,
}) => {
  const stage = node.data.stage as WorkflowStage;
  const nodeType = node.data.nodeType as string;

  const [name, setName] = useState(stage.name || '');
  const [type, setType] = useState(nodeType);
  const [statusMapping, setStatusMapping] = useState(stage.status_mapping || '');

  useEffect(() => {
    setName(stage.name || '');
    setType(nodeType);
    setStatusMapping(stage.status_mapping || '');
  }, [node, stage, nodeType]);

  const handleSave = () => {
    onUpdate(node.id, {
      name: name.trim(),
      is_terminal: type === 'end',
      status_mapping: statusMapping || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Möchten Sie die Stage "${name}" wirklich löschen?`)) {
      onDelete(node.id);
      onClose();
    }
  };

  const availableTypes = ['start', 'default', 'end'].filter((t) => {
    if (t === 'start' && nodeType !== 'start') {
      const hasStart = allNodes.some((n) => n.data.nodeType === 'start');
      return !hasStart;
    }
    return true;
  });

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-[#252525] border-l border-[#3a3a3a] z-20 flex flex-col shadow-2xl">
      {/* Header - n8n style */}
      <div className="px-4 py-3 border-b border-[#3a3a3a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
          <h3 className="text-sm font-semibold text-gray-200">Stage konfigurieren</h3>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2a2a2a] rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Stage Name */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Stage-Name
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Stage Name"
            className="h-9 bg-[#1e1e1e] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-[#6366f1]"
            autoFocus
          />
        </div>

        {/* Node Type */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Typ
          </Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-9 bg-[#1e1e1e] border-[#3a3a3a] text-white focus:border-[#6366f1]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#252525] border-[#3a3a3a]">
              {availableTypes.includes('start') && (
                <SelectItem value="start" className="text-white hover:bg-[#2a2a2a]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                    Start
                  </div>
                </SelectItem>
              )}
              <SelectItem value="default" className="text-white hover:bg-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#6366f1]" />
                  Normal
                </div>
              </SelectItem>
              <SelectItem value="end" className="text-white hover:bg-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ef4444]" />
                  Ende
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Mapping */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Status-Mapping
            <span className="text-gray-500 normal-case ml-1">(optional)</span>
          </Label>
          <Input
            value={statusMapping}
            onChange={(e) => setStatusMapping(e.target.value)}
            placeholder="z.B. todo, in_progress"
            className="h-9 bg-[#1e1e1e] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-[#6366f1]"
          />
          <p className="text-xs text-gray-500 leading-relaxed">
            Task-Status der dieser Stage zugeordnet werden soll
          </p>
        </div>
      </div>

      {/* Footer Actions - n8n style */}
      <div className="p-4 border-t border-[#3a3a3a] space-y-2 bg-[#1e1e1e]">
        <Button 
          onClick={handleSave} 
          className="w-full h-9 bg-[#6366f1] hover:bg-[#4f46e5] text-white border-0"
        >
          Speichern
        </Button>
        <Button
          variant="outline"
          onClick={handleDelete}
          className="w-full h-9 bg-transparent border-[#3a3a3a] text-red-400 hover:bg-red-950/20 hover:border-red-900/50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Löschen
        </Button>
      </div>
    </div>
  );
};
