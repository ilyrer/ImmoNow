/**
 * Reusable Input Components for Finance Calculator
 * Banking-grade UI components with Glasmorphism design
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, AlertCircle, CheckCircle } from 'lucide-react';

// ==================== TYPES ====================

export interface InputFieldProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    icon?: React.ReactNode;
    suffix?: string;
    prefix?: string;
    step?: number;
    decimals?: number;
    min?: number;
    max?: number;
    info?: string;
    error?: string;
    warning?: string;
    disabled?: boolean;
    className?: string;
}

export interface ToggleCardProps {
    label: string;
    description?: string;
    icon: React.ReactNode;
    checked: boolean;
    onChange: (checked: boolean) => void;
    children?: React.ReactNode;
    gradient?: string;
    disabled?: boolean;
}

export interface SectionCardProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    collapsible?: boolean;
    defaultOpen?: boolean;
    className?: string;
}

export interface KPIStatCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    gradient?: string;
    trend?: 'up' | 'down' | 'neutral';
    badge?: string;
    onClick?: () => void;
}

export interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

// ==================== CURRENCY INPUT ====================

/**
 * Professional currency/number input with formatting
 */
export const MoneyInput: React.FC<InputFieldProps> = ({
    label,
    value,
    onChange,
    icon,
    suffix = '€',
    prefix,
    step = 1000,
    decimals = 0,
    min,
    max,
    info,
    error,
    warning,
    disabled = false,
    className = ''
}) => {
    const [displayValue, setDisplayValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(formatNumber(value, decimals));
        }
    }, [value, isFocused, decimals]);

    const formatNumber = (num: number, dec: number): string => {
        return new Intl.NumberFormat('de-DE', {
            minimumFractionDigits: dec,
            maximumFractionDigits: dec
        }).format(num);
    };

    const parseNumber = (str: string): number => {
        const cleaned = str.replace(/[^\d,.-]/g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    };

    const handleFocus = () => {
        setIsFocused(true);
        setDisplayValue(value.toString());
    };

    const handleBlur = () => {
        setIsFocused(false);
        const parsed = parseNumber(displayValue);
        let finalValue = parsed;

        if (min !== undefined) finalValue = Math.max(min, finalValue);
        if (max !== undefined) finalValue = Math.min(max, finalValue);

        onChange(finalValue);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    const handleIncrement = () => {
        const newValue = value + step;
        onChange(max !== undefined ? Math.min(max, newValue) : newValue);
    };

    const handleDecrement = () => {
        const newValue = value - step;
        onChange(min !== undefined ? Math.max(min, newValue) : newValue);
    };

    const borderColor = error
        ? 'border-red-500 dark:border-red-400'
        : warning
            ? 'border-yellow-500 dark:border-yellow-400'
            : isFocused
                ? 'border-blue-500 dark:border-blue-400'
                : 'border-gray-300 dark:border-gray-600';

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Label */}
            <label className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span className="flex items-center space-x-2">
                    {icon && <span className="text-blue-600 dark:text-blue-400">{icon}</span>}
                    <span>{label}</span>
                </span>
                {info && (
                    <Tooltip content={info}>
                        <Info className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help" />
                    </Tooltip>
                )}
            </label>

            {/* Input Container */}
            <div className="relative">
                {prefix && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium pointer-events-none">
                        {prefix}
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="text"
                    value={isFocused ? displayValue : formatNumber(value, decimals)}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    disabled={disabled}
                    className={`
            w-full ${prefix ? 'pl-8' : 'pl-4'} ${suffix ? 'pr-24' : 'pr-4'} py-3
            bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm
            border-2 ${borderColor}
            rounded-xl
            text-right font-mono text-base
            text-gray-900 dark:text-white
            focus:outline-none focus:ring-4 focus:ring-blue-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
          `}
                />

                {suffix && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                        <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                            {suffix}
                        </span>
                        <div className="flex flex-col -space-y-1">
                            <button
                                type="button"
                                onClick={handleIncrement}
                                disabled={disabled || (max !== undefined && value >= max)}
                                className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L10 6.414l-3.293 3.293a1 1 0 01-1.414 0z" />
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={handleDecrement}
                                disabled={disabled || (min !== undefined && value <= min)}
                                className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L10 13.586l3.293-3.293a1 1 0 011.414 0z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Error/Warning/Info Messages */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start space-x-2 text-sm text-red-600 dark:text-red-400"
                    >
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </motion.div>
                )}
                {!error && warning && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start space-x-2 text-sm text-yellow-600 dark:text-yellow-400"
                    >
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                    </motion.div>
                )}
                {!error && !warning && info && !isFocused && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        {info}
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ==================== TOGGLE CARD ====================

/**
 * Toggle card with collapsible content
 */
export const ToggleCard: React.FC<ToggleCardProps> = ({
    label,
    description,
    icon,
    checked,
    onChange,
    children,
    gradient = 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    disabled = false
}) => {
    return (
        <div className={`bg-gradient-to-br ${gradient} rounded-xl p-6 border border-blue-200 dark:border-blue-800 transition-all duration-300 ${checked ? 'ring-2 ring-blue-500/50' : ''}`}>
            <label className="flex items-center space-x-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={disabled}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="text-blue-600 dark:text-blue-400">{icon}</div>
                <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">{label}</div>
                    {description && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{description}</div>
                    )}
                </div>
            </label>

            <AnimatePresence>
                {checked && children && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ==================== SECTION CARD ====================

/**
 * Collapsible section card
 */
export const SectionCard: React.FC<SectionCardProps> = ({
    title,
    icon,
    children,
    collapsible = false,
    defaultOpen = true,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            <div
                className={`p-6 flex items-center justify-between ${collapsible ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''}`}
                onClick={() => collapsible && setIsOpen(!isOpen)}
            >
                <div className="flex items-center space-x-3">
                    {icon && <div className="text-blue-600 dark:text-blue-400">{icon}</div>}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                </div>
                {collapsible && (
                    <motion.div
                        animate={{ rotate: isOpen ? 0 : -90 }}
                        transition={{ duration: 0.2 }}
                    >
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={collapsible ? { opacity: 0, height: 0 } : false}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 pb-6"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ==================== KPI STAT CARD ====================

/**
 * KPI display card with gradient background
 */
export const KPIStatCard: React.FC<KPIStatCardProps> = ({
    label,
    value,
    subtitle,
    icon,
    gradient = 'from-blue-500 to-blue-600',
    trend,
    badge,
    onClick
}) => {
    const trendIcon = trend === 'up'
        ? '↗'
        : trend === 'down'
            ? '↘'
            : null;

    return (
        <motion.div
            whileHover={onClick ? { scale: 1.02, y: -4 } : {}}
            onClick={onClick}
            className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-xl ${onClick ? 'cursor-pointer' : ''} relative overflow-hidden`}
        >
            {/* Badge */}
            {badge && (
                <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold">
                    {badge}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium opacity-90">{label}</span>
                <div className="opacity-75">{icon}</div>
            </div>

            {/* Value */}
            <div className="text-3xl font-bold mb-1 flex items-center">
                {typeof value === 'number' ? value.toLocaleString('de-DE') : value}
                {trendIcon && <span className="ml-2 text-2xl">{trendIcon}</span>}
            </div>

            {/* Subtitle */}
            {subtitle && (
                <div className="text-sm opacity-75">{subtitle}</div>
            )}
        </motion.div>
    );
};

// ==================== TOOLTIP ====================

/**
 * Simple tooltip component
 */
export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top'
}) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`
              absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap
              ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
              ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
              ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' : ''}
              ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 ml-2' : ''}
            `}
                    >
                        {content}
                        {/* Arrow */}
                        <div
                            className={`
                absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 rotate-45
                ${position === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2' : ''}
                ${position === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
                ${position === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2' : ''}
                ${position === 'right' ? 'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2' : ''}
              `}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
