/**
 * Workflow Builder Page
 */
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit2, Play, Settings } from 'lucide-react';
import { VisualWorkflowBuilder } from '../components/workflow/VisualWorkflowBuilder';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useWorkflows,
  useWorkflow,
  useCreateWorkflow,
  useUpdateWorkflow,
  useDeleteWorkflow,
} from '../hooks/useWorkflows';
import { WorkflowStage } from '../services/workflows';
import toast from 'react-hot-toast';

export const WorkflowBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showBuilder, setShowBuilder] = useState(!id);

  const { data: workflows, isLoading } = useWorkflows();
  const { data: workflow, isLoading: isLoadingWorkflow } = useWorkflow(id || '');
  const createMutation = useCreateWorkflow();
  const updateMutation = useUpdateWorkflow();
  const deleteMutation = useDeleteWorkflow();

  const handleSave = async (workflowData: {
    name: string;
    description?: string;
    stages: WorkflowStage[];
    board_id?: string;
  }) => {
    try {
      if (id) {
        await updateMutation.mutateAsync({
          id,
          payload: workflowData,
        });
        toast.success('Workflow aktualisiert');
      } else {
        await createMutation.mutateAsync(workflowData);
        toast.success('Workflow erstellt');
        navigate('/workflows');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Fehler beim Speichern');
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!confirm('Möchten Sie diesen Workflow wirklich löschen?')) return;

    try {
      await deleteMutation.mutateAsync(workflowId);
      toast.success('Workflow gelöscht');
      navigate('/workflows');
    } catch (error: any) {
      toast.error(error?.message || 'Fehler beim Löschen');
    }
  };

  if (showBuilder) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
        <VisualWorkflowBuilder
          workflow={workflow}
          onSave={handleSave}
          onCancel={() => {
            if (id) {
              setShowBuilder(false);
            } else {
              navigate('/workflows');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workflows')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Workflows
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Verwalten Sie Ihre Workflow-Definitionen
              </p>
            </div>
          </div>
          <Button onClick={() => setShowBuilder(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neuer Workflow
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : workflows && workflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workflows.map((wf) => (
                <Card key={wf.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{wf.name}</CardTitle>
                        {wf.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {wf.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigate(`/workflows/${wf.id}`);
                            setShowBuilder(true);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(wf.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{wf.stages.length}</span> Stages
                      </div>
                      {wf.board_id && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Verknüpft mit Board
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-3">
                        {wf.is_active ? (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                            Aktiv
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 text-xs rounded">
                            Inaktiv
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Noch keine Workflows erstellt.
              </p>
              <Button onClick={() => setShowBuilder(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ersten Workflow erstellen
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowBuilderPage;

