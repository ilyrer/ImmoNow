"""
AVM PDF Report Service
Generates professional PDF reports for property valuations
"""
import io
import os
from datetime import datetime
from typing import Optional, List
import logging

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image as RLImage
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.barcharts import VerticalBarChart

from app.schemas.avm import AvmRequest, AvmResponse
from app.services.pdf_generator_service import PDFGeneratorService

logger = logging.getLogger(__name__)


class AVMPDFService(PDFGeneratorService):
    """
    Service for generating professional AVM PDF reports
    
    Report structure:
    1. Executive Summary
    2. Property Data
    3. Valuation Methodology
    4. Comparable Listings
    5. Market Analysis
    6. Disclaimer & Audit Trail
    """
    
    def generate_avm_report_pdf(
        self,
        avm_request: AvmRequest,
        avm_response: AvmResponse,
        company_data: Optional[dict] = None,
        include_comps: bool = True,
        include_charts: bool = True,
        language: str = "de"
    ) -> bytes:
        """
        Generate comprehensive AVM report as PDF
        
        Args:
            avm_request: Original valuation request
            avm_response: Valuation response with results
            company_data: Company information for branding
            include_comps: Include comparable listings section
            include_charts: Include market trend charts
            language: Report language (de/en)
        
        Returns:
            PDF bytes
        """
        try:
            logger.info(f"📄 Generating AVM PDF report for {avm_request.city}")
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=2*cm,
                leftMargin=2*cm,
                topMargin=2*cm,
                bottomMargin=2*cm,
                title="Immobilienbewertung",
                author=company_data.get('company_name', 'ImmoNow') if company_data else 'ImmoNow'
            )
            
            story = []
            
            # Page 1: Executive Summary
            story.extend(self._create_executive_summary(
                avm_request, avm_response, language
            ))
            story.append(PageBreak())
            
            # Page 2: Property Data
            story.extend(self._create_property_data_section(
                avm_request, language
            ))
            story.append(PageBreak())
            
            # Page 3: Valuation Methodology & Factors
            story.extend(self._create_methodology_section(
                avm_response, language
            ))
            
            # Page 4-5: Comparable Listings (if included)
            if include_comps and avm_response.comparables:
                story.append(PageBreak())
                story.extend(self._create_comparables_section(
                    avm_response.comparables, language
                ))
            
            # Page 6: Market Analysis (if included)
            if include_charts and avm_response.market_intelligence:
                story.append(PageBreak())
                story.extend(self._create_market_analysis_section(
                    avm_response.market_intelligence, language
                ))
            
            # Last Page: Disclaimer & Audit Trail
            story.append(PageBreak())
            story.extend(self._create_disclaimer_section(
                avm_response, company_data, language
            ))
            
            # Build PDF
            doc.build(story)
            buffer.seek(0)
            
            logger.info("✅ PDF report generated successfully")
            return buffer.getvalue()
            
        except Exception as e:
            logger.error(f"❌ PDF generation error: {e}")
            raise
    
    def _create_executive_summary(
        self,
        avm_request: AvmRequest,
        avm_response: AvmResponse,
        language: str
    ) -> List:
        """Create executive summary page"""
        elements = []
        
        # Title
        title = "Immobilienbewertung" if language == "de" else "Property Valuation Report"
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 20))
        
        # Property address
        address_text = f"{avm_request.address}, {avm_request.postal_code} {avm_request.city}"
        elements.append(Paragraph(address_text, self.styles['CustomSubtitle']))
        elements.append(Spacer(1, 30))
        
        # Main valuation result (big and prominent)
        result = avm_response.result
        
        value_style = ParagraphStyle(
            'ValueStyle',
            parent=self.styles['Normal'],
            fontSize=32,
            textColor=colors.HexColor('#1e40af'),
            alignment=TA_CENTER,
            spaceAfter=10
        )
        
        value_text = f"<b>€ {result.estimated_value:,.0f}</b>"
        elements.append(Paragraph(value_text, value_style))
        
        # Value range
        range_style = ParagraphStyle(
            'RangeStyle',
            parent=self.styles['Normal'],
            fontSize=14,
            alignment=TA_CENTER,
            textColor=colors.grey,
            spaceAfter=20
        )
        
        range_text = (
            f"Wertspanne: € {result.valuation_range.min:,.0f} - € {result.valuation_range.max:,.0f}"
            if language == "de" else
            f"Value Range: € {result.valuation_range.min:,.0f} - € {result.valuation_range.max:,.0f}"
        )
        elements.append(Paragraph(range_text, range_style))
        
        # Key metrics table
        key_metrics_data = [
            ['Preis pro m²' if language == 'de' else 'Price per m²', 
             f'€ {result.price_per_sqm:,.0f}'],
            ['Konfidenz' if language == 'de' else 'Confidence', 
             result.confidence_level.upper()],
            ['Vergleichsobjekte' if language == 'de' else 'Comparables', 
             str(result.comparables_used)],
            ['Bewertungsdatum' if language == 'de' else 'Valuation Date', 
             result.last_updated.strftime('%d.%m.%Y')]
        ]
        
        key_metrics_table = Table(key_metrics_data, colWidths=[8*cm, 8*cm])
        key_metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        
        elements.append(key_metrics_table)
        elements.append(Spacer(1, 30))
        
        # Property summary
        summary_title = "Objektübersicht" if language == "de" else "Property Summary"
        elements.append(Paragraph(f"<b>{summary_title}</b>", self.styles['Heading2']))
        elements.append(Spacer(1, 10))
        
        property_summary = [
            ['Objektart' if language == 'de' else 'Property Type', 
             avm_request.property_type],
            ['Wohnfläche' if language == 'de' else 'Living Area', 
             f"{avm_request.living_area} m²"],
            ['Zimmer' if language == 'de' else 'Rooms', 
             str(avm_request.rooms) if avm_request.rooms else '-'],
            ['Baujahr' if language == 'de' else 'Build Year', 
             str(avm_request.build_year) if avm_request.build_year else '-'],
            ['Zustand' if language == 'de' else 'Condition', 
             avm_request.condition]
        ]
        
        property_table = Table(property_summary, colWidths=[8*cm, 8*cm])
        property_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f9fafb')),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey)
        ]))
        
        elements.append(property_table)
        
        return elements
    
    def _create_property_data_section(
        self,
        avm_request: AvmRequest,
        language: str
    ) -> List:
        """Create detailed property data section"""
        elements = []
        
        title = "Objektdaten" if language == "de" else "Property Data"
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 20))
        
        # Collect all property data
        data_rows = [
            ['Eigenschaft' if language == 'de' else 'Property', 
             'Wert' if language == 'de' else 'Value']
        ]
        
        # Basic data
        data_rows.append(['Adresse' if language == 'de' else 'Address', avm_request.address])
        data_rows.append(['PLZ / Stadt' if language == 'de' else 'Postal Code / City', 
                         f"{avm_request.postal_code} {avm_request.city}"])
        data_rows.append(['Objektart' if language == 'de' else 'Type', avm_request.property_type])
        
        # Areas
        data_rows.append(['Wohnfläche' if language == 'de' else 'Living Area', 
                         f"{avm_request.living_area} m²"])
        if avm_request.usable_area:
            data_rows.append(['Nutzfläche' if language == 'de' else 'Usable Area', 
                             f"{avm_request.usable_area} m²"])
        if avm_request.plot_area:
            data_rows.append(['Grundstücksfläche' if language == 'de' else 'Plot Area', 
                             f"{avm_request.plot_area} m²"])
        
        # Rooms & bathrooms
        if avm_request.rooms:
            data_rows.append(['Zimmer' if language == 'de' else 'Rooms', str(avm_request.rooms)])
        if avm_request.bathrooms:
            data_rows.append(['Badezimmer' if language == 'de' else 'Bathrooms', 
                             str(avm_request.bathrooms)])
        
        # Floor & elevator
        if avm_request.floor is not None:
            floor_text = f"Etage {avm_request.floor}" if language == 'de' else f"Floor {avm_request.floor}"
            if avm_request.total_floors:
                floor_text += f" von {avm_request.total_floors}" if language == 'de' else f" of {avm_request.total_floors}"
            data_rows.append(['Etage' if language == 'de' else 'Floor', floor_text])
        
        if avm_request.has_elevator:
            data_rows.append(['Aufzug' if language == 'de' else 'Elevator', 
                             'Ja' if language == 'de' else 'Yes'])
        
        # Outdoor spaces
        if avm_request.balcony_area:
            data_rows.append(['Balkon' if language == 'de' else 'Balcony', 
                             f"{avm_request.balcony_area} m²"])
        if avm_request.terrace_area:
            data_rows.append(['Terrasse' if language == 'de' else 'Terrace', 
                             f"{avm_request.terrace_area} m²"])
        if avm_request.garden_area:
            data_rows.append(['Garten' if language == 'de' else 'Garden', 
                             f"{avm_request.garden_area} m²"])
        
        # Parking
        if avm_request.parking_spaces > 0:
            data_rows.append(['Stellplätze' if language == 'de' else 'Parking Spaces', 
                             str(avm_request.parking_spaces)])
        
        # Condition & age
        data_rows.append(['Zustand' if language == 'de' else 'Condition', avm_request.condition])
        if avm_request.build_year:
            data_rows.append(['Baujahr' if language == 'de' else 'Build Year', 
                             str(avm_request.build_year)])
        if avm_request.last_renovation_year:
            data_rows.append(['Letzte Sanierung' if language == 'de' else 'Last Renovation', 
                             str(avm_request.last_renovation_year)])
        
        # Energy
        if avm_request.energy_class:
            data_rows.append(['Energieeffizienzklasse' if language == 'de' else 'Energy Class', 
                             avm_request.energy_class])
        if avm_request.energy_consumption:
            data_rows.append(['Energiekennwert' if language == 'de' else 'Energy Consumption', 
                             f"{avm_request.energy_consumption} kWh/m²a"])
        if avm_request.heating_type:
            data_rows.append(['Heizungsart' if language == 'de' else 'Heating Type', 
                             avm_request.heating_type])
        
        # Quality features
        if avm_request.fitted_kitchen:
            data_rows.append(['Einbauküche' if language == 'de' else 'Fitted Kitchen', 
                             'Ja' if language == 'de' else 'Yes'])
        if avm_request.flooring_type:
            data_rows.append(['Bodenbelag' if language == 'de' else 'Flooring', 
                             avm_request.flooring_type])
        if avm_request.barrier_free:
            data_rows.append(['Barrierefrei' if language == 'de' else 'Barrier Free', 
                             'Ja' if language == 'de' else 'Yes'])
        if avm_request.orientation:
            data_rows.append(['Ausrichtung' if language == 'de' else 'Orientation', 
                             avm_request.orientation])
        
        # Investment data
        if avm_request.is_rented:
            data_rows.append(['Vermietungsstatus' if language == 'de' else 'Rental Status', 
                             'Vermietet' if language == 'de' else 'Rented'])
            if avm_request.current_rent:
                data_rows.append(['Kaltmiete' if language == 'de' else 'Cold Rent', 
                                 f"€ {avm_request.current_rent:,.0f}/Monat"])
        
        # Create table
        property_data_table = Table(data_rows, colWidths=[8*cm, 8*cm])
        property_data_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
        ]))
        
        elements.append(property_data_table)
        
        return elements
    
    def _create_methodology_section(
        self,
        avm_response: AvmResponse,
        language: str
    ) -> List:
        """Create valuation methodology section"""
        elements = []
        
        title = "Bewertungsmethodik" if language == "de" else "Valuation Methodology"
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 20))
        
        # Methodology description
        method_text = f"<b>Angewandte Methode:</b> {avm_response.result.methodology}"
        elements.append(Paragraph(method_text, self.styles['CustomNormal']))
        elements.append(Spacer(1, 20))
        
        # Valuation factors
        factors_title = "Bewertungsfaktoren" if language == "de" else "Valuation Factors"
        elements.append(Paragraph(f"<b>{factors_title}</b>", self.styles['Heading2']))
        elements.append(Spacer(1, 10))
        
        if avm_response.result.factors:
            factors_data = [['Faktor' if language == 'de' else 'Factor', 
                            'Einfluss' if language == 'de' else 'Impact', 
                            'Gewicht' if language == 'de' else 'Weight', 
                            'Beschreibung' if language == 'de' else 'Description']]
            
            for factor in avm_response.result.factors[:8]:  # Top 8 factors
                impact_symbol = {
                    'positive': '↑ Positiv' if language == 'de' else '↑ Positive',
                    'negative': '↓ Negativ' if language == 'de' else '↓ Negative',
                    'neutral': '→ Neutral'
                }
                
                factors_data.append([
                    factor.name,
                    impact_symbol.get(factor.impact, factor.impact),
                    f"{factor.weight}%",
                    factor.description[:60] + '...' if len(factor.description) > 60 else factor.description
                ])
            
            factors_table = Table(factors_data, colWidths=[4*cm, 3*cm, 2*cm, 7*cm])
            factors_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
            ]))
            
            elements.append(factors_table)
        
        return elements
    
    def _create_comparables_section(
        self,
        comparables: List,
        language: str
    ) -> List:
        """Create comparable listings section"""
        elements = []
        
        title = "Vergleichsobjekte" if language == "de" else "Comparable Listings"
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 20))
        
        if comparables:
            # Take top 10 comparables
            top_comps = sorted(comparables, key=lambda c: c.match_score, reverse=True)[:10]
            
            comps_data = [
                ['Adresse' if language == 'de' else 'Address',
                 'Größe' if language == 'de' else 'Size',
                 'Zimmer' if language == 'de' else 'Rooms',
                 'Baujahr' if language == 'de' else 'Year',
                 'Preis' if language == 'de' else 'Price',
                 '€/m²',
                 'Distanz' if language == 'de' else 'Distance',
                 'Match']
            ]
            
            for comp in top_comps:
                comps_data.append([
                    comp.address[:20] + '...' if len(comp.address) > 20 else comp.address,
                    f"{comp.size}m²",
                    str(comp.rooms) if comp.rooms else '-',
                    str(comp.build_year),
                    f"€{comp.price:,.0f}",
                    f"€{comp.price_per_sqm:,.0f}",
                    f"{comp.distance:.1f}km",
                    f"{comp.match_score*100:.0f}%"
                ])
            
            comps_table = Table(comps_data, colWidths=[3.5*cm, 1.5*cm, 1.2*cm, 1.3*cm, 2.5*cm, 2*cm, 1.5*cm, 1.5*cm])
            comps_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTSIZE', (0, 1), (-1, -1), 7),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
            ]))
            
            elements.append(comps_table)
        
        return elements
    
    def _create_market_analysis_section(
        self,
        market_intel,
        language: str
    ) -> List:
        """Create market analysis section"""
        elements = []
        
        title = "Marktanalyse" if language == "de" else "Market Analysis"
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 20))
        
        # Market statistics
        market_data = [
            ['Nachfrage' if language == 'de' else 'Demand', market_intel.demand_level.upper()],
            ['Angebot' if language == 'de' else 'Supply', market_intel.supply_level.upper()],
            ['Preiswachstum 12M' if language == 'de' else 'Price Growth 12M', 
             f"{market_intel.price_growth_12m:+.1f}%"],
            ['Preiswachstum 36M' if language == 'de' else 'Price Growth 36M', 
             f"{market_intel.price_growth_36m:+.1f}%"],
            ['Ø Vermarktungsdauer' if language == 'de' else 'Avg Days on Market', 
             f"{market_intel.average_days_on_market} Tage" if language == 'de' else f"{market_intel.average_days_on_market} days"],
            ['Wettbewerbsindex' if language == 'de' else 'Competition Index', 
             f"{market_intel.competition_index}/10"]
        ]
        
        market_table = Table(market_data, colWidths=[10*cm, 6*cm])
        market_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
        ]))
        
        elements.append(market_table)
        
        return elements
    
    def _create_disclaimer_section(
        self,
        avm_response: AvmResponse,
        company_data: Optional[dict],
        language: str
    ) -> List:
        """Create disclaimer and audit trail section"""
        elements = []
        
        title = "Rechtliche Hinweise" if language == "de" else "Legal Disclaimer"
        elements.append(Paragraph(title, self.styles['CustomTitle']))
        elements.append(Spacer(1, 20))
        
        disclaimer_text = """
        <b>Wichtiger Hinweis:</b><br/>
        Diese Immobilienbewertung wurde automatisiert erstellt und dient ausschließlich als 
        Indikation des Marktwerts. Sie ersetzt keine professionelle Gutachterbewertung durch 
        einen zertifizierten Sachverständigen. Die Bewertung basiert auf den angegebenen Daten 
        und verfügbaren Marktinformationen zum Zeitpunkt der Erstellung. Für rechtsverbindliche 
        Zwecke (z.B. Finanzierung, Verkauf, Erbschaft) wird eine offizielle Wertermittlung 
        durch einen Sachverständigen empfohlen.
        """ if language == "de" else """
        <b>Important Notice:</b><br/>
        This property valuation was generated automatically and serves solely as an indication 
        of market value. It does not replace a professional appraisal by a certified expert. 
        The valuation is based on the provided data and available market information at the 
        time of creation. For legally binding purposes (e.g., financing, sale, inheritance), 
        an official valuation by a certified appraiser is recommended.
        """
        
        elements.append(Paragraph(disclaimer_text, self.styles['CustomNormal']))
        elements.append(Spacer(1, 30))
        
        # Audit trail
        audit_title = "Audit Trail" if language == "de" else "Audit Trail"
        elements.append(Paragraph(f"<b>{audit_title}</b>", self.styles['Heading2']))
        elements.append(Spacer(1, 10))
        
        audit_data = [
            ['Bewertungs-ID' if language == 'de' else 'Valuation ID', 
             avm_response.valuation_id or 'N/A'],
            ['Erstellt am' if language == 'de' else 'Created on', 
             avm_response.result.last_updated.strftime('%d.%m.%Y %H:%M')],
            ['Methodik' if language == 'de' else 'Methodology', 
             avm_response.result.methodology],
            ['Vergleichsobjekte' if language == 'de' else 'Comparables Used', 
             str(avm_response.result.comparables_used)],
            ['Software' if language == 'de' else 'Software', 
             'ImmoNow AVM Premium v2.0']
        ]
        
        if company_data:
            audit_data.append(['Erstellt von' if language == 'de' else 'Generated by', 
                              company_data.get('company_name', 'ImmoNow')])
        
        audit_table = Table(audit_data, colWidths=[8*cm, 8*cm])
        audit_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f9fafb')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey)
        ]))
        
        elements.append(audit_table)
        
        return elements

