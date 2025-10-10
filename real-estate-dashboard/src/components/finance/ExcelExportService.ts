import * as XLSX from 'xlsx';
import { FinancingResult, formatCurrency } from './PDFExportService';

// Interface für Excel-Export Parameter
export interface ExcelExportParams {
  results: FinancingResult;
  propertyPrice: number;
  equity: number;
  interestRate: number;
  loanTerm: number;
  additionalCosts: number;
  includeInsurance: boolean;
  insuranceRate: number;
  includeRepayment: boolean;
  repaymentAmount: number;
  maintenanceRate: number;
}

// Übersichtsdaten für Excel erstellen
const createOverviewData = (params: ExcelExportParams) => {
  const { results, propertyPrice, equity, interestRate, loanTerm, additionalCosts } = params;
  
  return [
    { Parameter: 'Kaufpreis', Wert: propertyPrice, Einheit: 'EUR' },
    { Parameter: 'Eigenkapital', Wert: equity, Einheit: 'EUR' },
    { Parameter: 'Eigenkapitalquote', Wert: ((equity / propertyPrice) * 100).toFixed(1), Einheit: '%' },
    { Parameter: 'Darlehenssumme', Wert: results.loanAmount, Einheit: 'EUR' },
    { Parameter: 'Zinssatz', Wert: interestRate, Einheit: '%' },
    { Parameter: 'Laufzeit', Wert: loanTerm, Einheit: 'Jahre' },
    { Parameter: 'Nebenkosten', Wert: additionalCosts, Einheit: 'EUR' },
    { Parameter: '', Wert: '', Einheit: '' }, // Leerzeile
    { Parameter: 'ERGEBNISSE', Wert: '', Einheit: '' },
    { Parameter: 'Monatliche Rate', Wert: results.monthlyPayment, Einheit: 'EUR' },
    { Parameter: 'Gesamtzinsen', Wert: results.totalInterest, Einheit: 'EUR' },
    { Parameter: 'Gesamtkosten', Wert: results.totalCost, Einheit: 'EUR' },
    { Parameter: 'Zinsanteil', Wert: ((results.totalInterest / results.totalCost) * 100).toFixed(1), Einheit: '%' }
  ];
};

// Jährlicher Tilgungsplan für Excel
const createYearlyScheduleData = (results: FinancingResult) => {
  return results.chartData.map((row, index) => {
    const yearlyInterest = index === 0 ? 0 : (results.chartData[index].cumulativeInterest - (results.chartData[index - 1]?.cumulativeInterest || 0));
    const yearlyPrincipal = index === 0 ? 0 : (results.chartData[index].cumulativePrincipal - (results.chartData[index - 1]?.cumulativePrincipal || 0));
    const progressPercent = ((results.loanAmount - row.remainingDebt) / results.loanAmount) * 100;
    
    return {
      Jahr: row.year,
      'Monatliche Rate (EUR)': results.monthlyPayment,
      'Zinsen Jahr (EUR)': yearlyInterest,
      'Tilgung Jahr (EUR)': yearlyPrincipal,
      'Restschuld (EUR)': row.remainingDebt,
      'Zinsen kumuliert (EUR)': row.cumulativeInterest,
      'Tilgung kumuliert (EUR)': row.cumulativePrincipal,
      'Fortschritt (%)': progressPercent.toFixed(1)
    };
  });
};

// Monatlicher Tilgungsplan für Excel (begrenzt auf max 360 Monate)
const createMonthlyScheduleData = (results: FinancingResult) => {
  return results.amortizationSchedule.slice(0, 360).map(row => ({
    Monat: row.month,
    Jahr: row.year,
    'Monatliche Rate (EUR)': row.monthlyPayment,
    'Zinsen (EUR)': row.interest,
    'Tilgung (EUR)': row.principal,
    'Restschuld (EUR)': row.remainingDebt,
    'Zinsen kumuliert (EUR)': row.cumulativeInterest,
    'Tilgung kumuliert (EUR)': row.cumulativePrincipal
  }));
};

