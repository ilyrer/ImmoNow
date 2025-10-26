import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

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

interface EnergyCertificatePDFProps {
  property: {
    id: string;
    title: string;
    address?: {
      street?: string;
      city?: string;
      zip_code?: string;
    };
    energy_class?: string;
    energy_consumption?: number;
    co2_emissions?: number;
    energy_certificate_type?: string;
    energy_certificate_valid_until?: string;
    energy_certificate_issue_date?: string;
    heating_type?: string;
    living_area?: number;
    year_built?: number;
  };
  logoUrl?: string;
}

const EnergyCertificatePDF: React.FC<EnergyCertificatePDFProps> = ({ property, logoUrl }) => {
  const currentDate = new Date().toLocaleDateString('de-DE');
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Logo */}
        <View style={styles.header}>
          {logoUrl && (
            <Image style={styles.logo} src={logoUrl} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.title}>Energieausweis</Text>
            <Text style={styles.subtitle}>Energieeffizienz-Zertifikat</Text>
          </View>
        </View>

        {/* Certificate Container */}
        <View style={styles.certificateContainer}>
          <Text style={styles.certificateTitle}>Energieeffizienz-Zertifikat</Text>
          
          {/* Property Information */}
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyTitle}>Immobilien-Details</Text>
            <View style={styles.propertyDetails}>
              <Text style={styles.propertyLabel}>Objekt:</Text>
              <Text style={styles.propertyValue}>{property.title}</Text>
            </View>
            {property.address && (
              <>
                <View style={styles.propertyDetails}>
                  <Text style={styles.propertyLabel}>Adresse:</Text>
                  <Text style={styles.propertyValue}>
                    {property.address.street && `${property.address.street}, `}
                    {property.address.zip_code && `${property.address.zip_code} `}
                    {property.address.city}
                  </Text>
                </View>
              </>
            )}
            {property.living_area && (
              <View style={styles.propertyDetails}>
                <Text style={styles.propertyLabel}>Wohnfläche:</Text>
                <Text style={styles.propertyValue}>{property.living_area} m²</Text>
              </View>
            )}
            {property.year_built && (
              <View style={styles.propertyDetails}>
                <Text style={styles.propertyLabel}>Baujahr:</Text>
                <Text style={styles.propertyValue}>{property.year_built}</Text>
              </View>
            )}
          </View>

          {/* Energy Efficiency Section */}
          <View style={styles.energySection}>
            <Text style={styles.sectionTitle}>Energieeffizienz-Bewertung</Text>
            
            {property.energy_class && (
              <View style={styles.energyClass}>
                <Text>Energieeffizienzklasse: {property.energy_class}</Text>
              </View>
            )}

            <View style={styles.energyGrid}>
              {property.energy_consumption && (
                <View style={styles.energyItem}>
                  <Text style={styles.energyLabel}>Endenergiebedarf</Text>
                  <Text style={styles.energyValue}>{property.energy_consumption} kWh/(m²·a)</Text>
                </View>
              )}
              {property.co2_emissions !== undefined && (
                <View style={styles.energyItem}>
                  <Text style={styles.energyLabel}>CO₂-Emissionen</Text>
                  <Text style={styles.energyValue}>{property.co2_emissions} kg/(m²·a)</Text>
                </View>
              )}
            </View>

            {property.heating_type && (
              <View style={styles.energyItem}>
                <Text style={styles.energyLabel}>Heizungsart</Text>
                <Text style={styles.energyValue}>{property.heating_type}</Text>
              </View>
            )}
          </View>

          {/* Certificate Details */}
          <View style={styles.certificateDetails}>
            <Text style={styles.sectionTitle}>Zertifikat-Details</Text>
            {property.energy_certificate_type && (
              <View style={styles.certificateRow}>
                <Text style={styles.certificateLabel}>Ausweistyp:</Text>
                <Text style={styles.certificateValue}>{property.energy_certificate_type}</Text>
              </View>
            )}
            {property.energy_certificate_issue_date && (
              <View style={styles.certificateRow}>
                <Text style={styles.certificateLabel}>Ausstellungsdatum:</Text>
                <Text style={styles.certificateValue}>{property.energy_certificate_issue_date}</Text>
              </View>
            )}
            {property.energy_certificate_valid_until && (
              <View style={styles.certificateRow}>
                <Text style={styles.certificateLabel}>Gültig bis:</Text>
                <Text style={styles.certificateValue}>{property.energy_certificate_valid_until}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dieses Zertifikat wurde automatisch generiert und ist rechtlich bindend.
          </Text>
          <Text style={styles.generatedDate}>
            Generiert am: {currentDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default EnergyCertificatePDF;
