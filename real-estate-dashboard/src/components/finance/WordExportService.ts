/**
 * Professional Word Document Export Service
 * Generates banking-grade financing offers in .docx format
 */

import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableCell, 
  TableRow,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeadingLevel,
  convertInchesToTwip,
  PageBreak,
  HorizontalPositionAlign,
  VerticalPositionAlign
} from 'docx';
import { saveAs } from 'file-saver';
import { FinancingResult } from './PDFExportService';
import { BankOffer, BankComparisonResult } from '../../types/finance';

export interface WordExportParams {
  results: FinancingResult;
  propertyPrice: number;
  equity: number;
  interestRate: number;
  loanTerm: number;
  additionalCosts: number;
  includeInsurance?: boolean;
  insuranceRate?: number;
  includeRepayment?: boolean;
  repaymentAmount?: number;
  maintenanceRate?: number;
  customerName?: string;
  propertyAddress?: string;
  bankName?: string;
  // Bank comparison data
  bankComparison?: BankComparisonResult;
}

/**
 * Format currency for display
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Format percentage for display
 */
const formatPercent = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

/**
 * Create a styled header paragraph
 */
const createHeader = (text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel] = HeadingLevel.HEADING_1): Paragraph => {
  return new Paragraph({
    text,
    heading: level,
    spacing: {
      before: 400,
      after: 200
    },
    thematicBreak: level === HeadingLevel.HEADING_1
  });
};

/**
 * Create a professional table cell
 */
const createTableCell = (
  text: string, 
  options: {
    bold?: boolean;
    alignment?: typeof AlignmentType[keyof typeof AlignmentType];
    width?: number;
    shading?: string;
  } = {}
): TableCell => {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            bold: options.bold || false,
            font: 'Calibri',
            size: 22
          })
        ],
        alignment: options.alignment || AlignmentType.LEFT
      })
    ],
    width: options.width ? { size: options.width, type: WidthType.PERCENTAGE } : undefined,
    shading: options.shading ? { fill: options.shading } : undefined,
    margins: {
      top: convertInchesToTwip(0.08),
      bottom: convertInchesToTwip(0.08),
      left: convertInchesToTwip(0.15),
      right: convertInchesToTwip(0.15)
    }
  });
};

/**
 * Generate professional Word document
 */
