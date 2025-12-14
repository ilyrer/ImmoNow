/**
 * AVM Premium Wizard - Glassmorphismus Design
 * 4-Step wizard für professionelle Immobilienbewertung
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Sparkles, MapPin, Home, Award, BarChart3, CheckCircle } from 'lucide-react';
import { AvmRequest, AvmResponseData, GeoLocation, POI, ValidationResult } from '../../../types/avm';
import { avmService } from '../../../services/avm';
import Step1Location from './Step1Location';
import Step2ObjectData from './Step2ObjectData';
import Step3Quality from './Step3Quality';
import Step4Result from './Step4Result';

interface AVMWizardState {
  currentStep: 1 | 2 | 3 | 4;
  formData: Partial<AvmRequest>;
  geoData: GeoLocation | null;
  nearbyPois: POI[];
  validationErrors: Record<string, string>;
  result: AvmResponseData | null;
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
}

const AVMWizard: React.FC = () => {
  const [state, setState] = useState<AVMWizardState>({
    currentStep: 1,
    formData: {
      city: 'München',
      postal_code: '',
      property_type: 'apartment', // Backend erwartet snake_case!
      livingArea: 85,
      rooms: 3,
      condition: 'good',
      parkingSpaces: 0,
      hasElevator: false,
      fittedKitchen: false,
      barrierFree: false,
      monumentProtected: false,
      isRented: false,
    },
    geoData: null,
    nearbyPois: [],
    validationErrors: {},
    result: null,
    isLoading: false,
    loadingProgress: 0,
    loadingMessage: '',
  });

  const updateFormData = (updates: Partial<AvmRequest>) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, ...updates }
    }));
  };

  const updateGeoData = (geoData: GeoLocation | null, pois: POI[] = []) => {
    setState(prev => ({ ...prev, geoData, nearbyPois: pois }));
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const { currentStep, formData } = state;
    const errors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.address) errors.address = 'Adresse ist erforderlich';
      if (!formData.city) errors.city = 'Stadt ist erforderlich';
      if (!formData.postal_code) errors.postal_code = 'PLZ ist erforderlich';
    }

    if (currentStep === 2) {
      if (!formData.livingArea || formData.livingArea < 5) {
        errors.livingArea = 'Wohnfläche muss mindestens 5m² sein';
      }
      if (formData.floor !== undefined && formData.totalFloors !== undefined) {
        if (formData.floor > formData.totalFloors) {
          errors.floor = 'Etage kann nicht höher als Gesamtetagen sein';
        }
      }
    }

    setState(prev => ({ ...prev, validationErrors: errors }));
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) return;

    if (state.currentStep === 3) {
      await handleValuation();
    } else {
      setState(prev => ({
        ...prev,
        currentStep: Math.min(4, prev.currentStep + 1) as 1 | 2 | 3 | 4
      }));
    }
  };

  const handlePrevious = () => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(1, prev.currentStep - 1) as 1 | 2 | 3 | 4
    }));
  };

  const handleValuation = async () => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      loadingProgress: 0,
      loadingMessage: 'Starte Bewertung...' 
    }));

    try {
      const progressSteps = [
        { progress: 10, message: 'Geocodierung...' },
        { progress: 30, message: 'Vergleichsobjekte laden...' },
        { progress: 60, message: 'Marktdaten analysieren...' },
        { progress: 80, message: 'KI-Bewertung...' },
        { progress: 95, message: 'Bericht erstellen...' }
      ];

      for (const step of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 400));
        setState(prev => ({
          ...prev,
          loadingProgress: step.progress,
          loadingMessage: step.message
        }));
      }

      const result = await avmService.valuate(state.formData as AvmRequest);

      setState(prev => ({
        ...prev,
        result,
        currentStep: 4,
        isLoading: false,
        loadingProgress: 100,
        loadingMessage: 'Bewertung abgeschlossen!'
      }));

    } catch (error) {
      console.error('Valuation error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        loadingProgress: 0,
        loadingMessage: ''
      }));
      alert('Bewertung fehlgeschlagen. Bitte versuchen Sie es erneut.');
    }
  };

  const handleNewValuation = () => {
    setState({
      currentStep: 1,
      formData: {
        city: 'München',
        postal_code: '',
        property_type: 'apartment',
        livingArea: 85,
        rooms: 3,
        condition: 'good',
        parkingSpaces: 0,
      },
      geoData: null,
      nearbyPois: [],
      validationErrors: {},
      result: null,
      isLoading: false,
      loadingProgress: 0,
      loadingMessage: '',
    });
  };

  const renderStep = () => {
    const { currentStep, formData, geoData, nearbyPois, validationErrors, result } = state;

    switch (currentStep) {
      case 1:
        return (
          <Step1Location
            formData={formData}
            geoData={geoData}
            nearbyPois={nearbyPois}
            validationErrors={validationErrors}
            onUpdate={updateFormData}
            onGeoDataUpdate={updateGeoData}
          />
        );
      case 2:
        return (
          <Step2ObjectData
            formData={formData}
            validationErrors={validationErrors}
            onUpdate={updateFormData}
          />
        );
      case 3:
        return (
          <Step3Quality
            formData={formData}
            validationErrors={validationErrors}
            onUpdate={updateFormData}
          />
        );
      case 4:
        return result ? (
          <Step4Result
            result={result}
            formData={formData as AvmRequest}
            onNewValuation={handleNewValuation}
          />
        ) : null;
      default:
        return null;
    }
  };

  const { currentStep, isLoading, loadingProgress, loadingMessage } = state;

  const steps = [
    { id: 1, label: 'Standort', Icon: MapPin },
    { id: 2, label: 'Objekt', Icon: Home },
    { id: 3, label: 'Qualität', Icon: Award },
    { id: 4, label: 'Ergebnis', Icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50/30 via-white to-accent-50/30 dark:from-dark-500 dark:via-dark-400 dark:to-dark-500 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - Glassmorphismus */}
        <div className="mb-6 backdrop-blur-xl bg-white/60 dark:bg-[#1C1C1E]/60 rounded-[24px] p-6 sm:p-8 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-apple-blue/20 to-primary-600/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-apple-blue" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1C1E] dark:text-white font-heading">
                AVM Premium Bewertung
              </h1>
              <p className="text-sm text-[#3A3A3C] dark:text-gray-400">
                Professionelle Immobilienbewertung in 4 Schritten
              </p>
            </div>
          </div>
        </div>

        {/* Stepper - Glassmorphismus */}
        <div className="mb-6 backdrop-blur-xl bg-white/60 dark:bg-[#1C1C1E]/60 rounded-[20px] p-4 sm:p-6 border border-white/20 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.Icon;
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`
                        w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center
                        transition-all duration-300 border-2
                        ${step.id === currentStep
                          ? 'bg-gradient-to-br from-apple-blue to-primary-600 text-white border-transparent shadow-apple-blue-glow scale-110'
                          : step.id < currentStep
                          ? 'bg-gradient-to-br from-apple-green to-accent-600 text-white border-transparent'
                          : 'bg-white/50 dark:bg-[#1C1C1E]/50 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600'
                        }
                      `}
                    >
                      {step.id < currentStep ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`text-xs font-medium transition-colors ${
                      step.id === currentStep 
                        ? 'text-apple-blue dark:text-apple-blue' 
                        : step.id < currentStep
                        ? 'text-apple-green dark:text-apple-green'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-all duration-300 ${
                      step.id < currentStep 
                        ? 'bg-gradient-to-r from-apple-green to-accent-500' 
                        : 'bg-gray-200/50 dark:bg-gray-700/50'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content - Glassmorphismus */}
        <div className="backdrop-blur-xl bg-white/60 dark:bg-[#1C1C1E]/60 rounded-[24px] p-6 sm:p-8 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)] mb-6">
          {renderStep()}
        </div>

        {/* Navigation - Glassmorphismus */}
        {currentStep < 4 && (
          <div className="sticky bottom-6 backdrop-blur-xl bg-white/80 dark:bg-[#1C1C1E]/80 rounded-[20px] p-4 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
            <div className="flex justify-between items-center gap-4">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1 || isLoading}
                className="
                  flex items-center px-6 py-3 rounded-[16px] font-medium transition-all duration-200
                  bg-white/80 dark:bg-[#1C1C1E]/80 text-[#1C1C1E] dark:text-white
                  border border-gray-200 dark:border-gray-700
                  hover:bg-white dark:hover:bg-[#1C1C1E] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Zurück</span>
              </button>

              <button
                onClick={handleNext}
                disabled={isLoading}
                className="
                  flex items-center px-8 py-3 rounded-[16px] font-semibold transition-all duration-200
                  bg-gradient-to-r from-apple-blue to-primary-600 text-white
                  hover:from-apple-blue/90 hover:to-primary-700 hover:shadow-apple-blue-glow
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    <span className="hidden sm:inline">{loadingMessage}</span>
                    <span className="sm:hidden">Lädt...</span>
                  </>
                ) : currentStep === 3 ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Jetzt bewerten
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Weiter</span>
                    <span className="sm:hidden">→</span>
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay - Glassmorphismus */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-white/90 dark:bg-[#1C1C1E]/90 rounded-[24px] p-8 max-w-md w-full border border-white/20 dark:border-white/10 shadow-[0_20px_64px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-4 mb-6">
                <Loader2 className="w-8 h-8 text-apple-blue animate-spin" />
                <h3 className="text-xl font-bold text-[#1C1C1E] dark:text-white font-heading">
                  Bewertung läuft...
                </h3>
              </div>
              <p className="text-[#3A3A3C] dark:text-gray-400 mb-4 font-medium">
                {loadingMessage}
              </p>
              <div className="relative w-full h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-apple-blue to-primary-600 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-right font-medium">
                {loadingProgress}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AVMWizard;
