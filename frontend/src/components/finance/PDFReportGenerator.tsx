/**
 * Professional PDF Report Generator
 * Enterprise-grade HTML report that can be converted to PDF
 * Uses Playwright or print-to-PDF browser API
 */

import React from 'react';
import { FinancingResult, FinancingParameters } from '../../types/finance';
import { formatCurrency, formatPercent } from './PDFExportService';

interface PDFReportProps {
    result: FinancingResult;
    parameters: FinancingParameters;
    customerName?: string;
    propertyAddress?: string;
    advisorName?: string;
    companyName?: string;
}

export const PDFReportGenerator: React.FC<PDFReportProps> = ({
    result,
    parameters,
    customerName = 'Kunde',
    propertyAddress = 'Immobilienadresse',
    advisorName = 'Finanzberater',
    companyName = 'ImmoNow Finanzberatung'
}) => {
    const reportDate = new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="pdf-report" style={styles.page}>
            {/* Cover Page */}
            <div style={styles.coverPage}>
                <div style={styles.coverHeader}>
                    <div style={styles.logo}>{companyName}</div>
                    <div style={styles.reportNumber}>Finanzierungsangebot #{Date.now().toString().slice(-6)}</div>
                </div>

                <div style={styles.coverTitle}>
                    <h1 style={styles.mainTitle}>Finanzierungsvorschlag</h1>
                    <h2 style={styles.subtitle}>Immobilienfinanzierung</h2>
                </div>

                <div style={styles.coverInfo}>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Kunde:</span>
                        <span style={styles.infoValue}>{customerName}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Objekt:</span>
                        <span style={styles.infoValue}>{propertyAddress}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Berater:</span>
                        <span style={styles.infoValue}>{advisorName}</span>
                    </div>
                    <div style={styles.infoRow}>
                        <span style={styles.infoLabel}>Datum:</span>
                        <span style={styles.infoValue}>{reportDate}</span>
                    </div>
                </div>

                <div style={styles.coverFooter}>
                    <div style={styles.confidential}>Vertraulich • Nur für den Empfänger bestimmt</div>
                </div>
            </div>

            {/* Page Break */}
            <div style={styles.pageBreak} />

            {/* Executive Summary */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Executive Summary</h2>

                <div style={styles.keyMetricsGrid}>
                    <div style={styles.metricCard}>
                        <div style={styles.metricLabel}>Monatliche Rate</div>
                        <div style={styles.metricValue}>{formatCurrency(result.monthlyPayment)}</div>
                        <div style={styles.metricSubtitle}>inkl. Nebenkosten</div>
                    </div>

                    <div style={styles.metricCard}>
                        <div style={styles.metricLabel}>Darlehenssumme</div>
                        <div style={styles.metricValue}>{formatCurrency(result.loanAmount)}</div>
                        <div style={styles.metricSubtitle}>{result.loanToValue.toFixed(1)}% Beleihungsauslauf</div>
                    </div>

                    <div style={styles.metricCard}>
                        <div style={styles.metricLabel}>Effektivzins</div>
                        <div style={styles.metricValue}>{formatPercent(result.effectiveInterestRate)}</div>
                        <div style={styles.metricSubtitle}>p.a.</div>
                    </div>

                    <div style={styles.metricCard}>
                        <div style={styles.metricLabel}>Gesamtkosten</div>
                        <div style={styles.metricValue}>{formatCurrency(result.totalCost)}</div>
                        <div style={styles.metricSubtitle}>über {parameters.loanTerm} Jahre</div>
                    </div>
                </div>

                <div style={styles.summaryText}>
                    <p style={styles.paragraph}>
                        Basierend auf Ihren Angaben haben wir eine maßgeschneiderte Finanzierungslösung für Ihre Immobilie erstellt.
                        Die monatliche Rate von <strong>{formatCurrency(result.monthlyPayment)}</strong> beinhaltet Tilgung,
                        Zinsen sowie alle relevanten Nebenkosten.
                    </p>
                    <p style={styles.paragraph}>
                        Mit einem Eigenkapitalanteil von <strong>{formatPercent(result.equityRatio)}</strong> liegt Ihre Finanzierung
                        im empfohlenen Bereich. Die Zinsbindung von <strong>{result.fixedRatePeriod} Jahren</strong> gibt Ihnen
                        Planungssicherheit in dieser Zeit.
                    </p>
                </div>
            </div>

            {/* Financing Parameters */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Finanzierungsparameter</h2>

                <table style={styles.table}>
                    <tbody>
                        <tr style={styles.tableRow}>
                            <td style={styles.tableLabel}>Kaufpreis</td>
                            <td style={styles.tableValue}>{formatCurrency(parameters.propertyPrice)}</td>
                        </tr>
                        <tr style={styles.tableRow}>
                            <td style={styles.tableLabel}>Eigenkapital</td>
                            <td style={styles.tableValue}>{formatCurrency(parameters.equity)} ({formatPercent(result.equityRatio)})</td>
                        </tr>
                        <tr style={styles.tableRow}>
                            <td style={styles.tableLabel}>Zusätzliche Kosten (Notar, Steuer)</td>
                            <td style={styles.tableValue}>{formatCurrency(parameters.additionalCosts)}</td>
                        </tr>
                        <tr style={styles.tableRowDivider}>
                            <td style={styles.tableLabel}><strong>Darlehensbedarf</strong></td>
                            <td style={styles.tableValue}><strong>{formatCurrency(result.loanAmount)}</strong></td>
                        </tr>
                        <tr style={styles.tableRow}>
                            <td style={styles.tableLabel}>Sollzinssatz p.a.</td>
                            <td style={styles.tableValue}>{formatPercent(parameters.interestRate)}</td>
                        </tr>
                        <tr style={styles.tableRow}>
                            <td style={styles.tableLabel}>Effektivzins p.a.</td>
                            <td style={styles.tableValue}>{formatPercent(result.effectiveInterestRate)}</td>
                        </tr>
                        <tr style={styles.tableRow}>
                            <td style={styles.tableLabel}>Anfängliche Tilgung</td>
                            <td style={styles.tableValue}>{formatPercent(result.repaymentRate)}</td>
                        </tr>
                        <tr style={styles.tableRow}>
                            <td style={styles.tableLabel}>Laufzeit</td>
                            <td style={styles.tableValue}>{parameters.loanTerm} Jahre</td>
                        </tr>
                        <tr style={styles.tableRow}>
                            <td style={styles.tableLabel}>Zinsbindung</td>
                            <td style={styles.tableValue}>{result.fixedRatePeriod} Jahre</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Monthly Payment Breakdown */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Monatliche Belastung</h2>

                <div style={styles.breakdownBox}>
                    <div style={styles.breakdownRow}>
                        <span style={styles.breakdownLabel}>Zins und Tilgung</span>
                        <span style={styles.breakdownValue}>{formatCurrency(result.baseMonthlyPayment)}</span>
                    </div>
                    {parameters.includeInsurance && (
                        <div style={styles.breakdownRow}>
                            <span style={styles.breakdownLabel}>Gebäudeversicherung</span>
                            <span style={styles.breakdownValue}>{formatCurrency((parameters.insuranceRate / 100) * parameters.propertyPrice / 12)}</span>
                        </div>
                    )}
                    <div style={styles.breakdownRow}>
                        <span style={styles.breakdownLabel}>Instandhaltungsrücklage</span>
                        <span style={styles.breakdownValue}>{formatCurrency((parameters.maintenanceRate / 100) * parameters.propertyPrice / 12)}</span>
                    </div>
                    <div style={{ ...styles.breakdownRow, ...styles.breakdownTotal }}>
                        <span style={styles.breakdownLabel}><strong>Gesamtbelastung monatlich</strong></span>
                        <span style={styles.breakdownValue}><strong>{formatCurrency(result.monthlyPayment)}</strong></span>
                    </div>
                </div>
            </div>

            <div style={styles.pageBreak} />

            {/* Amortization Schedule */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Tilgungsverlauf</h2>

                <table style={styles.table}>
                    <thead>
                        <tr style={styles.tableHeaderRow}>
                            <th style={styles.tableHeader}>Jahr</th>
                            <th style={styles.tableHeader}>Restschuld</th>
                            <th style={styles.tableHeader}>Tilgung</th>
                            <th style={styles.tableHeader}>Zinsen</th>
                            <th style={styles.tableHeader}>Fortschritt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {result.chartData.slice(0, 10).map((entry, idx) => (
                            <tr
                                key={entry.year}
                                style={{
                                    ...styles.tableRow,
                                    ...(entry.year === result.fixedRatePeriod ? styles.tableRowHighlight : {})
                                }}
                            >
                                <td style={styles.tableCell}>{entry.year}</td>
                                <td style={styles.tableCell}>{formatCurrency(entry.remainingDebt)}</td>
                                <td style={styles.tableCell}>{formatCurrency(entry.yearlyPrincipal)}</td>
                                <td style={styles.tableCell}>{formatCurrency(entry.yearlyInterest)}</td>
                                <td style={styles.tableCell}>
                                    <div style={styles.progressBar}>
                                        <div style={{ ...styles.progressFill, width: `${entry.progress}%` }} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={styles.note}>
                    <strong>Hinweis:</strong> Nach Ende der Zinsbindung ({result.fixedRatePeriod} Jahre) beträgt die Restschuld{' '}
                    <strong>{formatCurrency(result.remainingDebtAfterFixedRate)}</strong>.
                    Zu diesem Zeitpunkt ist eine Anschlussfinanzierung erforderlich.
                </div>
            </div>

            {/* Cost Summary */}
            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Kostenübersicht</h2>

                <div style={styles.costSummary}>
                    <div style={styles.costRow}>
                        <span style={styles.costLabel}>Darlehenssumme</span>
                        <span style={styles.costValue}>{formatCurrency(result.loanAmount)}</span>
                    </div>
                    <div style={styles.costRow}>
                        <span style={styles.costLabel}>Zinskosten (gesamt)</span>
                        <span style={styles.costValue}>{formatCurrency(result.totalInterest)}</span>
                    </div>
                    {result.fees.total > 0 && (
                        <>
                            <div style={styles.costRow}>
                                <span style={styles.costLabel}>Bearbeitungsgebühr</span>
                                <span style={styles.costValue}>{formatCurrency(result.fees.processing)}</span>
                            </div>
                            <div style={styles.costRow}>
                                <span style={styles.costLabel}>Schätzgebühr</span>
                                <span style={styles.costValue}>{formatCurrency(result.fees.appraisal)}</span>
                            </div>
                        </>
                    )}
                    <div style={{ ...styles.costRow, ...styles.costTotal }}>
                        <span style={styles.costLabel}><strong>Gesamtkosten</strong></span>
                        <span style={styles.costValue}><strong>{formatCurrency(result.totalCost)}</strong></span>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <div style={styles.section}>
                <div style={styles.disclaimer}>
                    <h3 style={styles.disclaimerTitle}>Wichtige Hinweise</h3>
                    <ul style={styles.disclaimerList}>
                        <li style={styles.disclaimerItem}>
                            Dieses Angebot ist unverbindlich und basiert auf den von Ihnen bereitgestellten Angaben.
                        </li>
                        <li style={styles.disclaimerItem}>
                            Die tatsächlichen Konditionen können nach Bonitätsprüfung abweichen.
                        </li>
                        <li style={styles.disclaimerItem}>
                            Die Zinsbindung gilt für {result.fixedRatePeriod} Jahre. Danach ist eine Anschlussfinanzierung zu den dann gültigen Konditionen erforderlich.
                        </li>
                        <li style={styles.disclaimerItem}>
                            Bitte beachten Sie, dass bei vorzeitiger Kündigung Vorfälligkeitsentschädigungen anfallen können.
                        </li>
                        <li style={styles.disclaimerItem}>
                            Dieses Dokument stellt keine Finanzberatung dar. Bitte konsultieren Sie einen qualifizierten Finanzberater.
                        </li>
                    </ul>
                </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <div style={styles.footerContent}>
                    <div>{companyName} • Erstellt am {reportDate}</div>
                    <div>Seite 1 von 1</div>
                </div>
            </div>
        </div>
    );
};

// Inline styles optimized for print/PDF
const styles: Record<string, React.CSSProperties> = {
    page: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        fontSize: '11pt',
        lineHeight: 1.6,
        color: '#1a202c',
        backgroundColor: '#ffffff',
        padding: '20mm',
        maxWidth: '210mm', // A4 width
        margin: '0 auto'
    },

    // Cover Page
    coverPage: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '297mm', // A4 height
        padding: '40mm 20mm'
    },
    coverHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '3px solid #2563eb',
        paddingBottom: '20px'
    },
    logo: {
        fontSize: '24pt',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    },
    reportNumber: {
        fontSize: '10pt',
        color: '#64748b',
        fontWeight: 600
    },
    coverTitle: {
        textAlign: 'center' as const,
        marginTop: '80px'
    },
    mainTitle: {
        fontSize: '48pt',
        fontWeight: 700,
        marginBottom: '20px',
        color: '#1e293b'
    },
    subtitle: {
        fontSize: '24pt',
        fontWeight: 400,
        color: '#64748b'
    },
    coverInfo: {
        backgroundColor: '#f8fafc',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginTop: '60px'
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        borderBottom: '1px solid #e2e8f0'
    },
    infoLabel: {
        fontSize: '11pt',
        color: '#64748b',
        fontWeight: 600
    },
    infoValue: {
        fontSize: '11pt',
        color: '#1e293b',
        fontWeight: 600
    },
    coverFooter: {
        textAlign: 'center' as const,
        marginTop: '60px'
    },
    confidential: {
        fontSize: '9pt',
        color: '#94a3b8',
        fontStyle: 'italic'
    },

    // Sections
    section: {
        marginBottom: '30px'
    },
    sectionTitle: {
        fontSize: '18pt',
        fontWeight: 700,
        color: '#1e293b',
        marginBottom: '20px',
        paddingBottom: '10px',
        borderBottom: '2px solid #2563eb'
    },

    // Metrics Grid
    keyMetricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        marginBottom: '30px'
    },
    metricCard: {
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '12px',
        border: '2px solid #e2e8f0'
    },
    metricLabel: {
        fontSize: '10pt',
        color: '#64748b',
        marginBottom: '8px',
        fontWeight: 600
    },
    metricValue: {
        fontSize: '20pt',
        fontWeight: 700,
        color: '#2563eb',
        marginBottom: '4px'
    },
    metricSubtitle: {
        fontSize: '9pt',
        color: '#94a3b8'
    },

    // Text
    summaryText: {
        backgroundColor: '#eff6ff',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #bfdbfe'
    },
    paragraph: {
        marginBottom: '12px',
        lineHeight: 1.8
    },

    // Tables
    table: {
        width: '100%',
        borderCollapse: 'collapse' as const,
        marginBottom: '20px'
    },
    tableHeaderRow: {
        backgroundColor: '#2563eb',
        color: '#ffffff'
    },
    tableHeader: {
        padding: '12px',
        textAlign: 'left' as const,
        fontWeight: 600,
        fontSize: '10pt'
    },
    tableRow: {
        borderBottom: '1px solid #e2e8f0'
    },
    tableRowDivider: {
        borderTop: '2px solid #2563eb',
        borderBottom: '2px solid #2563eb',
        backgroundColor: '#eff6ff'
    },
    tableRowHighlight: {
        backgroundColor: '#fef3c7',
        fontWeight: 600
    },
    tableLabel: {
        padding: '12px',
        fontSize: '10pt'
    },
    tableValue: {
        padding: '12px',
        textAlign: 'right' as const,
        fontSize: '10pt',
        fontWeight: 600
    },
    tableCell: {
        padding: '10px 12px',
        fontSize: '10pt'
    },

    // Breakdown Box
    breakdownBox: {
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
    },
    breakdownRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid #e2e8f0'
    },
    breakdownLabel: {
        fontSize: '11pt',
        color: '#475569'
    },
    breakdownValue: {
        fontSize: '11pt',
        fontWeight: 600,
        color: '#1e293b'
    },
    breakdownTotal: {
        borderTop: '2px solid #2563eb',
        borderBottom: 'none',
        marginTop: '10px',
        paddingTop: '15px',
        fontSize: '12pt'
    },

    // Progress Bar
    progressBar: {
        height: '8px',
        backgroundColor: '#e2e8f0',
        borderRadius: '4px',
        overflow: 'hidden',
        width: '100px'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#2563eb',
        transition: 'width 0.3s ease'
    },

    // Cost Summary
    costSummary: {
        backgroundColor: '#f8fafc',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
    },
    costRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '10px 0',
        borderBottom: '1px solid #e2e8f0'
    },
    costLabel: {
        fontSize: '11pt',
        color: '#475569'
    },
    costValue: {
        fontSize: '11pt',
        fontWeight: 600,
        color: '#1e293b'
    },
    costTotal: {
        borderTop: '2px solid #2563eb',
        borderBottom: 'none',
        marginTop: '10px',
        paddingTop: '15px',
        fontSize: '12pt'
    },

    // Note
    note: {
        backgroundColor: '#fef3c7',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #fde68a',
        fontSize: '10pt',
        marginTop: '20px'
    },

    // Disclaimer
    disclaimer: {
        backgroundColor: '#f1f5f9',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #cbd5e1'
    },
    disclaimerTitle: {
        fontSize: '12pt',
        fontWeight: 700,
        marginBottom: '15px',
        color: '#1e293b'
    },
    disclaimerList: {
        listStyleType: 'disc',
        paddingLeft: '20px'
    },
    disclaimerItem: {
        fontSize: '9pt',
        color: '#475569',
        marginBottom: '8px',
        lineHeight: 1.6
    },

    // Footer
    footer: {
        marginTop: '40px',
        paddingTop: '20px',
        borderTop: '1px solid #e2e8f0'
    },
    footerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '9pt',
        color: '#94a3b8'
    },

    // Page Break
    pageBreak: {
        pageBreakAfter: 'always' as const,
        marginBottom: '40mm'
    }
};

export default PDFReportGenerator;
