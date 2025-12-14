/**
 * Custom React Hook for Financing Calculator
 * Manages state, calculations, and scenario management
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { FinancingParameters, FinancingResult, FinancingScenario, ValidationError } from '../types/finance';
import { calculateFinancing, validateFinancingParameters } from '../lib/finance/calculations';
import { saveScenario, loadScenarios, deleteScenario, duplicateScenario } from '../lib/finance/scenarios';

export interface UseFinancingCalculatorOptions {
    autoCalculate?: boolean;
    validateOnChange?: boolean;
}

export interface UseFinancingCalculatorReturn {
    // State
    parameters: FinancingParameters;
    result: FinancingResult | null;
    validationErrors: ValidationError[];
    isCalculating: boolean;

    // Actions
    setParameters: (params: FinancingParameters) => void;
    updateParameter: <K extends keyof FinancingParameters>(key: K, value: FinancingParameters[K]) => void;
    calculate: () => void;
    reset: () => void;

    // Scenario management
    currentScenario: FinancingScenario | null;
    scenarios: FinancingScenario[];
    saveCurrentScenario: (name: string, description: string) => FinancingScenario | null;
    loadScenario: (id: string) => void;
    deleteScenarioById: (id: string) => boolean;
    duplicateScenarioById: (id: string, newName?: string) => FinancingScenario | null;
    refreshScenarios: () => void;

    // Validation
    hasErrors: boolean;
    hasWarnings: boolean;
    validate: () => ValidationError[];
}

const DEFAULT_PARAMETERS: FinancingParameters = {
    propertyPrice: 500000,
    equity: 100000,
    interestRate: 3.45,
    loanTerm: 25,
    fixedRatePeriod: 15,
    additionalCosts: 35000,
    includeInsurance: true,
    insuranceRate: 0.18,
    includeRepayment: false,
    repaymentAmount: 0,
    maintenanceRate: 1.2,
    specialRepayments: [],
    fees: {
        processingFee: 0,
        appraisalFee: 500,
        brokerFee: 0
    }
};

/**
 * Main financing calculator hook
 */
