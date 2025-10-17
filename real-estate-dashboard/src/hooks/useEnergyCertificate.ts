/**
 * Energy Certificate Hook
 * React hook for energy certificate management
 */

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { EnergyCertificateService, EnergyCertificateData, EnergyCertificateUpdateRequest } from '../services/energyCertificate';

export function useEnergyCertificate(propertyId: string) {
  const queryClient = useQueryClient();

  // Query for energy data
  const {
    data: energyData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['energy-certificate', propertyId],
    queryFn: () => EnergyCertificateService.getEnergyData(propertyId),
    enabled: !!propertyId,
  });

  // Mutation for updating energy data
  const updateMutation = useMutation({
    mutationFn: (data: EnergyCertificateUpdateRequest) =>
      EnergyCertificateService.updateEnergyData(propertyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['energy-certificate', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['properties', propertyId] });
      toast.success('Energiedaten erfolgreich gespeichert!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Speichern der Energiedaten');
    },
  });

  // Mutation for PDF generation
  const generatePDFMutation = useMutation({
    mutationFn: () => EnergyCertificateService.generatePDF(propertyId),
    onSuccess: (data) => {
      toast.success('PDF erfolgreich generiert!');
      // Optionally trigger download
      EnergyCertificateService.downloadPDFFile(propertyId, data.filename);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Generieren des PDFs');
    },
  });

  // Mutation for PDF download
  const downloadPDFMutation = useMutation({
    mutationFn: () => EnergyCertificateService.downloadPDFFile(propertyId),
    onSuccess: () => {
      toast.success('PDF wird heruntergeladen...');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Herunterladen des PDFs');
    },
  });

  return {
    energyData,
    isLoading,
    error,
    refetch,
    updateEnergyData: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    generatePDF: generatePDFMutation.mutate,
    isGeneratingPDF: generatePDFMutation.isPending,
    downloadPDF: downloadPDFMutation.mutate,
    isDownloadingPDF: downloadPDFMutation.isPending,
  };
}
