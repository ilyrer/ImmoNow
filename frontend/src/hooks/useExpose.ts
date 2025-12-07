/**
 * Exposé Hook
 * React hook for exposé management
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  ExposeService, 
  ExposeVersionData, 
  ExposeGenerateRequest, 
  ExposeSaveRequest 
} from '../services/expose';

export function useExpose(propertyId: string) {
  const queryClient = useQueryClient();

  // Query for exposé versions
  const {
    data: exposeData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['expose-versions', propertyId],
    queryFn: () => ExposeService.getExposeVersions(propertyId),
    enabled: !!propertyId,
  });

  // Mutation for generating exposé
  const generateMutation = useMutation({
    mutationFn: (request: ExposeGenerateRequest) =>
      ExposeService.generateExpose(propertyId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expose-versions', propertyId] });
      toast.success('Exposé erfolgreich generiert!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Generieren des Exposés');
    },
  });

  // Mutation for saving exposé
  const saveMutation = useMutation({
    mutationFn: (request: ExposeSaveRequest) =>
      ExposeService.saveExposeVersion(propertyId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expose-versions', propertyId] });
      toast.success('Exposé erfolgreich gespeichert!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Speichern des Exposés');
    },
  });

  // Mutation for deleting exposé
  const deleteMutation = useMutation({
    mutationFn: (versionId: string) =>
      ExposeService.deleteExposeVersion(propertyId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expose-versions', propertyId] });
      toast.success('Exposé-Version erfolgreich gelöscht!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Löschen der Exposé-Version');
    },
  });

  // Mutation for publishing exposé
  const publishMutation = useMutation({
    mutationFn: (versionId: string) =>
      ExposeService.publishExposeVersion(propertyId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expose-versions', propertyId] });
      toast.success('Exposé erfolgreich veröffentlicht!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Veröffentlichen des Exposés');
    },
  });

  // Mutation for PDF generation
  const generatePDFMutation = useMutation({
    mutationFn: (versionId: string) =>
      ExposeService.generatePDF(propertyId, { version_id: versionId }),
    onSuccess: (data) => {
      toast.success('PDF erfolgreich generiert!');
      // Optionally trigger download
      ExposeService.downloadPDFFile(propertyId, data.version_id || '', data.filename);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Generieren des PDFs');
    },
  });

  // Mutation for PDF download
  const downloadPDFMutation = useMutation({
    mutationFn: (versionId: string) =>
      ExposeService.downloadPDFFile(propertyId, versionId),
    onSuccess: () => {
      toast.success('PDF wird heruntergeladen...');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Herunterladen des PDFs');
    },
  });

  return {
    exposeData,
    isLoading,
    error,
    refetch,
    generateExpose: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    saveExpose: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    deleteExpose: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    publishExpose: publishMutation.mutate,
    isPublishing: publishMutation.isPending,
    generatePDF: generatePDFMutation.mutate,
    isGeneratingPDF: generatePDFMutation.isPending,
    downloadPDF: downloadPDFMutation.mutate,
    isDownloadingPDF: downloadPDFMutation.isPending,
  };
}
