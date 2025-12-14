/**
 * Professional PDF Report Service
 * Browser-based PDF generation using Print API
 */

import { FinancingResult, FinancingParameters } from '../../types/finance';
import { formatCurrency, formatPercent } from './PDFExportService';

export interface PremiumPDFOptions {
    result: FinancingResult;
    parameters: FinancingParameters;
    customerName?: string;
    propertyAddress?: string;
    advisorName?: string;
    companyName?: string;
}

/**
 * Generate professional PDF using browser's print functionality
 * Opens print dialog with enterprise-grade formatted report
 */
export const generateProfessionalPDF = async (options: PremiumPDFOptions): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        try {
            // Create hidden iframe for PDF generation
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = 'none';
            iframe.style.visibility = 'hidden';
            document.body.appendChild(iframe);

            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc) {
                throw new Error('Failed to access iframe document');
            }

            // Write HTML structure with print-optimized styles
            iframeDoc.open();
            iframeDoc.write(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Finanzierungsvorschlag - ${options.customerName || 'Kunde'}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                color-adjust: exact;
              }
              
              .page-break {
                page-break-after: always;
                break-after: page;
              }
              
              /* Prevent content from breaking */
              h2, h3, h4 {
                page-break-after: avoid;
                break-after: avoid;
              }
              
              table, .metric-card, .section {
                page-break-inside: avoid;
                break-inside: avoid;
              }
              
              /* Orphans and widows */
              p {
                orphans: 3;
                widows: 3;
              }
            }
            
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            
            * {
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div id="pdf-root"></div>
        </body>
        </html>
      `);
            iframeDoc.close();

            // Wait for iframe load
            const onLoad = () => {
                const root = iframeDoc.getElementById('pdf-root');
                if (!root) {
                    reject(new Error('Failed to find root element'));
                    return;
                }

                // Generate HTML report content
                root.innerHTML = generateHTMLReport(options);

                // Wait for rendering, then trigger print
                setTimeout(() => {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    }

                    // Cleanup after print
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                        resolve();
                    }, 2000);
                }, 1000);
            };

            if (iframe.contentWindow) {
                iframe.contentWindow.addEventListener('load', onLoad);
            } else {
                setTimeout(onLoad, 100);
            }
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate HTML Report Content
 */
function generateHTMLReport(options: PremiumPDFOptions): string {
    const reportDate = new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 210mm; margin: 0 auto;">
      <!-- Cover Page -->
      <div style="min-height: 297mm; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 80px;">
          <div style="font-size: 28pt; font-weight: 700; color: #2563eb;">${options.companyName || 'ImmoNow'}</div>
        </div>
        
        <div style="text-align: center; margin: 80px 0;">
          <h1 style="font-size: 48pt; font-weight: 700; margin-bottom: 20px;">Finanzierungsvorschlag</h1>
          <h2 style="font-size: 24pt; color: #64748b;">Immobilienfinanzierung</h2>
        </div>

        <div style="background: #f8fafc; padding: 30px; border-radius: 12px; margin: 60px 0;">
          <div style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <strong>Kunde:</strong> ${options.customerName || 'Kunde'}
          </div>
          <div style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <strong>Objekt:</strong> ${options.propertyAddress || 'Immobilienadresse'}
          </div>
          <div style="padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
            <strong>Berater:</strong> ${options.advisorName || 'Finanzberater'}
          </div>
          <div style="padding: 12px 0;">
            <strong>Datum:</strong> ${reportDate}
          </div>
        </div>
      </div>

      <div style="page-break-after: always;"></div>

      <!-- Executive Summary -->
      <h2 style="font-size: 24pt; font-weight: 700; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px;">Executive Summary</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
          <div style="color: #64748b; font-size: 10pt; margin-bottom: 8px;">Monatliche Rate</div>
          <div style="font-size: 20pt; font-weight: 700; color: #2563eb;">${formatCurrency(options.result.monthlyPayment)}</div>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
          <div style="color: #64748b; font-size: 10pt; margin-bottom: 8px;">Darlehenssumme</div>
          <div style="font-size: 20pt; font-weight: 700; color: #2563eb;">${formatCurrency(options.result.loanAmount)}</div>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
          <div style="color: #64748b; font-size: 10pt; margin-bottom: 8px;">Effektivzins</div>
          <div style="font-size: 20pt; font-weight: 700; color: #2563eb;">${formatPercent(options.result.effectiveInterestRate)}</div>
        </div>
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px;">
          <div style="color: #64748b; font-size: 10pt; margin-bottom: 8px;">Gesamtkosten</div>
          <div style="font-size: 20pt; font-weight: 700; color: #2563eb;">${formatCurrency(options.result.totalCost)}</div>
        </div>
      </div>

      <!-- Parameters Table -->
      <h2 style="font-size: 20pt; font-weight: 700; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin: 40px 0 20px;">Finanzierungsparameter</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px;">Kaufpreis</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">${formatCurrency(options.parameters.propertyPrice)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px;">Eigenkapital</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">${formatCurrency(options.parameters.equity)} (${formatPercent(options.result.equityRatio)})</td>
        </tr>
        <tr style="border-bottom: 2px solid #2563eb; background: #eff6ff;">
          <td style="padding: 12px;"><strong>Darlehensbedarf</strong></td>
          <td style="padding: 12px; text-align: right;"><strong>${formatCurrency(options.result.loanAmount)}</strong></td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px;">Sollzinssatz p.a.</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">${formatPercent(options.parameters.interestRate)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px;">Laufzeit</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">${options.parameters.loanTerm} Jahre</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px;">Zinsbindung</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">${options.result.fixedRatePeriod} Jahre</td>
        </tr>
      </table>

      <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Hinweis:</strong> Nach Ende der Zinsbindung (${options.result.fixedRatePeriod} Jahre) beträgt die Restschuld <strong>${formatCurrency(options.result.remainingDebtAfterFixedRate)}</strong>.
      </div>

      <!-- Footer -->
      <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 9pt;">
        ${options.companyName || 'ImmoNow'} • Erstellt am ${reportDate}
      </div>
    </div>
  `;
}

