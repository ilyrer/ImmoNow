import { pdf, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import React from 'react';

export interface PDFGenerationOptions {
  property: any;
  logoUrl?: string;
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  logo: {
    width: 100,
    height: 100,
    marginRight: 20,
    objectFit: 'contain',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  certificateContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 30,
    marginBottom: 30,
    border: '2px solid #e2e8f0',
  },
  certificateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 20,
  },
  propertyInfo: {
    marginBottom: 25,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  propertyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  propertyLabel: {
    fontSize: 12,
    color: '#6b7280',
    width: '40%',
  },
  propertyValue: {
    fontSize: 12,
    color: '#374151',
    fontWeight: 'bold',
    width: '60%',
  },
  energySection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    border: '1px solid #d1d5db',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 15,
    textAlign: 'center',
  },
  energyGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  energyItem: {
    width: '48%',
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 10,
  },
  energyLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 3,
  },
  energyValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  energyClass: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    textAlign: 'center',
    padding: 15,
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    border: '2px solid #10b981',
    marginBottom: 15,
  },
  certificateDetails: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    border: '1px solid #f59e0b',
  },
  certificateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  certificateLabel: {
    fontSize: 11,
    color: '#92400e',
    width: '40%',
  },
  certificateValue: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: 'bold',
    width: '60%',
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#6b7280',
  },
  generatedDate: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 5,
  },
});

export class PDFService {
  /**
   * Generate Energy Certificate PDF
   */
  static async generateEnergyCertificate(options: PDFGenerationOptions): Promise<Blob> {
    try {
      const { property, logoUrl } = options;
      const currentDate = new Date().toLocaleDateString('de-DE');
      
      // Create PDF document directly
      const doc = React.createElement(Document, null,
        React.createElement(Page, { size: "A4", style: styles.page },
          // Header with Logo
          React.createElement(View, { style: styles.header },
            logoUrl && React.createElement(Image, { style: styles.logo, src: logoUrl }),
            React.createElement(View, { style: styles.headerText },
              React.createElement(Text, { style: styles.title }, "Energieausweis"),
              React.createElement(Text, { style: styles.subtitle }, "Energieeffizienz-Zertifikat")
            )
          ),
          
          // Certificate Container
          React.createElement(View, { style: styles.certificateContainer },
            React.createElement(Text, { style: styles.certificateTitle }, "Energieeffizienz-Zertifikat"),
            
            // Property Information
            React.createElement(View, { style: styles.propertyInfo },
              React.createElement(Text, { style: styles.propertyTitle }, "Immobilien-Details"),
              React.createElement(View, { style: styles.propertyDetails },
                React.createElement(Text, { style: styles.propertyLabel }, "Objekt:"),
                React.createElement(Text, { style: styles.propertyValue }, property.title)
              ),
              property.address && React.createElement(View, { style: styles.propertyDetails },
                React.createElement(Text, { style: styles.propertyLabel }, "Adresse:"),
                React.createElement(Text, { style: styles.propertyValue },
                  `${property.address.street || ''}, ${property.address.zip_code || ''} ${property.address.city || ''}`
                )
              ),
              property.living_area && React.createElement(View, { style: styles.propertyDetails },
                React.createElement(Text, { style: styles.propertyLabel }, "Wohnfläche:"),
                React.createElement(Text, { style: styles.propertyValue }, `${property.living_area} m²`)
              ),
              property.year_built && React.createElement(View, { style: styles.propertyDetails },
                React.createElement(Text, { style: styles.propertyLabel }, "Baujahr:"),
                React.createElement(Text, { style: styles.propertyValue }, property.year_built.toString())
              )
            ),
            
            // Energy Efficiency Section
            React.createElement(View, { style: styles.energySection },
              React.createElement(Text, { style: styles.sectionTitle }, "Energieeffizienz-Bewertung"),
              
              property.energy_class && React.createElement(View, { style: styles.energyClass },
                React.createElement(Text, null, `Energieeffizienzklasse: ${property.energy_class}`)
              ),
              
              React.createElement(View, { style: styles.energyGrid },
                property.energy_consumption && React.createElement(View, { style: styles.energyItem },
                  React.createElement(Text, { style: styles.energyLabel }, "Endenergiebedarf"),
                  React.createElement(Text, { style: styles.energyValue }, `${property.energy_consumption} kWh/(m²·a)`)
                ),
                property.co2_emissions !== undefined && React.createElement(View, { style: styles.energyItem },
                  React.createElement(Text, { style: styles.energyLabel }, "CO₂-Emissionen"),
                  React.createElement(Text, { style: styles.energyValue }, `${property.co2_emissions} kg/(m²·a)`)
                )
              ),
              
              property.heating_type && React.createElement(View, { style: styles.energyItem },
                React.createElement(Text, { style: styles.energyLabel }, "Heizungsart"),
                React.createElement(Text, { style: styles.energyValue }, property.heating_type)
              )
            ),
            
            // Certificate Details
            React.createElement(View, { style: styles.certificateDetails },
              React.createElement(Text, { style: styles.sectionTitle }, "Zertifikat-Details"),
              property.energy_certificate_type && React.createElement(View, { style: styles.certificateRow },
                React.createElement(Text, { style: styles.certificateLabel }, "Ausweistyp:"),
                React.createElement(Text, { style: styles.certificateValue }, property.energy_certificate_type)
              ),
              property.energy_certificate_issue_date && React.createElement(View, { style: styles.certificateRow },
                React.createElement(Text, { style: styles.certificateLabel }, "Ausstellungsdatum:"),
                React.createElement(Text, { style: styles.certificateValue }, property.energy_certificate_issue_date)
              ),
              property.energy_certificate_valid_until && React.createElement(View, { style: styles.certificateRow },
                React.createElement(Text, { style: styles.certificateLabel }, "Gültig bis:"),
                React.createElement(Text, { style: styles.certificateValue }, property.energy_certificate_valid_until)
              )
            )
          ),
          
          // Footer
          React.createElement(View, { style: styles.footer },
            React.createElement(Text, { style: styles.footerText }, "Dieses Zertifikat wurde automatisch generiert und ist rechtlich bindend."),
            React.createElement(Text, { style: styles.generatedDate }, `Generiert am: ${currentDate}`)
          )
        )
      );
      
      // Generate PDF blob
      const pdfBlob = await pdf(doc).toBlob();
      
      return pdfBlob;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Fehler beim Generieren des PDFs');
    }
  }

  /**
   * Download PDF file
   */
  static downloadPDF(blob: Blob, filename: string = 'energieausweis.pdf'): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw new Error('Fehler beim Herunterladen des PDFs');
    }
  }

  /**
   * Generate and download Energy Certificate PDF
   */
  static async generateAndDownloadEnergyCertificate(
    property: any, 
    logoUrl?: string,
    filename?: string
  ): Promise<void> {
    try {
      const blob = await this.generateEnergyCertificate({ property, logoUrl });
      this.downloadPDF(blob, filename);
    } catch (error) {
      console.error('Error generating and downloading PDF:', error);
      throw error;
    }
  }
}
