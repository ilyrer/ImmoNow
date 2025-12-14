/**
 * Bank Comparison View
 * Compare financing offers from different banks
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Landmark,
    AlertCircle,
    Star,
    CheckCircle,
    TrendingDown,
    Award,
    Clock,
    ShieldCheck,
    ArrowUpDown
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../PDFExportService';

interface BankOffer {
    id: string;
    bankName: string;
    interestRate: number;
    effectiveRate: number;
    monthlyPayment: number;
    totalCost: number;
    fixedRatePeriod: number;
    processingFee: number;
    earlyRepaymentOption: boolean;
    specialRepaymentRate: number;
    rating: number;
    features: string[];
    recommended?: boolean;
}

interface BankComparisonViewProps {
    loanAmount?: number;
    loanTerm?: number;
}

export const BankComparisonView: React.FC<BankComparisonViewProps> = ({
    loanAmount,
    loanTerm
}) => {
    // Use default values if not provided
    const effectiveLoanAmount = loanAmount || 400000;
    const effectiveLoanTerm = loanTerm || 25;
    const [sortBy, setSortBy] = useState<'rate' | 'total' | 'monthly'>('total');

    // Simulated bank offers
    const bankOffers = useMemo((): BankOffer[] => {
        const baseRate = 3.45;
        const banks = [
            {
                name: 'ING-DiBa',
                rateOffset: 0,
                feePercent: 0,
                features: ['Kostenlose Sondertilgung 5%', 'Online-Konto inklusive', 'Flexible Ratenanpassung'],
                rating: 4.8,
                specialRepayment: 5
            },
            {
                name: 'Deutsche Bank',
                rateOffset: 0.25,
                feePercent: 1.0,
                features: ['Persönlicher Berater', 'Tilgungsfreie Anlaufjahre möglich', 'Sondertilgung 10%'],
                rating: 4.5,
                specialRepayment: 10
            },
            {
                name: 'Commerzbank',
                rateOffset: 0.15,
                feePercent: 0.5,
                features: ['Flexible Zinsbindung', 'Bereitstellungsfreie Zeit 12 Monate', 'Sondertilgung 5%'],
                rating: 4.6,
                specialRepayment: 5
            },
            {
                name: 'Sparkasse',
                rateOffset: 0.35,
                feePercent: 1.5,
                features: ['Regionale Beratung', 'Kombination mit Bausparen', 'Fördermittel-Service'],
                rating: 4.3,
                specialRepayment: 5
            },
            {
                name: 'Interhyp',
                rateOffset: -0.15,
                feePercent: 0.3,
                features: ['Über 400 Banken im Vergleich', 'Kostenlose Beratung', 'Sondertilgung 10%'],
                rating: 4.9,
                specialRepayment: 10,
                recommended: true
            },
            {
                name: 'Postbank',
                rateOffset: 0.20,
                feePercent: 0.8,
                features: ['Online und Filiale', 'Flexible Tilgung', 'Forward-Darlehen möglich'],
                rating: 4.4,
                specialRepayment: 5
            }
        ];

        return banks.map((bank, idx) => {
            const interestRate = baseRate + bank.rateOffset;
            const monthlyRate = interestRate / 100 / 12;
            const numPayments = effectiveLoanTerm * 12;
            const monthlyPayment = effectiveLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
            const totalCost = monthlyPayment * numPayments;
            const processingFee = effectiveLoanAmount * (bank.feePercent / 100);
            const effectiveRate = interestRate + (bank.feePercent / effectiveLoanTerm);

            return {
                id: `bank-${idx}`,
                bankName: bank.name,
                interestRate,
                effectiveRate,
                monthlyPayment,
                totalCost: totalCost + processingFee,
                fixedRatePeriod: 15,
                processingFee,
                earlyRepaymentOption: true,
                specialRepaymentRate: bank.specialRepayment,
                rating: bank.rating,
                features: bank.features,
                recommended: bank.recommended
            };
        });
    }, [effectiveLoanAmount, effectiveLoanTerm]);

    const sortedOffers = useMemo(() => {
        const sorted = [...bankOffers];
        switch (sortBy) {
            case 'rate':
                return sorted.sort((a, b) => a.effectiveRate - b.effectiveRate);
            case 'monthly':
                return sorted.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
            case 'total':
            default:
                return sorted.sort((a, b) => a.totalCost - b.totalCost);
        }
    }, [bankOffers, sortBy]);

    const bestOffer = sortedOffers[0];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                        <Landmark className="w-7 h-7 mr-3 text-blue-600" />
                        Bankenvergleich
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Vergleichen Sie {bankOffers.length} aktuelle Finanzierungsangebote
                    </p>
                </div>

                {/* Sort Options */}
                <div className="flex items-center space-x-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="total">Gesamtkosten</option>
                        <option value="rate">Effektivzins</option>
                        <option value="monthly">Monatsrate</option>
                    </select>
                </div>
            </div>

            {/* Best Offer Highlight */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                <Award className="w-6 h-6" />
                                <span className="text-sm font-semibold uppercase tracking-wide">Bestes Angebot</span>
                            </div>
                            <h4 className="text-3xl font-bold">{bestOffer.bankName}</h4>
                        </div>
                        <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    className={`w-5 h-5 ${i < Math.floor(bestOffer.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-white/40'}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-6">
                        <div>
                            <div className="text-white/80 text-sm mb-1">Effektivzins</div>
                            <div className="text-2xl font-bold">{formatPercent(bestOffer.effectiveRate)}</div>
                        </div>
                        <div>
                            <div className="text-white/80 text-sm mb-1">Monatsrate</div>
                            <div className="text-2xl font-bold">{formatCurrency(bestOffer.monthlyPayment)}</div>
                        </div>
                        <div>
                            <div className="text-white/80 text-sm mb-1">Gesamtkosten</div>
                            <div className="text-2xl font-bold">{formatCurrency(bestOffer.totalCost)}</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* All Offers */}
            <div className="grid gap-4">
                {sortedOffers.map((offer, index) => (
                    <motion.div
                        key={offer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 transition-all hover:shadow-lg ${offer.recommended
                                ? 'border-green-500 shadow-lg'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                    {index + 1}
                                </div>
                                <div>
                                    <h5 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                        {offer.bankName}
                                        {offer.recommended && (
                                            <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                                Empfohlen
                                            </span>
                                        )}
                                    </h5>
                                    <div className="flex items-center space-x-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${i < Math.floor(offer.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                            {offer.rating.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sollzins p.a.</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatPercent(offer.interestRate)}
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Effektivzins</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatPercent(offer.effectiveRate)}
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Monatsrate</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(offer.monthlyPayment)}
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gesamtkosten</div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(offer.totalCost)}
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-2 mb-4">
                            {offer.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>

                        {/* Additional Info */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Zinsbindung {offer.fixedRatePeriod} Jahre</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Bearbeitungsgebühr {formatCurrency(offer.processingFee)}</span>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors">
                                Details anzeigen
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-1">Hinweis zu den Konditionen</p>
                    <p>
                        Die angezeigten Zinssätze sind Richtwerte basierend auf aktuellen Marktdaten.
                        Ihre individuellen Konditionen können abweichen und hängen von Bonität, Eigenkapital und weiteren Faktoren ab.
                    </p>
                </div>
            </div>
        </motion.div>
    );
};
