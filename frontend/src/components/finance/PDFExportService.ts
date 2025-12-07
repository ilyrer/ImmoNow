import jsPDF from 'jspdf';
import 'jspdf-autotable';

// TypeScript Interface für Finanzierungsergebnisse
export interface FinancingResult {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  loanAmount: number;
  monthlyInterest: number;
  monthlyPrincipal: number;
  amortizationSchedule: {
    month: number;
    year: number;
    monthlyPayment: number;
    interest: number;
    principal: number;
    remainingDebt: number;
    cumulativeInterest: number;
    cumulativePrincipal: number;
  }[];
  chartData: {
    year: number;
    remainingDebt: number;
    cumulativeInterest: number;
    cumulativePrincipal: number;
  }[];
}

// Interface für PDF-Export Parameter
export interface PDFExportParams {
  results: FinancingResult;
  propertyPrice: number;
  equity: number;
  interestRate: number;
  loanTerm: number;
  additionalCosts: number;
}

// Utility-Funktionen für Formatierung
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

// Erweiterte jsPDF-Typen für autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Ultra-moderne Farbpalette
const COLORS = {
  // Primäre Farben
  primary: [34, 139, 235],      // Lebendiges Blau
  secondary: [20, 184, 166],    // Modernes Teal
  accent: [99, 102, 241],       // Indigo
  
  // Neutrale Farben
  dark: [15, 23, 42],           // Sehr dunkles Navy
  gray: [71, 85, 105],          // Mittleres Grau
  lightGray: [248, 250, 252],   // Ultra-helles Grau
  
  // Status Farben
  success: [16, 185, 129],      // Grün
  warning: [245, 158, 11],      // Amber
  error: [239, 68, 68],         // Rot
  
  // Weiß
  white: [255, 255, 255]
};

// Logo-Loading Funktion mit besserer Fehlerbehandlung
const loadLogo = async (): Promise<string | null> => {
  try {
    const response = await fetch('/logo/logo-removebg-preview.png');
    if (!response.ok) throw new Error('Logo nicht gefunden');
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null); // Fallback statt reject
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Logo konnte nicht geladen werden:', error);
    return null;
  }
};

// Vereinfachter Gradient-Hintergrund
const addGradientBackground = (doc: jsPDF, startColor: number[], endColor: number[], x: number, y: number, width: number, height: number) => {
  try {
    // Vereinfachter Gradient durch weniger Schritte
    const steps = 10;
    const stepHeight = height / steps;
    
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * ratio);
      const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * ratio);
      const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * ratio);
      
      doc.setFillColor(r, g, b);
      doc.rect(x, y + i * stepHeight, width, stepHeight + 1, 'F');
    }
  } catch (error) {
    // Fallback: Einfache Farbe
    doc.setFillColor(startColor[0], startColor[1], startColor[2]);
    doc.rect(x, y, width, height, 'F');
  }
};

// Vereinfachter moderner Header
const createModernHeader = async (doc: jsPDF): Promise<void> => {
  try {
    // Einfacher Hintergrund
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.rect(0, 0, 210, 50, 'F');
    
    // Logo laden und einbetten
    const logoData = await loadLogo();
    if (logoData) {
      try {
        doc.addImage(logoData, 'PNG', 25, 15, 30, 30);
      } catch (error) {
        console.warn('Logo konnte nicht eingefügt werden:', error);
        // Fallback: Text-Logo
        doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
        doc.rect(25, 15, 30, 30, 'F');
        doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('LOGO', 35, 35);
      }
    } else {
      // Fallback: Text-Logo
      doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
      doc.rect(25, 15, 30, 30, 'F');
      doc.setTextColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('LOGO', 35, 35);
    }
    
    // Firmenname
    doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('ImmoNow', 70, 28);
    
    // Tagline
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.secondary[0], COLORS.secondary[1], COLORS.secondary[2]);
    doc.text('by cryvenix', 70, 38);
    
  } catch (error) {
    console.error('Fehler beim Header erstellen:', error);
    // Minimaler Fallback-Header
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.rect(0, 0, 210, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ImmoNow by cryvenix', 25, 30);
  }
};