export const generateFinancingWord = async (params: WordExportParams): Promise<void> => {
  const {
    results,
    propertyPrice,
    equity,
    interestRate,
    loanTerm,
    additionalCosts,
    includeInsurance = false,
    insuranceRate = 0,
    includeRepayment = false,
    repaymentAmount = 0,
    maintenanceRate = 0,
    customerName = 'Kunde',
    propertyAddress = 'Immobilienadresse',
    bankName = 'ImmoNow Finanzberatung'
  } = params;

  const today = new Date().toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // ==================== DOCUMENT STRUCTURE ====================
  const doc = new Document({
    creator: bankName,
    title: `Finanzierungsangebot für ${customerName}`,
    description: 'Professionelles Finanzierungsangebot für Immobilienerwerb',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1)
            }
          }
        },
        children: [
          // ==================== TITLE PAGE ====================
          new Paragraph({
            children: [
              new TextRun({
                text: bankName,
                bold: true,
                size: 32,
                font: 'Calibri',
                color: '1F4788'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 1000, after: 400 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'FINANZIERUNGSANGEBOT',
                bold: true,
                size: 48,
                font: 'Calibri',
                color: '2C5AA0'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Immobilienfinanzierung',
                size: 28,
                font: 'Calibri',
                color: '666666'
              })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 1200 }
          }),

          // Customer & Property Info Box
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('Kunde:', { bold: true, width: 30, shading: 'E8F0FA' }),
                  createTableCell(customerName, { width: 70 })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Immobilie:', { bold: true, width: 30, shading: 'E8F0FA' }),
                  createTableCell(propertyAddress, { width: 70 })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Datum:', { bold: true, width: 30, shading: 'E8F0FA' }),
                  createTableCell(today, { width: 70 })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Berater:', { bold: true, width: 30, shading: 'E8F0FA' }),
                  createTableCell(bankName, { width: 70 })
                ]
              })
            ]
          }),

          new Paragraph({
            children: [new PageBreak()]
          }),

          // ==================== EXECUTIVE SUMMARY ====================
          createHeader('ZUSAMMENFASSUNG', HeadingLevel.HEADING_1),

          new Paragraph({
            children: [
              new TextRun({
                text: 'Sehr geehrte Damen und Herren,\n\n',
                size: 24,
                font: 'Calibri'
              }),
              new TextRun({
                text: 'auf Basis Ihrer Angaben haben wir eine umfassende Finanzierungsanalyse für den geplanten Immobilienerwerb erstellt. Nachfolgend finden Sie die detaillierte Aufschlüsselung aller relevanten Finanzierungsparameter.\n\n',
                size: 24,
                font: 'Calibri'
              })
            ],
            spacing: { after: 400 }
          }),

          // Key Metrics Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('KENNZAHL', { bold: true, shading: '1F4788', alignment: AlignmentType.LEFT }),
                  createTableCell('WERT', { bold: true, shading: '1F4788', alignment: AlignmentType.RIGHT })
                ],
                tableHeader: true
              }),
              new TableRow({
                children: [
                  createTableCell('Monatliche Belastung', { bold: true }),
                  createTableCell(formatCurrency(results.monthlyPayment), { bold: true, alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Darlehenssumme', {}),
                  createTableCell(formatCurrency(results.loanAmount), { alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Eigenkapitalquote', {}),
                  createTableCell(formatPercent((equity / propertyPrice) * 100), { alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Zinssatz (nominal)', {}),
                  createTableCell(formatPercent(interestRate), { alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Laufzeit', {}),
                  createTableCell(`${loanTerm} Jahre`, { alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Gesamtkosten', { bold: true, shading: 'FFF4E6' }),
                  createTableCell(formatCurrency(results.totalCost), { bold: true, alignment: AlignmentType.RIGHT, shading: 'FFF4E6' })
                ]
              })
            ]
          }),

          new Paragraph({
            children: [new PageBreak()]
          }),

          // ==================== DETAILED BREAKDOWN ====================
          createHeader('DETAILLIERTE KOSTENAUFSTELLUNG', HeadingLevel.HEADING_1),

          createHeader('1. Kaufpreis & Nebenkosten', HeadingLevel.HEADING_2),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('POSITION', { bold: true, shading: 'E8F0FA' }),
                  createTableCell('BETRAG', { bold: true, shading: 'E8F0FA', alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Kaufpreis Immobilie', {}),
                  createTableCell(formatCurrency(propertyPrice), { alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Erwerbsnebenkosten (Notar, Grunderwerbsteuer, ggf. Makler)', {}),
                  createTableCell(formatCurrency(additionalCosts), { alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('GESAMTINVESTITION', { bold: true, shading: 'FFF4E6' }),
                  createTableCell(formatCurrency(propertyPrice + additionalCosts), { bold: true, alignment: AlignmentType.RIGHT, shading: 'FFF4E6' })
                ]
              })
            ]
          }),

          createHeader('2. Finanzierungsstruktur', HeadingLevel.HEADING_2),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('POSITION', { bold: true, shading: 'E8F0FA' }),
                  createTableCell('BETRAG', { bold: true, shading: 'E8F0FA', alignment: AlignmentType.RIGHT }),
                  createTableCell('ANTEIL', { bold: true, shading: 'E8F0FA', alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Eigenkapital', {}),
                  createTableCell(formatCurrency(equity), { alignment: AlignmentType.RIGHT }),
                  createTableCell(formatPercent((equity / (propertyPrice + additionalCosts)) * 100), { alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Fremdkapital (Darlehen)', {}),
                  createTableCell(formatCurrency(results.loanAmount), { alignment: AlignmentType.RIGHT }),
                  createTableCell(formatPercent((results.loanAmount / (propertyPrice + additionalCosts)) * 100), { alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('GESAMT', { bold: true, shading: 'FFF4E6' }),
                  createTableCell(formatCurrency(equity + results.loanAmount), { bold: true, alignment: AlignmentType.RIGHT, shading: 'FFF4E6' }),
                  createTableCell('100.00%', { bold: true, alignment: AlignmentType.RIGHT, shading: 'FFF4E6' })
                ]
              })
            ]
          }),

          createHeader('3. Monatliche Belastung', HeadingLevel.HEADING_2),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('KOSTENPOSITION', { bold: true, shading: 'E8F0FA' }),
                  createTableCell('MONATLICH', { bold: true, shading: 'E8F0FA', alignment: AlignmentType.RIGHT }),
                  createTableCell('JÄHRLICH', { bold: true, shading: 'E8F0FA', alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Tilgung & Zinsen', {}),
                  createTableCell(
                    formatCurrency(results.monthlyPayment - (results.monthlyInterest || 0) - (results.monthlyPrincipal || 0)), 
                    { alignment: AlignmentType.RIGHT }
                  ),
                  createTableCell(
                    formatCurrency((results.monthlyPayment - (results.monthlyInterest || 0) - (results.monthlyPrincipal || 0)) * 12), 
                    { alignment: AlignmentType.RIGHT }
                  )
                ]
              }),
              ...(includeInsurance ? [
                new TableRow({
                  children: [
                    createTableCell('Gebäudeversicherung', {}),
                    createTableCell(formatCurrency(results.monthlyInterest || 0), { alignment: AlignmentType.RIGHT }),
                    createTableCell(formatCurrency((results.monthlyInterest || 0) * 12), { alignment: AlignmentType.RIGHT })
                  ]
                })
              ] : []),
              new TableRow({
                children: [
                  createTableCell('Instandhaltungsrücklage', {}),
                  createTableCell(formatCurrency(results.monthlyPrincipal || 0), { alignment: AlignmentType.RIGHT }),
                  createTableCell(formatCurrency((results.monthlyPrincipal || 0) * 12), { alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('GESAMTBELASTUNG', { bold: true, shading: 'FFF4E6' }),
                  createTableCell(formatCurrency(results.monthlyPayment), { bold: true, alignment: AlignmentType.RIGHT, shading: 'FFF4E6' }),
                  createTableCell(formatCurrency(results.monthlyPayment * 12), { bold: true, alignment: AlignmentType.RIGHT, shading: 'FFF4E6' })
                ]
              })
            ]
          }),

          new Paragraph({
            children: [new PageBreak()]
          }),

          // ==================== AMORTIZATION SCHEDULE ====================
          createHeader('TILGUNGSPLAN (JAHRESÜBERSICHT)', HeadingLevel.HEADING_1),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('JAHR', { bold: true, shading: '1F4788', width: 10 }),
                  createTableCell('RATE/MONAT', { bold: true, shading: '1F4788', alignment: AlignmentType.RIGHT, width: 18 }),
                  createTableCell('ZINSEN/JAHR', { bold: true, shading: '1F4788', alignment: AlignmentType.RIGHT, width: 18 }),
                  createTableCell('TILGUNG/JAHR', { bold: true, shading: '1F4788', alignment: AlignmentType.RIGHT, width: 18 }),
                  createTableCell('RESTSCHULD', { bold: true, shading: '1F4788', alignment: AlignmentType.RIGHT, width: 18 }),
                  createTableCell('FORTSCHRITT', { bold: true, shading: '1F4788', alignment: AlignmentType.RIGHT, width: 18 })
                ],
                tableHeader: true
              }),
              ...results.chartData.slice(0, Math.min(20, results.chartData.length)).map((row, index) => {
                const yearlyInterest = index === 0 ? 0 : (results.chartData[index].cumulativeInterest - (results.chartData[index - 1]?.cumulativeInterest || 0));
                const yearlyPrincipal = index === 0 ? 0 : (results.chartData[index].cumulativePrincipal - (results.chartData[index - 1]?.cumulativePrincipal || 0));
                const progressPercent = ((results.loanAmount - row.remainingDebt) / results.loanAmount) * 100;
                
                return new TableRow({
                  children: [
                    createTableCell(row.year.toString(), { bold: true }),
                    createTableCell(formatCurrency(results.monthlyPayment), { alignment: AlignmentType.RIGHT }),
                    createTableCell(formatCurrency(yearlyInterest), { alignment: AlignmentType.RIGHT }),
                    createTableCell(formatCurrency(yearlyPrincipal), { alignment: AlignmentType.RIGHT }),
                    createTableCell(formatCurrency(row.remainingDebt), { alignment: AlignmentType.RIGHT }),
                    createTableCell(formatPercent(progressPercent), { alignment: AlignmentType.RIGHT })
                  ]
                });
              })
            ]
          }),

          new Paragraph({
            spacing: { before: 400, after: 200 }
          }),

          // ==================== SUMMARY & TOTALS ====================
          createHeader('GESAMTÜBERSICHT', HeadingLevel.HEADING_2),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createTableCell('Gesamtzinsen über Laufzeit', { bold: true }),
                  createTableCell(formatCurrency(results.totalInterest), { bold: true, alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Tilgungsbetrag gesamt', { bold: true }),
                  createTableCell(formatCurrency(results.loanAmount), { bold: true, alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('Eigenkapital', { bold: true }),
                  createTableCell(formatCurrency(equity), { bold: true, alignment: AlignmentType.RIGHT })
                ]
              }),
              new TableRow({
                children: [
                  createTableCell('GESAMTAUFWAND', { bold: true, shading: '1F4788' }),
                  createTableCell(formatCurrency(results.totalCost), { bold: true, alignment: AlignmentType.RIGHT, shading: '1F4788' })
                ]
              })
            ]
          }),

          new Paragraph({
            children: [new PageBreak()]
          }),

          // ==================== BANK COMPARISON ====================
          ...(params.bankComparison ? [
            createHeader('BANKENVERGLEICH', HeadingLevel.HEADING_1),

            new Paragraph({
              children: [
                new TextRun({
                  text: 'Die folgende Übersicht zeigt die aktuellen Konditionen verschiedener deutscher Banken für Ihre Finanzierung. ',
                  size: 24,
                  font: 'Calibri'
                }),
                new TextRun({
                  text: 'Bitte beachten Sie, dass die tatsächlichen Konditionen von Ihrer Bonität abhängen können.\n\n',
                  size: 24,
                  font: 'Calibri'
                })
              ],
              spacing: { after: 400 }
            }),

            // Best Offer Highlight
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    createTableCell('BESTE KONDITIONEN', { bold: true, shading: '22C55E' }),
                    createTableCell(params.bankComparison.bestOffer.bankName, { bold: true, shading: '22C55E', alignment: AlignmentType.RIGHT })
                  ]
                }),
                new TableRow({
                  children: [
                    createTableCell('Effektiver Jahreszins', { bold: true }),
                    createTableCell(formatPercent(params.bankComparison.bestOffer.effectiveRate), { bold: true, alignment: AlignmentType.RIGHT })
                  ]
                }),
                new TableRow({
                  children: [
                    createTableCell('Monatliche Rate', {}),
                    createTableCell(formatCurrency(params.bankComparison.bestOffer.monthlyPayment), { alignment: AlignmentType.RIGHT })
                  ]
                }),
                new TableRow({
                  children: [
                    createTableCell('Gesamtkosten', {}),
                    createTableCell(formatCurrency(params.bankComparison.bestOffer.totalCost), { alignment: AlignmentType.RIGHT })
                  ]
                }),
                new TableRow({
                  children: [
                    createTableCell('Ersparnis ggü. Durchschnitt', { bold: true }),
                    createTableCell(formatCurrency(params.bankComparison.potentialSavings || 0), { bold: true, alignment: AlignmentType.RIGHT })
                  ]
                })
              ]
            }),

            new Paragraph({
              spacing: { before: 600, after: 400 }
            }),

            createHeader('Vergleich aller Angebote', HeadingLevel.HEADING_2),

            // All Banks Comparison Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    createTableCell('BANK', { bold: true, shading: '1F4788', width: 25 }),
                    createTableCell('ZINSSATZ', { bold: true, shading: '1F4788', alignment: AlignmentType.RIGHT, width: 15 }),
                    createTableCell('RATE/MONAT', { bold: true, shading: '1F4788', alignment: AlignmentType.RIGHT, width: 20 }),
                    createTableCell('GESAMTKOSTEN', { bold: true, shading: '1F4788', alignment: AlignmentType.RIGHT, width: 20 }),
                    createTableCell('BEARBEITUNGSGEBÜHR', { bold: true, shading: '1F4788', alignment: AlignmentType.RIGHT, width: 20 })
                  ],
                  tableHeader: true
                }),
                ...params.bankComparison.offers.map((offer: BankOffer) => {
                  const isBest = offer.bankName === params.bankComparison!.bestOffer.bankName;
                  return new TableRow({
                    children: [
                      createTableCell(offer.bankName, { bold: isBest, shading: isBest ? 'E8F8F0' : undefined }),
                      createTableCell(formatPercent(offer.effectiveRate), { alignment: AlignmentType.RIGHT, bold: isBest, shading: isBest ? 'E8F8F0' : undefined }),
                      createTableCell(formatCurrency(offer.monthlyPayment), { alignment: AlignmentType.RIGHT, shading: isBest ? 'E8F8F0' : undefined }),
                      createTableCell(formatCurrency(offer.totalCost), { alignment: AlignmentType.RIGHT, shading: isBest ? 'E8F8F0' : undefined }),
                      createTableCell(formatCurrency(offer.processingFee), { alignment: AlignmentType.RIGHT, shading: isBest ? 'E8F8F0' : undefined })
                    ]
                  });
                })
              ]
            }),

            new Paragraph({
              spacing: { before: 600, after: 400 }
            }),

            // Bank Details
            createHeader('Detailinformationen zu den Banken', HeadingLevel.HEADING_2),

            ...params.bankComparison.offers.slice(0, 5).flatMap((offer: BankOffer) => [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `\n${offer.bankName}`,
                    bold: true,
                    size: 26,
                    font: 'Calibri',
                    color: '1F4788'
                  }),
                  new TextRun({
                    text: ` - ${offer.rating}/5 Sterne`,
                    size: 24,
                    font: 'Calibri',
                    color: '666666'
                  })
                ],
                spacing: { before: 300, after: 100 }
              }),

              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      createTableCell('Nominalzins', { width: 40 }),
                      createTableCell(formatPercent(offer.interestRate), { width: 60, alignment: AlignmentType.RIGHT })
                    ]
                  }),
                  new TableRow({
                    children: [
                      createTableCell('Effektivzins', { width: 40 }),
                      createTableCell(formatPercent(offer.effectiveRate), { width: 60, alignment: AlignmentType.RIGHT })
                    ]
                  }),
                  new TableRow({
                    children: [
                      createTableCell('Monatliche Rate', { width: 40 }),
                      createTableCell(formatCurrency(offer.monthlyPayment), { width: 60, alignment: AlignmentType.RIGHT })
                    ]
                  }),
                  new TableRow({
                    children: [
                      createTableCell('Sollzinsbindung', { width: 40 }),
                      createTableCell(`${offer.fixedRatePeriod} Jahre`, { width: 60, alignment: AlignmentType.RIGHT })
                    ]
                  }),
                  new TableRow({
                    children: [
                      createTableCell('Sondertilgung p.a.', { width: 40 }),
                      createTableCell(`${offer.repaymentOptions.specialRepaymentLimit}% kostenlos`, { width: 60, alignment: AlignmentType.RIGHT })
                    ]
                  })
                ]
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: '\nVorteile: ',
                    bold: true,
                    size: 22,
                    font: 'Calibri'
                  }),
                  new TextRun({
                    text: offer.pros.join(', '),
                    size: 22,
                    font: 'Calibri'
                  })
                ],
                spacing: { before: 200, after: 100 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Nachteile: ',
                    bold: true,
                    size: 22,
                    font: 'Calibri'
                  }),
                  new TextRun({
                    text: offer.cons.join(', '),
                    size: 22,
                    font: 'Calibri'
                  })
                ],
                spacing: { after: 300 }
              })
            ]),

            new Paragraph({
              children: [new PageBreak()]
            })
          ] : []),

          // ==================== DISCLAIMER & SIGNATURE ====================
          createHeader('WICHTIGE HINWEISE', HeadingLevel.HEADING_1),

          new Paragraph({
            children: [
              new TextRun({
                text: '• Dieses Angebot ist unverbindlich und dient der ersten Orientierung.\n',
                size: 22,
                font: 'Calibri'
              }),
              new TextRun({
                text: '• Alle Berechnungen erfolgen nach bestem Wissen, ohne Gewähr.\n',
                size: 22,
                font: 'Calibri'
              }),
              new TextRun({
                text: '• Die tatsächlichen Konditionen können je nach Bonität abweichen.\n',
                size: 22,
                font: 'Calibri'
              }),
              new TextRun({
                text: '• Nebenkosten (Notar, Grunderwerbsteuer) variieren je nach Bundesland.\n',
                size: 22,
                font: 'Calibri'
              }),
              new TextRun({
                text: '• Bitte vereinbaren Sie einen Termin für ein persönliches Beratungsgespräch.\n',
                size: 22,
                font: 'Calibri'
              })
            ],
            spacing: { after: 600 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `\n\n${bankName}\n`,
                bold: true,
                size: 24,
                font: 'Calibri'
              }),
              new TextRun({
                text: today,
                size: 22,
                font: 'Calibri',
                color: '666666'
              })
            ],
            spacing: { before: 800 }
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: '\n___________________________________\n',
                size: 22,
                font: 'Calibri'
              }),
              new TextRun({
                text: 'Unterschrift Finanzberater',
                size: 20,
                font: 'Calibri',
                color: '999999'
              })
            ]
          })
        ]
      }
    ]
  });

  // ==================== GENERATE & DOWNLOAD ====================
  const blob = await Packer.toBlob(doc);
  const filename = `Finanzierungsangebot_${customerName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, filename);
};
