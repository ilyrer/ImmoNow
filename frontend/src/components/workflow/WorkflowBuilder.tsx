/**
 * Workflow Builder Component (MVP)
 * Deklarativer Editor für Status-Workflows
 */
import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkflowStage, Workflow } from '../../services/workflows';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WorkflowBuilderProps {
  workflow?: Workflow;
  onSave: (workflow: { name: string; description?: string; stages: WorkflowStage[]; board_id?: string }) => void;
  onCancel?: () => void;
  boardId?: string;
}

type StageType = 'start' | 'normal' | 'end';

interface StageFormData {
  id: string;
  name: string;
  type: StageType;
  allowedTransitions: string[];
  order: number;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflow,
  onSave,
  onCancel,
  boardId,
}) => {
  const [name, setName] = useState(workflow?.name || '');
  const [description, setDescription] = useState(workflow?.description || '');
  const [stages, setStages] = useState<StageFormData[]>(
    workflow?.stages?.map((s, idx) => ({
      id: s.id || `stage_${idx}`,
      name: s.name,
      type: (s.is_terminal ? 'end' : (idx === 0 ? 'start' : 'normal')) as StageType,
      allowedTransitions: s.transitions || [],
      order: s.order ?? idx,
    })) || []
  );

  // Validierung
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    
    if (!name.trim()) {
      errors.push('Workflow-Name ist erforderlich');
    }
    
    if (stages.length === 0) {
      errors.push('Mindestens eine Stage ist erforderlich');
      return errors;
    }
    
    // Prüfe: Genau eine Start-Stage
    const startStages = stages.filter(s => s.type === 'start');
    if (startStages.length === 0) {
      errors.push('Genau eine Stage muss den Typ "Start" haben');
    } else if (startStages.length > 1) {
      errors.push('Nur eine Stage darf den Typ "Start" haben');
    }
    
    // Prüfe: Mindestens eine End-Stage
    const endStages = stages.filter(s => s.type === 'end');
    if (endStages.length === 0) {
      errors.push('Mindestens eine Stage muss den Typ "End" haben');
    }
    
    // Prüfe: End-Stages haben keine Transitions
    const endStagesWithTransitions = endStages.filter(s => s.allowedTransitions.length > 0);
    if (endStagesWithTransitions.length > 0) {
      errors.push('End-Stages dürfen keine erlaubten Übergänge haben');
    }
    
    // Prüfe: Keine Selbst-Transitions
    const selfTransitions = stages.filter(s => s.allowedTransitions.includes(s.id));
    if (selfTransitions.length > 0) {
      errors.push('Stages dürfen nicht zu sich selbst transitionieren');
    }
    
    // Prüfe: Stage-Namen müssen eindeutig sein
    const stageNames = stages.map(s => s.name.trim().toLowerCase());
    const uniqueNames = new Set(stageNames);
    if (stageNames.length !== uniqueNames.size) {
      errors.push('Stage-Namen müssen eindeutig sein');
    }
    
    // Prüfe: Alle Transitions müssen auf existierende Stages verweisen
    const stageIds = new Set(stages.map(s => s.id));
    for (const stage of stages) {
      for (const transitionId of stage.allowedTransitions) {
        if (!stageIds.has(transitionId)) {
          errors.push(`Stage "${stage.name}" verweist auf nicht existierende Stage`);
          break;
        }
      }
    }
    
    return errors;
  }, [name, stages]);

  const isValid = validationErrors.length === 0;

  const handleAddStage = () => {
    const newStage: StageFormData = {
      id: `stage_${Date.now()}`,
      name: '',
      type: 'normal',
      allowedTransitions: [],
      order: stages.length,
    };
    setStages([...stages, newStage]);
  };

  const handleUpdateStage = (stageId: string, updates: Partial<StageFormData>) => {
    setStages(stages.map(stage => {
      if (stage.id === stageId) {
        const updated = { ...stage, ...updates };
        
        // Wenn Type zu "end" geändert wird, entferne alle Transitions
        if (updates.type === 'end') {
          updated.allowedTransitions = [];
        }
        
        return updated;
      }
      return stage;
    }));
  };

  const handleDeleteStage = (stageId: string) => {
    const updatedStages = stages
      .filter(s => s.id !== stageId)
      .map((s, idx) => ({ ...s, order: idx }))
      .map(s => ({
        ...s,
        allowedTransitions: s.allowedTransitions.filter(t => t !== stageId),
      }));
    setStages(updatedStages);
  };

  const handleMoveStage = (stageId: string, direction: 'up' | 'down') => {
    const index = stages.findIndex(s => s.id === stageId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;
    
    const newStages = [...stages];
    [newStages[index], newStages[newIndex]] = [newStages[newIndex], newStages[index]];
    
    // Update order
    newStages.forEach((s, idx) => {
      s.order = idx;
    });
    
    setStages(newStages);
  };

  const handleToggleTransition = (fromStageId: string, toStageId: string) => {
    setStages(stages.map(stage => {
      if (stage.id === fromStageId) {
        const transitions = stage.allowedTransitions.includes(toStageId)
          ? stage.allowedTransitions.filter(t => t !== toStageId)
          : [...stage.allowedTransitions, toStageId];
        return { ...stage, allowedTransitions: transitions };
      }
      return stage;
    }));
  };

  const handleSaveWorkflow = () => {
    if (!isValid) {
      return;
    }

    // Konvertiere zu WorkflowStage-Format
    const workflowStages: WorkflowStage[] = stages.map((stage, idx) => ({
      id: stage.id,
      name: stage.name,
      order: idx,
      transitions: stage.allowedTransitions,
      is_terminal: stage.type === 'end',
      status_mapping: undefined, // Optional im MVP
    }));

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      stages: workflowStages,
      board_id: boardId,
    });
  };

  const availableTargetStages = useCallback((currentStageId: string, currentType: StageType) => {
    // End-Stages können keine Transitions haben
    if (currentType === 'end') {
      return [];
    }
    
    // Filtere: keine Selbst-Transition, keine End-Stages als Ziel
    return stages.filter(s => 
      s.id !== currentStageId && 
      s.type !== 'end'
    );
  }, [stages]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {workflow ? 'Workflow bearbeiten' : 'Neuer Workflow'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Definieren Sie Stages und erlaubte Übergänge
            </p>
          </div>
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Abbrechen
              </Button>
            )}
            <Button onClick={handleSaveWorkflow} disabled={!isValid}>
              <Save className="w-4 h-4 mr-2" />
              Speichern
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Validierungsfehler */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  {validationErrors.map((error, idx) => (
                    <div key={idx}>{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Workflow Info */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow-Informationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workflow-name">Name *</Label>
                <Input
                  id="workflow-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Property Onboarding"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="workflow-description">Beschreibung</Label>
                <Textarea
                  id="workflow-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibung des Workflows..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Stages</CardTitle>
                <Button onClick={handleAddStage} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Stage hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stages.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p>Noch keine Stages definiert.</p>
                  <p className="text-sm mt-2">Klicken Sie auf "Stage hinzufügen" um zu beginnen.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stages.map((stage, index) => (
                    <StageCard
                      key={stage.id}
                      stage={stage}
                      index={index}
                      allStages={stages}
                      onUpdate={(updates) => handleUpdateStage(stage.id, updates)}
                      onDelete={() => handleDeleteStage(stage.id)}
                      onMoveUp={() => handleMoveStage(stage.id, 'up')}
                      onMoveDown={() => handleMoveStage(stage.id, 'down')}
                      onToggleTransition={(toStageId) => handleToggleTransition(stage.id, toStageId)}
                      availableTargetStages={availableTargetStages(stage.id, stage.type)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface StageCardProps {
  stage: StageFormData;
  index: number;
  allStages: StageFormData[];
  onUpdate: (updates: Partial<StageFormData>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleTransition: (toStageId: string) => void;
  availableTargetStages: StageFormData[];
}

const StageCard: React.FC<StageCardProps> = ({
  stage,
  index,
  allStages,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleTransition,
  availableTargetStages,
}) => {
  const typeBadgeColor = {
    start: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    normal: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    end: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <Badge className={typeBadgeColor[stage.type]}>
              {stage.type === 'start' ? 'Start' : stage.type === 'end' ? 'End' : 'Normal'}
            </Badge>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              disabled={index === 0}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              disabled={index === allStages.length - 1}
            >
              <ChevronDown className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stage Name */}
        <div>
          <Label htmlFor={`stage-name-${stage.id}`}>Stage-Name *</Label>
          <Input
            id={`stage-name-${stage.id}`}
            value={stage.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="z.B. Intake, Review, Approved"
            className="mt-1"
          />
        </div>

        {/* Stage Type */}
        <div>
          <Label htmlFor={`stage-type-${stage.id}`}>Stage-Typ *</Label>
          <Select
            value={stage.type}
            onValueChange={(value: StageType) => onUpdate({ type: value })}
          >
            <SelectTrigger className="mt-1" id={`stage-type-${stage.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start">Start</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="end">End</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Erlaubte Übergänge */}
        {stage.type !== 'end' && (
          <div>
            <Label>Erlaubte Übergänge</Label>
            <div className="mt-2 space-y-2 border rounded-lg p-3 bg-gray-50 dark:bg-gray-900">
              {availableTargetStages.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Keine anderen Stages verfügbar
                </p>
              ) : (
                availableTargetStages.map((targetStage) => (
                  <div key={targetStage.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`transition-${stage.id}-${targetStage.id}`}
                      checked={stage.allowedTransitions.includes(targetStage.id)}
                      onChange={() => onToggleTransition(targetStage.id)}
                      className="rounded"
                    />
                    <Label
                      htmlFor={`transition-${stage.id}-${targetStage.id}`}
                      className="font-normal cursor-pointer flex-1"
                    >
                      {targetStage.name || `Stage ${targetStage.id}`}
                    </Label>
                    <Badge variant="outline" className="text-xs">
                      {targetStage.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
            {stage.allowedTransitions.length > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {stage.allowedTransitions.length} Übergang{stage.allowedTransitions.length !== 1 ? 'e' : ''} ausgewählt
              </p>
            )}
          </div>
        )}

        {stage.type === 'end' && (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
            End-Stages haben keine erlaubten Übergänge.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