/**
 * Download report as HTML file
 * Alternative format for sharing or archiving
 */
export const downloadHTMLReport = (options: PremiumPDFOptions): void => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Finanzierungsvorschlag_${options.customerName?.replace(/\s+/g, '_') || 'Kunde'}_${timestamp}.html`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Finanzierungsvorschlag - ${options.customerName || 'Kunde'}</title>
  <style>
    @media print {
      @page { size: A4; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${generateHTMLReport(options)}
</body>
</html>
  `.trim();

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

/**
 * Export financing data as JSON
 * For data exchange and API integration
 */
export const exportFinancingJSON = (options: PremiumPDFOptions): void => {
    const timestamp = new Date().toISOString();
    const filename = `Finanzierung_${options.customerName?.replace(/\s+/g, '_') || 'Kunde'}_${timestamp.split('T')[0]}.json`;

    const data = {
        metadata: {
            exportDate: timestamp,
            version: '2.0',
            customerName: options.customerName || '',
            propertyAddress: options.propertyAddress || '',
            advisorName: options.advisorName || '',
            companyName: options.companyName || 'ImmoNow'
        },
        parameters: {
            propertyPrice: options.parameters.propertyPrice,
            equity: options.parameters.equity,
            interestRate: options.parameters.interestRate,
            loanTerm: options.parameters.loanTerm,
            fixedRatePeriod: options.parameters.fixedRatePeriod,
            additionalCosts: options.parameters.additionalCosts,
            includeInsurance: options.parameters.includeInsurance,
            insuranceRate: options.parameters.insuranceRate,
            maintenanceRate: options.parameters.maintenanceRate,
            repaymentRate: options.parameters.repaymentRate,
            fees: options.parameters.fees
        },
        results: {
            monthlyPayment: options.result.monthlyPayment,
            baseMonthlyPayment: options.result.baseMonthlyPayment,
            loanAmount: options.result.loanAmount,
            totalInterest: options.result.totalInterest,
            totalCost: options.result.totalCost,
            effectiveInterestRate: options.result.effectiveInterestRate,
            loanToValue: options.result.loanToValue,
            repaymentRate: options.result.repaymentRate,
            equityRatio: options.result.equityRatio,
            fixedRatePeriod: options.result.fixedRatePeriod,
            remainingDebtAfterFixedRate: options.result.remainingDebtAfterFixedRate,
            fees: options.result.fees
        },
        amortizationSchedule: options.result.chartData.map(entry => ({
            year: entry.year,
            remainingDebt: entry.remainingDebt,
            yearlyPrincipal: entry.yearlyPrincipal,
            yearlyInterest: entry.yearlyInterest,
            cumulativePrincipal: entry.cumulativePrincipal,
            cumulativeInterest: entry.cumulativeInterest,
            progress: entry.progress
        }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};

/**
 * Export to CSV for Excel compatibility
 * Includes amortization schedule in tabular format
 */
export const exportToCSV = (options: PremiumPDFOptions): void => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Tilgungsplan_${options.customerName?.replace(/\s+/g, '_') || 'Kunde'}_${timestamp}.csv`;

    const headers = [
        'Jahr',
        'Restschuld (EUR)',
        'Tilgung (EUR)',
        'Zinsen (EUR)',
        'Kumulative Tilgung (EUR)',
        'Kumulative Zinsen (EUR)',
        'Fortschritt (%)'
    ];

    const rows = options.result.chartData.map(entry => [
        entry.year,
        entry.remainingDebt.toFixed(2),
        entry.yearlyPrincipal.toFixed(2),
        entry.yearlyInterest.toFixed(2),
        entry.cumulativePrincipal.toFixed(2),
        entry.cumulativeInterest.toFixed(2),
        entry.progress.toFixed(2)
    ]);

    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');

    // Add BOM for Excel UTF-8 support
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
};