// Zusätzliche Parameter für Excel
const createParameterData = (params: ExcelExportParams) => {
  return [
    { Parameter: 'ZUSÄTZLICHE EINSTELLUNGEN', Wert: '', Einheit: '' },
    { Parameter: 'Gebäudeversicherung', Wert: params.includeInsurance ? 'Ja' : 'Nein', Einheit: '' },
    { Parameter: 'Versicherungsrate', Wert: params.includeInsurance ? params.insuranceRate : 0, Einheit: '% p.a.' },
    { Parameter: 'Sondertilgung', Wert: params.includeRepayment ? 'Ja' : 'Nein', Einheit: '' },
    { Parameter: 'Sondertilgungsbetrag', Wert: params.includeRepayment ? params.repaymentAmount : 0, Einheit: 'EUR/Jahr' },
    { Parameter: 'Instandhaltungsrate', Wert: params.maintenanceRate, Einheit: '% p.a.' }
  ];
};

// Styling für Excel-Worksheets
const styleWorksheet = (worksheet: XLSX.WorkSheet, range: string) => {
  // Header-Stil für die erste Zeile
  if (!worksheet['!rows']) worksheet['!rows'] = [];
  worksheet['!rows'][0] = { hpt: 20, hpx: 20 };
  
  // Spaltenbreiten setzen
  const colWidths = [
    { wch: 25 }, // Parameter/Jahr
    { wch: 15 }, // Wert/Rate
    { wch: 15 }, // Einheit/Zinsen
    { wch: 15 }, // Tilgung
    { wch: 15 }, // Restschuld
    { wch: 15 }, // Kumuliert
    { wch: 15 }, // Kumuliert
    { wch: 12 }  // Fortschritt
  ];
  worksheet['!cols'] = colWidths.slice(0, Object.keys(worksheet).filter(key => key.match(/^[A-Z]/)).length);
};

// Haupt-Excel Export Funktion
export const generateFinancingExcel = async (params: ExcelExportParams): Promise<void> => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // 1. Übersicht Sheet
    const overviewData = createOverviewData(params);
    const parameterData = createParameterData(params);
    const combinedOverview = [...overviewData, { Parameter: '', Wert: '', Einheit: '' }, ...parameterData];
    
    const overviewSheet = XLSX.utils.json_to_sheet(combinedOverview);
    styleWorksheet(overviewSheet, 'A1:C20');
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Übersicht');
    
    // 2. Jährlicher Tilgungsplan Sheet
    const yearlyData = createYearlyScheduleData(params.results);
    const yearlySheet = XLSX.utils.json_to_sheet(yearlyData);
    styleWorksheet(yearlySheet, `A1:H${yearlyData.length + 1}`);
    XLSX.utils.book_append_sheet(workbook, yearlySheet, 'Tilgungsplan (jährlich)');
    
    // 3. Monatlicher Tilgungsplan Sheet (nur bei Laufzeiten bis 30 Jahre)
    if (params.results.amortizationSchedule.length <= 360) {
      const monthlyData = createMonthlyScheduleData(params.results);
      const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
      styleWorksheet(monthlySheet, `A1:H${monthlyData.length + 1}`);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Tilgungsplan (monatlich)');
    }
    
    // 4. Zusammenfassung Sheet
    const summaryData = [
      { Kategorie: 'Finanzierung', Betrag: params.results.loanAmount, Anteil: ((params.results.loanAmount / params.results.totalCost) * 100).toFixed(1) + '%' },
      { Kategorie: 'Zinsen', Betrag: params.results.totalInterest, Anteil: ((params.results.totalInterest / params.results.totalCost) * 100).toFixed(1) + '%' },
      { Kategorie: 'Eigenkapital', Betrag: params.equity, Anteil: ((params.equity / params.results.totalCost) * 100).toFixed(1) + '%' },
      { Kategorie: 'Nebenkosten', Betrag: params.additionalCosts, Anteil: ((params.additionalCosts / params.results.totalCost) * 100).toFixed(1) + '%' }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    styleWorksheet(summarySheet, 'A1:C5');
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Zusammenfassung');
    
    // Workbook Properties setzen
    workbook.Props = {
      Title: 'Finanzierungsplan ImmoNow by cryvenix',
      Subject: 'Immobilienfinanzierung',
      Author: 'ImmoNow by cryvenix',
      CreatedDate: new Date()
    };
    
    // Excel-Datei speichern
    XLSX.writeFile(workbook, `Finanzierungsplan_ImmoNow_${new Date().toISOString().split('T')[0]}.xlsx`);
    
  } catch (error) {
    console.error('Fehler beim Excel-Export:', error);
    throw new Error('Excel-Datei konnte nicht erstellt werden');
  }
}; 
