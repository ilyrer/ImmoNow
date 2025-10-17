"""
PDF Generator Service for Energy Certificates
"""
import os
import io
from datetime import datetime
from typing import Optional
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from PIL import Image as PILImage
import logging

logger = logging.getLogger(__name__)


class PDFGeneratorService:
    """Service for generating PDF documents"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        # Normal text style
        self.styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=12,
            alignment=TA_LEFT
        ))
        
        # Table header style
        self.styles.add(ParagraphStyle(
            name='TableHeader',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            textColor=colors.white
        ))
    
    def generate_energy_certificate_pdf(
        self,
        property_data: dict,
        energy_data: dict,
        company_data: dict,
        logo_path: Optional[str] = None,
        language: str = "de"
    ) -> bytes:
        """
        Generate energy certificate PDF
        
        Args:
            property_data: Property information
            energy_data: Energy certificate data
            company_data: Company information
            logo_path: Path to company logo
            language: PDF language (de/en)
        
        Returns:
            PDF bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=2*cm,
            leftMargin=2*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        story = []
        
        # Add logo if provided
        if logo_path and os.path.exists(logo_path):
            try:
                logo = Image(logo_path, width=4*cm, height=2*cm)
                story.append(logo)
                story.append(Spacer(1, 20))
            except Exception as e:
                logger.warning(f"Could not load logo: {e}")
        
        # Title
        title_text = "Energieausweis" if language == "de" else "Energy Certificate"
        story.append(Paragraph(title_text, self.styles['CustomTitle']))
        
        # Property information
        property_title = f"{property_data.get('title', 'Immobilie')}"
        story.append(Paragraph(property_title, self.styles['CustomSubtitle']))
        
        # Address
        address_parts = []
        if property_data.get('address', {}).get('street'):
            address_parts.append(property_data['address']['street'])
        if property_data.get('address', {}).get('zip_code'):
            address_parts.append(f"{property_data['address']['zip_code']} {property_data['address'].get('city', '')}")
        
        if address_parts:
            story.append(Paragraph(", ".join(address_parts), self.styles['CustomNormal']))
        
        story.append(Spacer(1, 20))
        
        # Energy efficiency table
        energy_table_data = self._create_energy_table_data(energy_data, language)
        if energy_table_data:
            energy_table = Table(energy_table_data, colWidths=[6*cm, 6*cm])
            energy_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(energy_table)
            story.append(Spacer(1, 20))
        
        # Certificate details
        cert_data = self._create_certificate_details(energy_data, language)
        if cert_data:
            cert_table = Table(cert_data, colWidths=[6*cm, 6*cm])
            cert_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(cert_table)
            story.append(Spacer(1, 20))
        
        # Footer
        footer_text = self._create_footer_text(company_data, language)
        story.append(Paragraph(footer_text, self.styles['CustomNormal']))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def _create_energy_table_data(self, energy_data: dict, language: str) -> list:
        """Create energy efficiency table data"""
        if language == "de":
            headers = ["Energieeffizienzklasse", "Endenergiebedarf"]
            energy_class_label = "Energieeffizienzklasse"
            consumption_label = "Endenergiebedarf (kWh/m²a)"
        else:
            headers = ["Energy Efficiency Class", "Final Energy Demand"]
            energy_class_label = "Energy Efficiency Class"
            consumption_label = "Final Energy Demand (kWh/m²a)"
        
        data = [headers]
        
        energy_class = energy_data.get('energy_class', 'Nicht angegeben')
        consumption = energy_data.get('energy_consumption', 'Nicht angegeben')
        
        if consumption != 'Nicht angegeben':
            consumption = f"{consumption} kWh/m²a"
        
        data.append([energy_class, consumption])
        
        return data
    
    def _create_certificate_details(self, energy_data: dict, language: str) -> list:
        """Create certificate details table"""
        if language == "de":
            details = [
                ["Ausstellungsdatum", energy_data.get('energy_certificate_issue_date', 'Nicht angegeben')],
                ["Gültig bis", energy_data.get('energy_certificate_valid_until', 'Nicht angegeben')],
                ["Ausweistyp", energy_data.get('energy_certificate_type', 'Nicht angegeben')],
                ["Heizungsart", energy_data.get('heating_type', 'Nicht angegeben')],
                ["CO₂-Emissionen", f"{energy_data.get('co2_emissions', 'Nicht angegeben')} kg/m²a" if energy_data.get('co2_emissions') else 'Nicht angegeben'],
            ]
        else:
            details = [
                ["Issue Date", energy_data.get('energy_certificate_issue_date', 'Not specified')],
                ["Valid Until", energy_data.get('energy_certificate_valid_until', 'Not specified')],
                ["Certificate Type", energy_data.get('energy_certificate_type', 'Not specified')],
                ["Heating Type", energy_data.get('heating_type', 'Not specified')],
                ["CO₂ Emissions", f"{energy_data.get('co2_emissions', 'Not specified')} kg/m²a" if energy_data.get('co2_emissions') else 'Not specified'],
            ]
        
        return details
    
    def _create_footer_text(self, company_data: dict, language: str) -> str:
        """Create footer text"""
        if language == "de":
            footer = f"""
            <br/><br/>
            <b>Erstellt am:</b> {datetime.now().strftime('%d.%m.%Y')}<br/>
            <b>Erstellt von:</b> {company_data.get('company_name', 'ImmoNow')}<br/>
            <b>Software:</b> ImmoNow Property Management System
            """
        else:
            footer = f"""
            <br/><br/>
            <b>Generated on:</b> {datetime.now().strftime('%Y-%m-%d')}<br/>
            <b>Generated by:</b> {company_data.get('company_name', 'ImmoNow')}<br/>
            <b>Software:</b> ImmoNow Property Management System
            """
        
        return footer