// Vereinfachte Titel-Sektion
const createModernTitle = (doc: jsPDF): void => {
  try {
    const yPos = 65;
    
    // Hintergrund
    doc.setFillColor(COLORS.lightGray[0], COLORS.lightGray[1], COLORS.lightGray[2]);
    doc.rect(20, yPos, 170, 30, 'F');
    
    // Haupttitel
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANZIERUNGSPLAN', 30, yPos + 20);
    
    // Datum
    const currentDate = new Date().toLocaleDateString('de-DE');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Erstellt am: ${currentDate}`, 130, yPos + 20);
    
  } catch (error) {
    console.error('Fehler beim Titel erstellen:', error);
  }
};

// Vereinfachte Karten
const createModernCards = (doc: jsPDF, params: PDFExportParams): void => {
  try {
    const { results, propertyPrice, equity, interestRate, loanTerm, additionalCosts } = params;
    let yPos = 105;
    
    // Section Header
    doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANZIERUNGSÜBERSICHT', 25, yPos);
    
    yPos += 15;
    
    // Einfache Karten-Funktion
    const createSimpleCard = (x: number, y: number, width: number, height: number, title: string, items: Array<{label: string, value: string}>) => {
      try {
        // Card Background
        doc.setFillColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
        doc.rect(x, y, width, height, 'F');
        
        // Card Border
        doc.setDrawColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
        doc.setLineWidth(0.5);
        doc.rect(x, y, width, height, 'S');
        
        // Title
        doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(title, x + 5, y + 12);
        
        // Items
        let itemY = y + 22;
        items.forEach(item => {
          // Label
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
          doc.text(item.label, x + 5, itemY);
          
          // Value
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(COLORS.dark[0], COLORS.dark[1], COLORS.dark[2]);
          const valueWidth = doc.getTextWidth(item.value);
          doc.text(item.value, x + width - 5 - valueWidth, itemY);
          
          itemY += 8;
        });
      } catch (error) {
        console.error('Fehler beim Erstellen der Karte:', error);
      }
    };
    
    // Investment Card
    const investmentItems = [
      { label: 'Kaufpreis:', value: formatCurrency(propertyPrice) },
      { label: 'Eigenkapital:', value: formatCurrency(equity) },
      { label: 'Zinssatz:', value: formatPercent(interestRate) },
      { label: 'Laufzeit:', value: `${loanTerm} Jahre` },
      { label: 'Nebenkosten:', value: formatCurrency(additionalCosts) }
    ];
    
    createSimpleCard(25, yPos, 80, 50, 'INVESTITION', investmentItems);
    
    // Finanzierung Card
    const financingItems = [
      { label: 'Darlehenssumme:', value: formatCurrency(results.loanAmount) },
      { label: 'Monatliche Rate:', value: formatCurrency(results.monthlyPayment) },
      { label: 'Gesamtzinsen:', value: formatCurrency(results.totalInterest) },
      { label: 'Gesamtkosten:', value: formatCurrency(results.totalCost) }
    ];
    
    createSimpleCard(115, yPos, 80, 50, 'FINANZIERUNG', financingItems);
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Karten:', error);
  }
};

// Vereinfachte Tilgungsplan-Seite
const createModernAmortizationPage = (doc: jsPDF, results: FinancingResult): void => {
  try {
    doc.addPage();
    
    // Header für zweite Seite
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(COLORS.white[0], COLORS.white[1], COLORS.white[2]);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('TILGUNGSPLAN', 25, 25);
    
    // Tabellendaten vorbereiten
    const tableData = results.chartData.map((row, index) => {
      const yearlyInterest = index === 0 ? 0 : (results.chartData[index].cumulativeInterest - (results.chartData[index - 1]?.cumulativeInterest || 0));
      const yearlyPrincipal = index === 0 ? 0 : (results.chartData[index].cumulativePrincipal - (results.chartData[index - 1]?.cumulativePrincipal || 0));
      const progressPercent = ((results.loanAmount - row.remainingDebt) / results.loanAmount) * 100;
      
      return [
        row.year.toString(),
        formatCurrency(results.monthlyPayment),
        formatCurrency(yearlyInterest),
        formatCurrency(yearlyPrincipal),
        formatCurrency(row.remainingDebt),
        `${progressPercent.toFixed(1)}%`
      ];
    });
    
    // AutoTable mit Fehlerbehandlung
    try {
      doc.autoTable({
        head: [['Jahr', 'Monatliche Rate', 'Zinsen (Jahr)', 'Tilgung (Jahr)', 'Restschuld', 'Fortschritt']],
        body: tableData,
        startY: 50,
        theme: 'grid',
        headStyles: {
          fillColor: COLORS.primary,
          textColor: COLORS.white,
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3
        },
        columnStyles: {
          0: { halign: 'center', fontStyle: 'bold' },
          1: { halign: 'right' },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'center' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { top: 50, left: 20, right: 20 }
      });
    } catch (tableError) {
      console.error('Fehler bei autoTable:', tableError);
      // Fallback: Einfache Tabelle ohne autoTable
      let yPos = 60;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Jahr | Monatliche Rate | Zinsen | Tilgung | Restschuld', 25, yPos);
      
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      tableData.forEach(row => {
        doc.text(row.join(' | '), 25, yPos);
        yPos += 8;
        if (yPos > 280) return; // Seitenende
      });
    }
    
  } catch (error) {
    console.error('Fehler beim Erstellen der Tilgungsplan-Seite:', error);
  }
};

// Vereinfachter Footer
const createModernFooter = (doc: jsPDF): void => {
  try {
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer Text
      doc.setTextColor(COLORS.gray[0], COLORS.gray[1], COLORS.gray[2]);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('ImmoNow by cryvenix | Finanzierungsberatung | Alle Angaben ohne Gewähr', 25, 285);
      
      // Seitenzahl
      doc.setFont('helvetica', 'bold');
      doc.text(`Seite ${i} von ${pageCount}`, 170, 285);
    }
  } catch (error) {
    console.error('Fehler beim Footer erstellen:', error);
  }
};

// Haupt-Export Funktion mit umfassender Fehlerbehandlung
export const generateFinancingPDF = async (params: PDFExportParams): Promise<void> => {
  let doc: jsPDF;
  
  try {
    // PDF-Dokument erstellen
    doc = new jsPDF();
    
    // Seite 1: Übersicht
    await createModernHeader(doc);
    createModernTitle(doc);
    createModernCards(doc, params);
    
    // Seite 2: Tilgungsplan
    createModernAmortizationPage(doc, params.results);
    
    // Footer
    createModernFooter(doc);
    
    // PDF speichern
    const filename = `Finanzierungsplan_ImmoNow_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
  } catch (error) {
    console.error('Fehler beim PDF-Export:', error);
    
    // Fallback: Minimales PDF erstellen
    try {
      doc = new jsPDF();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ImmoNow Finanzierungsplan', 20, 30);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Kaufpreis: ${formatCurrency(params.propertyPrice)}`, 20, 50);
      doc.text(`Eigenkapital: ${formatCurrency(params.equity)}`, 20, 60);
      doc.text(`Darlehenssumme: ${formatCurrency(params.results.loanAmount)}`, 20, 70);
      doc.text(`Monatliche Rate: ${formatCurrency(params.results.monthlyPayment)}`, 20, 80);
      doc.text(`Gesamtzinsen: ${formatCurrency(params.results.totalInterest)}`, 20, 90);
      
      doc.save(`Finanzierungsplan_Fallback_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (fallbackError) {
      console.error('Auch Fallback-PDF fehlgeschlagen:', fallbackError);
      throw new Error('PDF konnte nicht erstellt werden. Bitte versuchen Sie es erneut.');
    }
  }
}; 
