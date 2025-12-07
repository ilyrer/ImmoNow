/**
 * Bank Comparison Tab - Professional bank offers comparison
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  Check,
  X,
  Star,
  Award,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { BankComparisonResult } from '../../types/finance';
import { formatCurrency, formatPercent } from '../finance/PDFExportService';

interface BankComparisonTabProps {
  comparison: BankComparisonResult;
}

export const BankComparisonTab: React.FC<BankComparisonTabProps> = ({ comparison }) => {
  const [expandedBank, setExpandedBank] = useState<string | null>(null);

  return (
    <motion.div
      key="banks"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      {/* ========== COMPARISON SUMMARY ========== */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Bankenvergleich</h2>
            <p className="text-blue-100 text-lg">
              {comparison.offers.length} Angebote von führenden deutschen Banken
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-75 mb-1">Durchschnittlicher Zinssatz</div>
            <div className="text-4xl font-bold">{formatPercent(comparison.averageRate)}</div>
          </div>
        </div>
      </div>

      {/* ========== BEST OFFER CARD ========== */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-2xl p-8 text-white overflow-hidden"
      >
        {/* Best Badge */}
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2">
          <Award className="w-5 h-5" />
          <span className="font-bold text-sm">BESTE WAHL</span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
          <div>
            <div className="text-sm opacity-75 mb-2">Empfohlenes Angebot</div>
            <h3 className="text-3xl font-bold mb-4">{comparison.bestOffer.bankName}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm opacity-75">Zinssatz</div>
                <div className="text-2xl font-bold">{formatPercent(comparison.bestOffer.interestRate)}</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Monatliche Rate</div>
                <div className="text-2xl font-bold">{formatCurrency(comparison.bestOffer.monthlyPayment)}</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Gesamtkosten</div>
                <div className="text-2xl font-bold">{formatCurrency(comparison.bestOffer.totalCost)}</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Ersparnis</div>
                <div className="text-2xl font-bold">{formatCurrency(comparison.potentialSavings)}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.floor(comparison.bestOffer.rating)
                      ? 'fill-yellow-300 text-yellow-300'
                      : 'text-white/30'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm opacity-75">
              Zinsbindung: {comparison.bestOffer.fixedRatePeriod} Jahre
            </div>
          </div>
        </div>
      </motion.div>

      {/* ========== ALL OFFERS ========== */}
      <div className="space-y-4">
        {comparison.offers.map((offer, index) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 ${
              offer.recommendation
                ? 'border-green-500 dark:border-green-400'
                : 'border-gray-200 dark:border-gray-700'
            } overflow-hidden`}
          >
            {/* Header */}
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={() => setExpandedBank(expandedBank === offer.id ? null : offer.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-3">
                    <Landmark className="w-6 h-6 text-white" />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {offer.bankName}
                      </h3>
                      {offer.recommendation && (
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold px-3 py-1 rounded-full">
                          EMPFOHLEN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(offer.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                        ({offer.rating.toFixed(1)})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Zinssatz</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPercent(offer.interestRate)}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Monatlich</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(offer.monthlyPayment)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Gesamtkosten</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(offer.totalCost)}
                    </div>
                  </div>

                  {expandedBank === offer.id ? (
                    <ChevronUp className="w-6 h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedBank === offer.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t-2 border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Left Column: Key Metrics */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">Konditionen</h4>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Effektivzins:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatPercent(offer.effectiveRate)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Zinsbindung:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {offer.fixedRatePeriod} Jahre
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Max. Beleihung:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {offer.maxLoanToValue}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Min. Eigenkapital:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {offer.minEquity}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tilgungssatz:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatPercent(offer.repaymentOptions.repaymentRate)}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Fees & Special Features */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">Gebühren</h4>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Bearbeitungsgebühr:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {offer.processingFee > 0 ? `${offer.processingFee}%` : 'Kostenlos'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Schätzgebühr:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {offer.appraisalFee > 0 ? formatCurrency(offer.appraisalFee) : 'Kostenlos'}
                      </span>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-3">Sondertilgung</h4>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Möglich:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {offer.repaymentOptions.allowSpecialRepayment ? (
                            <span className="text-green-600 dark:text-green-400">
                              Ja, bis {offer.repaymentOptions.specialRepaymentLimit}% p.a.
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">Nein</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Pros & Cons */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-green-700 dark:text-green-400 mb-3 flex items-center">
                        <Check className="w-5 h-5 mr-2" />
                        Vorteile
                      </h4>
                      <ul className="space-y-2">
                        {offer.pros.map((pro, idx) => (
                          <li key={idx} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                            <Check className="w-4 h-4 mr-2 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center">
                        <X className="w-5 h-5 mr-2" />
                        Nachteile
                      </h4>
                      <ul className="space-y-2">
                        {offer.cons.map((con, idx) => (
                          <li key={idx} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                            <X className="w-4 h-4 mr-2 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 flex justify-end">
                  <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center space-x-2">
                    <span>Angebot anfragen</span>
                    <TrendingUp className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* ========== COMPARISON INSIGHTS ========== */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-3">
            <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Vergleichsanalyse
            </h3>
            <div className="space-y-2 text-gray-700 dark:text-gray-300">
              <p>
                • Durch die Wahl des günstigsten Angebots können Sie bis zu{' '}
                <span className="font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(comparison.potentialSavings)}
                </span>{' '}
                über die gesamte Laufzeit einsparen.
              </p>
              <p>
                • Der durchschnittliche Zinssatz liegt bei{' '}
                <span className="font-bold">{formatPercent(comparison.averageRate)}</span>.
              </p>
              <p>
                • Empfohlene Angebote berücksichtigen nicht nur den Preis, sondern auch Service-Qualität und Flexibilität.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Alle Angaben ohne Gewähr. Die finalen Konditionen hängen von Ihrer Bonität ab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
