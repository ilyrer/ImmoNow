import ExcelJS from 'exceljs';
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
const styleWorksheet = (worksheet: ExcelJS.Worksheet) => {
  // Header-Stil für die erste Zeile
  const headerRow = worksheet.getRow(1);
  headerRow.height = 20;
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6F3FF' }
  };
  
  // Spaltenbreiten setzen
  worksheet.columns = [
    { width: 25 }, // Parameter/Jahr
    { width: 15 }, // Wert/Rate
    { width: 15 }, // Einheit/Zinsen
    { width: 15 }, // Tilgung
    { width: 15 }, // Restschuld
    { width: 15 }, // Kumuliert
    { width: 15 }, // Kumuliert
    { width: 12 }  // Fortschritt
  ];
};

// Haupt-Excel Export Funktion
export const generateFinancingExcel = async (params: ExcelExportParams): Promise<void> => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Workbook Properties setzen
    workbook.creator = 'ImmoNow by cryvenix';
    workbook.lastModifiedBy = 'ImmoNow by cryvenix';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.title = 'Finanzierungsplan ImmoNow by cryvenix';
    workbook.subject = 'Immobilienfinanzierung';
    
    // 1. Übersicht Sheet
    const overviewSheet = workbook.addWorksheet('Übersicht');
    const overviewData = createOverviewData(params);
    const parameterData = createParameterData(params);
    const combinedOverview = [...overviewData, { Parameter: '', Wert: '', Einheit: '' }, ...parameterData];
    
    // Headers hinzufügen
    overviewSheet.addRow(['Parameter', 'Wert', 'Einheit']);
    
    // Daten hinzufügen
    combinedOverview.forEach(row => {
      overviewSheet.addRow([row.Parameter, row.Wert, row.Einheit]);
    });
    
    styleWorksheet(overviewSheet);
    
    // 2. Jährlicher Tilgungsplan Sheet
    const yearlySheet = workbook.addWorksheet('Tilgungsplan (jährlich)');
    const yearlyData = createYearlyScheduleData(params.results);
    
    // Headers hinzufügen
    const yearlyHeaders = Object.keys(yearlyData[0] || {});
    yearlySheet.addRow(yearlyHeaders);
    
    // Daten hinzufügen
    yearlyData.forEach(row => {
      yearlySheet.addRow(Object.values(row));
    });
    
    styleWorksheet(yearlySheet);
    
    // 3. Monatlicher Tilgungsplan Sheet (nur bei Laufzeiten bis 30 Jahre)
    if (params.results.amortizationSchedule.length <= 360) {
      const monthlySheet = workbook.addWorksheet('Tilgungsplan (monatlich)');
      const monthlyData = createMonthlyScheduleData(params.results);
      
      // Headers hinzufügen
      const monthlyHeaders = Object.keys(monthlyData[0] || {});
      monthlySheet.addRow(monthlyHeaders);
      
      // Daten hinzufügen
      monthlyData.forEach(row => {
        monthlySheet.addRow(Object.values(row));
      });
      
      styleWorksheet(monthlySheet);
    }
    
    // 4. Zusammenfassung Sheet
    const summarySheet = workbook.addWorksheet('Zusammenfassung');
    const summaryData = [
      { Kategorie: 'Finanzierung', Betrag: params.results.loanAmount, Anteil: ((params.results.loanAmount / params.results.totalCost) * 100).toFixed(1) + '%' },
      { Kategorie: 'Zinsen', Betrag: params.results.totalInterest, Anteil: ((params.results.totalInterest / params.results.totalCost) * 100).toFixed(1) + '%' },
      { Kategorie: 'Eigenkapital', Betrag: params.equity, Anteil: ((params.equity / params.results.totalCost) * 100).toFixed(1) + '%' },
      { Kategorie: 'Nebenkosten', Betrag: params.additionalCosts, Anteil: ((params.additionalCosts / params.results.totalCost) * 100).toFixed(1) + '%' }
    ];
    
    // Headers hinzufügen
    summarySheet.addRow(['Kategorie', 'Betrag', 'Anteil']);
    
    // Daten hinzufügen
    summaryData.forEach(row => {
      summarySheet.addRow([row.Kategorie, row.Betrag, row.Anteil]);
    });
    
    styleWorksheet(summarySheet);
    
    // Excel-Datei speichern
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Finanzierungsplan_ImmoNow_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Fehler beim Excel-Export:', error);
    throw new Error('Excel-Datei konnte nicht erstellt werden');
  }
}; 