export function useFinancingCalculator(
    initialParameters?: Partial<FinancingParameters>,
    options: UseFinancingCalculatorOptions = {}
): UseFinancingCalculatorReturn {
    const { autoCalculate = true, validateOnChange = true } = options;

    // State
    const [parameters, setParametersState] = useState<FinancingParameters>({
        ...DEFAULT_PARAMETERS,
        ...initialParameters
    });

    const [result, setResult] = useState<FinancingResult | null>(null);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [isCalculating, setIsCalculating] = useState(false);
    const [currentScenario, setCurrentScenario] = useState<FinancingScenario | null>(null);
    const [scenarios, setScenarios] = useState<FinancingScenario[]>([]);

    // Load scenarios on mount
    useEffect(() => {
        setScenarios(loadScenarios());
    }, []);

    // Validation
    const validate = useCallback((): ValidationError[] => {
        const errors = validateFinancingParameters(parameters);
        setValidationErrors(errors);
        return errors;
    }, [parameters]);

    // Calculate financing
    const calculate = useCallback(() => {
        setIsCalculating(true);

        try {
            const errors = validate();
            const hasBlockingErrors = errors.some(e => e.severity === 'error');

            if (hasBlockingErrors) {
                console.warn('Calculation blocked due to validation errors:', errors);
                setResult(null);
                return;
            }

            const calculatedResult = calculateFinancing(parameters);
            setResult(calculatedResult);
        } catch (error) {
            console.error('Calculation error:', error);
            setResult(null);
        } finally {
            setIsCalculating(false);
        }
    }, [parameters, validate]);

    // Auto-calculate on parameter change
    useEffect(() => {
        if (autoCalculate) {
            const timer = setTimeout(() => {
                console.log('Auto-calculating with parameters:', parameters);
                calculate();
            }, 300); // Debounce

            return () => clearTimeout(timer);
        }
    }, [autoCalculate, calculate]);

    // Initial calculation on mount
    useEffect(() => {
        if (autoCalculate) {
            console.log('Initial calculation on mount');
            calculate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    // Validate on parameter change
    useEffect(() => {
        if (validateOnChange) {
            validate();
        }
    }, [parameters, validateOnChange, validate]);

    // Set parameters
    const setParameters = useCallback((newParams: FinancingParameters) => {
        setParametersState(newParams);
        setCurrentScenario(null); // Clear current scenario when parameters change
    }, []);

    // Update single parameter
    const updateParameter = useCallback(<K extends keyof FinancingParameters>(
        key: K,
        value: FinancingParameters[K]
    ) => {
        setParametersState(prev => ({ ...prev, [key]: value }));
        setCurrentScenario(null);
    }, []);

    // Reset to defaults
    const reset = useCallback(() => {
        setParametersState(DEFAULT_PARAMETERS);
        setResult(null);
        setValidationErrors([]);
        setCurrentScenario(null);
    }, []);

    // Save current scenario
    const saveCurrentScenario = useCallback((name: string, description: string): FinancingScenario | null => {
        if (!result) return null;

        try {
            const scenario = saveScenario(name, description, parameters, result);
            setCurrentScenario(scenario);
            setScenarios(loadScenarios()); // Refresh list
            return scenario;
        } catch (error) {
            console.error('Failed to save scenario:', error);
            return null;
        }
    }, [parameters, result]);

    // Load scenario
    const loadScenario = useCallback((id: string) => {
        const allScenarios = loadScenarios();
        const scenario = allScenarios.find(s => s.id === id);

        if (scenario) {
            setParametersState(scenario.parameters);
            setResult(scenario.result);
            setCurrentScenario(scenario);
        }
    }, []);

    // Delete scenario
    const deleteScenarioById = useCallback((id: string): boolean => {
        const success = deleteScenario(id);
        if (success) {
            if (currentScenario?.id === id) {
                setCurrentScenario(null);
            }
            setScenarios(loadScenarios());
        }
        return success;
    }, [currentScenario]);

    // Duplicate scenario
    const duplicateScenarioById = useCallback((id: string, newName?: string): FinancingScenario | null => {
        const duplicated = duplicateScenario(id, newName);
        if (duplicated) {
            setScenarios(loadScenarios());
        }
        return duplicated;
    }, []);

    // Refresh scenarios
    const refreshScenarios = useCallback(() => {
        setScenarios(loadScenarios());
    }, []);

    // Computed
    const hasErrors = useMemo(() =>
        validationErrors.some(e => e.severity === 'error'),
        [validationErrors]
    );

    const hasWarnings = useMemo(() =>
        validationErrors.some(e => e.severity === 'warning'),
        [validationErrors]
    );

    return {
        // State
        parameters,
        result,
        validationErrors,
        isCalculating,

        // Actions
        setParameters,
        updateParameter,
        calculate,
        reset,

        // Scenario management
        currentScenario,
        scenarios,
        saveCurrentScenario,
        loadScenario,
        deleteScenarioById,
        duplicateScenarioById,
        refreshScenarios,

        // Validation
        hasErrors,
        hasWarnings,
        validate
    };
}

/**
 * Hook for investment analysis
 */
export function useInvestmentAnalysis(
    result: FinancingResult | null,
    monthlyRent: number,
    vacancyRate: number
) {
    return useMemo(() => {
        // Use result if available, otherwise use default values for demonstration
        const loanAmount = result?.loanAmount || 400000;
        const monthlyPayment = result?.monthlyPayment || 2000;
        const propertyPrice = result ? (loanAmount / (1 - result.equityRatio / 100)) : 500000;

        const yearlyRent = monthlyRent * 12;
        const effectiveYearlyRent = yearlyRent * (1 - vacancyRate / 100);
        const grossYield = (yearlyRent / propertyPrice) * 100;
        const cashflow = monthlyRent - monthlyPayment;
        const equity = propertyPrice - loanAmount;
        const annualCashflow = cashflow * 12;
        const cashOnCashReturn = equity > 0 ? (annualCashflow / equity) * 100 : 0;

        return {
            grossYield,
            netYield: (effectiveYearlyRent / propertyPrice) * 100,
            cashflow,
            cashOnCashReturn,
            capRate: grossYield // Simplified cap rate
        };
    }, [result, monthlyRent, vacancyRate]);
}
