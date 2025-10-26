"""
Payroll Service
Service für Lohnabrechnung und Gehaltsverwaltung
"""

from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, date, timedelta
from decimal import Decimal
from django.db import transaction
from django.db.models import Q, Count, Avg, Sum
from django.core.exceptions import ValidationError
from asgiref.sync import sync_to_async
import io
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.db.models import PayrollRun, PayrollEntry, Employee, EmployeeCompensation
from app.schemas.payroll import (
    PayrollRunCreate, PayrollRunUpdate, PayrollRunResponse, PayrollListResponse,
    PayrollEntryResponse, PayrollStats, PayrollEntryManualCreate, PayrollEntryAutoCreate
)
from app.core.errors import NotFoundError, ValidationError as AppValidationError


class PayrollService:
    """Service für Lohnabrechnung"""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    async def get_payroll_runs(
        self,
        page: int = 1,
        size: int = 20,
        status: Optional[str] = None,
        period: Optional[str] = None
    ) -> PayrollListResponse:
        """Alle Lohnläufe abrufen mit Filterung und Paginierung"""
        
        def _get_payroll_runs():
            queryset = PayrollRun.objects.filter(tenant_id=self.tenant_id)
            
            # Apply filters
            if status:
                queryset = queryset.filter(status=status)
            
            if period:
                queryset = queryset.filter(period=period)
            
            # Count total
            total = queryset.count()
            
            # Apply pagination
            offset = (page - 1) * size
            runs = list(
                queryset.order_by('-period')[offset:offset + size]
            )
            
            return runs, total
        
        runs, total = await sync_to_async(_get_payroll_runs)()
        
        # Convert to response format
        payroll_responses = []
        for run in runs:
            payroll_responses.append(PayrollRunResponse(
                id=str(run.id),
                period=run.period,
                status=run.status,
                total_amount=run.total_amount,
                employee_count=run.employee_count,
                created_at=run.created_at,
                updated_at=run.updated_at,
                created_by=str(run.created_by.id),
                approved_at=run.approved_at,
                approved_by=str(run.approved_by.id) if run.approved_by else None,
                paid_at=run.paid_at,
                paid_by=str(run.paid_by.id) if run.paid_by else None,
                notes=run.notes
            ))
        
        return PayrollListResponse(
            payroll_runs=payroll_responses,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size
        )
    
    async def get_payroll_run(self, run_id: str) -> PayrollRunResponse:
        """Einzelnen Lohnlauf abrufen"""
        
        def _get_payroll_run():
            try:
                run = PayrollRun.objects.get(id=run_id, tenant_id=self.tenant_id)
                return run
            except PayrollRun.DoesNotExist:
                raise NotFoundError(f"Lohnlauf mit ID {run_id} nicht gefunden")
        
        run = await sync_to_async(_get_payroll_run)()
        
        return PayrollRunResponse(
            id=str(run.id),
            period=run.period,
            status=run.status,
            total_amount=run.total_amount,
            employee_count=run.employee_count,
            created_at=run.created_at,
            updated_at=run.updated_at,
            created_by=str(run.created_by.id),
            approved_at=run.approved_at,
            approved_by=str(run.approved_by.id) if run.approved_by else None,
            paid_at=run.paid_at,
            paid_by=str(run.paid_by.id) if run.paid_by else None,
            notes=run.notes
        )
    
    async def create_payroll_run(self, payroll_data: PayrollRunCreate, created_by: str) -> PayrollRunResponse:
        """Neuen Lohnlauf erstellen"""
        
        def _create_payroll_run():
            # Check if payroll run for this period already exists
            if PayrollRun.objects.filter(tenant_id=self.tenant_id, period=payroll_data.period).exists():
                raise ValidationError("Lohnlauf für diesen Zeitraum existiert bereits")
            
            # Get created_by user
            try:
                created_by_user = User.objects.get(id=created_by)
            except User.DoesNotExist:
                raise NotFoundError("Ersteller nicht gefunden")
            
            # Create payroll run
            run = PayrollRun.objects.create(
                tenant_id=self.tenant_id,
                period=payroll_data.period,
                status='draft',
                total_amount=Decimal('0.00'),
                employee_count=0,
                created_by=created_by_user,
                notes=payroll_data.notes
            )
            
            return run
        
        run = await sync_to_async(_create_payroll_run)()
        
        return PayrollRunResponse(
            id=str(run.id),
            period=run.period,
            status=run.status,
            total_amount=run.total_amount,
            employee_count=run.employee_count,
            created_at=run.created_at,
            updated_at=run.updated_at,
            created_by=str(run.created_by.id),
            approved_at=run.approved_at,
            approved_by=str(run.approved_by.id) if run.approved_by else None,
            paid_at=run.paid_at,
            paid_by=str(run.paid_by.id) if run.paid_by else None,
            notes=run.notes
        )
    
    async def update_payroll_run(self, run_id: str, payroll_data: PayrollRunUpdate, updated_by: str) -> PayrollRunResponse:
        """Lohnlauf aktualisieren"""
        
        def _update_payroll_run():
            try:
                run = PayrollRun.objects.get(id=run_id, tenant_id=self.tenant_id)
            except PayrollRun.DoesNotExist:
                raise NotFoundError(f"Lohnlauf mit ID {run_id} nicht gefunden")
            
            # Update fields
            if payroll_data.period:
                # Check if new period already exists
                if PayrollRun.objects.filter(tenant_id=self.tenant_id, period=payroll_data.period).exclude(id=run_id).exists():
                    raise ValidationError("Lohnlauf für diesen Zeitraum existiert bereits")
                run.period = payroll_data.period
            
            if payroll_data.status:
                run.status = payroll_data.status
            
            if payroll_data.notes is not None:
                run.notes = payroll_data.notes
            
            run.save()
            return run
        
        run = await sync_to_async(_update_payroll_run)()
        
        return PayrollRunResponse(
            id=str(run.id),
            period=run.period,
            status=run.status,
            total_amount=run.total_amount,
            employee_count=run.employee_count,
            created_at=run.created_at,
            updated_at=run.updated_at,
            created_by=str(run.created_by.id),
            approved_at=run.approved_at,
            approved_by=str(run.approved_by.id) if run.approved_by else None,
            paid_at=run.paid_at,
            paid_by=str(run.paid_by.id) if run.paid_by else None,
            notes=run.notes
        )
    
    async def approve_payroll_run(self, run_id: str, approved_by: str) -> bool:
        """Lohnlauf genehmigen"""
        
        def _approve_payroll_run():
            try:
                run = PayrollRun.objects.get(id=run_id, tenant_id=self.tenant_id)
            except PayrollRun.DoesNotExist:
                raise NotFoundError(f"Lohnlauf mit ID {run_id} nicht gefunden")
            
            if run.status != 'draft':
                raise ValidationError("Nur Entwürfe können genehmigt werden")
            
            # Get approved_by user
            try:
                approved_by_user = User.objects.get(id=approved_by)
            except User.DoesNotExist:
                raise NotFoundError("Genehmiger nicht gefunden")
            
            run.status = 'approved'
            run.approved_at = datetime.now()
            run.approved_by = approved_by_user
            run.save()
            
            return True
        
        await sync_to_async(_approve_payroll_run)()
        return True
    
    async def mark_payroll_run_paid(self, run_id: str, paid_by: str) -> bool:
        """Lohnlauf als bezahlt markieren"""
        
        def _mark_payroll_run_paid():
            try:
                run = PayrollRun.objects.get(id=run_id, tenant_id=self.tenant_id)
            except PayrollRun.DoesNotExist:
                raise NotFoundError(f"Lohnlauf mit ID {run_id} nicht gefunden")
            
            if run.status != 'approved':
                raise ValidationError("Nur genehmigte Lohnläufe können als bezahlt markiert werden")
            
            # Get paid_by user
            try:
                paid_by_user = User.objects.get(id=paid_by)
            except User.DoesNotExist:
                raise NotFoundError("Benutzer nicht gefunden")
            
            run.status = 'paid'
            run.paid_at = datetime.now()
            run.paid_by = paid_by_user
            run.save()
            
            return True
        
        await sync_to_async(_mark_payroll_run_paid)()
        return True
    
    async def delete_payroll_run(self, run_id: str) -> bool:
        """Lohnlauf löschen"""
        
        def _delete_payroll_run():
            try:
                run = PayrollRun.objects.get(id=run_id, tenant_id=self.tenant_id)
            except PayrollRun.DoesNotExist:
                raise NotFoundError(f"Lohnlauf mit ID {run_id} nicht gefunden")
            
            if run.status not in ['draft', 'cancelled']:
                raise ValidationError("Nur Entwürfe und stornierte Lohnläufe können gelöscht werden")
            
            run.delete()
            return True
        
        await sync_to_async(_delete_payroll_run)()
        return True
    
    async def get_payroll_stats(self) -> PayrollStats:
        """Lohnabrechnungs-Statistiken abrufen"""
        
        def _get_payroll_stats():
            total_runs = PayrollRun.objects.filter(tenant_id=self.tenant_id).count()
            
            # Runs by status
            runs_by_status = {}
            for status in ['draft', 'approved', 'paid', 'cancelled']:
                count = PayrollRun.objects.filter(tenant_id=self.tenant_id, status=status).count()
                if count > 0:
                    runs_by_status[status] = count
            
            # Total amount paid
            total_amount_paid = PayrollRun.objects.filter(
                tenant_id=self.tenant_id,
                status='paid'
            ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            
            # Average run amount
            avg_amount = PayrollRun.objects.filter(tenant_id=self.tenant_id).aggregate(
                avg=Avg('total_amount')
            )['avg'] or Decimal('0.00')
            
            # Runs this year
            this_year = datetime.now().year
            runs_this_year = PayrollRun.objects.filter(
                tenant_id=self.tenant_id,
                period__startswith=str(this_year)
            ).count()
            
            # Runs last month
            last_month = datetime.now().replace(day=1) - timedelta(days=1)
            runs_last_month = PayrollRun.objects.filter(
                tenant_id=self.tenant_id,
                created_at__year=last_month.year,
                created_at__month=last_month.month
            ).count()
            
            # Pending approvals
            pending_approvals = PayrollRun.objects.filter(
                tenant_id=self.tenant_id,
                status='draft'
            ).count()
            
            # Overdue payments
            overdue_payments = PayrollRun.objects.filter(
                tenant_id=self.tenant_id,
                status='approved',
                approved_at__lt=datetime.now() - timedelta(days=7)
            ).count()
            
            return {
                'total_runs': total_runs,
                'runs_by_status': runs_by_status,
                'total_amount_paid': total_amount_paid,
                'average_run_amount': avg_amount,
                'runs_this_year': runs_this_year,
                'runs_last_month': runs_last_month,
                'pending_approvals': pending_approvals,
                'overdue_payments': overdue_payments
            }
        
        stats = await sync_to_async(_get_payroll_stats)()
        return PayrollStats(**stats)
    
    async def get_payroll_entries_by_employee(
        self, 
        employee_id: str,
        page: int = 1,
        size: int = 20
    ) -> List[PayrollEntryResponse]:
        """Hole Lohnabrechnungen eines Mitarbeiters"""
        
        def _get_entries():
            entries = PayrollEntry.objects.filter(
                employee_id=employee_id,
                payroll_run__tenant_id=self.tenant_id
            ).select_related('payroll_run', 'employee__user').order_by('-payroll_run__period')
            
            offset = (page - 1) * size
            return list(entries[offset:offset + size])
        
        entries = await sync_to_async(_get_entries)()
        
        return [
            PayrollEntryResponse(
                id=str(entry.id),
                payroll_run_id=str(entry.payroll_run.id),
                employee_id=str(entry.employee.id),
                employee_name=entry.employee.full_name,
                base_salary=entry.base_salary,
                commission=entry.commission,
                bonuses=entry.bonuses,
                overtime=entry.overtime,
                car_allowance=entry.car_allowance,
                phone_allowance=entry.phone_allowance,
                other_allowances=entry.other_allowances,
                income_tax=entry.income_tax,
                social_security_employee=entry.social_security_employee,
                health_insurance=entry.health_insurance,
                pension_insurance=entry.pension_insurance,
                unemployment_insurance=entry.unemployment_insurance,
                other_deductions=entry.other_deductions,
                currency=entry.currency,
                working_days=entry.working_days,
                total_days=entry.total_days,
                gross_amount=entry.gross_amount,
                total_deductions=entry.total_deductions,
                net_amount=entry.net_amount,
                created_at=entry.created_at,
                updated_at=entry.updated_at
            )
            for entry in entries
        ]
    
    async def generate_payslip_pdf(
        self, 
        payroll_entry_id: str
    ) -> bytes:
        """Generiere PDF für Lohnzettel"""
        
        def _get_payroll_entry():
            return PayrollEntry.objects.filter(
                id=payroll_entry_id,
                tenant_id=self.tenant_id
            ).select_related('payroll_run', 'employee__user').first()
        
        entry = await sync_to_async(_get_payroll_entry)()
        
        if not entry:
            raise NotFoundError("Payroll entry not found")
        
        # Erstelle PDF im Memory
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        
        # Custom Styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkblue
        )
        
        normal_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=6
        )
        
        # Story (Inhalt)
        story = []
        
        # Header
        story.append(Paragraph("LOHNZETTEL", title_style))
        story.append(Spacer(1, 20))
        
        # Mitarbeiterdaten
        employee_data = [
            ['Mitarbeiter:', entry.employee.full_name],
            ['Mitarbeiternummer:', entry.employee.employee_number],
            ['Abteilung:', entry.employee.department],
            ['Position:', entry.employee.position],
            ['Periode:', entry.payroll_run.period],
            ['Erstellt am:', entry.created_at.strftime('%d.%m.%Y')]
        ]
        
        employee_table = Table(employee_data, colWidths=[4*cm, 6*cm])
        employee_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),
        ]))
        
        story.append(employee_table)
        story.append(Spacer(1, 20))
        
        # Brutto-Bestandteile
        story.append(Paragraph("BRUTTO-BESTANDTEILE", heading_style))
        
        gross_data = [
            ['Beschreibung', 'Betrag (€)'],
            ['Grundgehalt', f"{entry.base_salary:,.2f}"],
            ['Provision', f"{entry.commission:,.2f}"],
            ['Boni', f"{entry.bonuses:,.2f}"],
            ['Überstunden', f"{entry.overtime:,.2f}"],
            ['Fahrzeugzuschuss', f"{entry.car_allowance:,.2f}"],
            ['Telefonzuschuss', f"{entry.phone_allowance:,.2f}"],
            ['Sonstige Zuschüsse', f"{entry.other_allowances:,.2f}"],
            ['', ''],
            ['<b>BRUTTO-GEHALT</b>', f"<b>{entry.gross_amount:,.2f}</b>"]
        ]
        
        gross_table = Table(gross_data, colWidths=[8*cm, 3*cm])
        gross_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ]))
        
        story.append(gross_table)
        story.append(Spacer(1, 20))
        
        # Abzüge
        story.append(Paragraph("ABZÜGE", heading_style))
        
        deductions_data = [
            ['Beschreibung', 'Betrag (€)'],
            ['Einkommensteuer', f"{entry.income_tax:,.2f}"],
            ['Sozialversicherung AN', f"{entry.social_security_employee:,.2f}"],
            ['Krankenversicherung', f"{entry.health_insurance:,.2f}"],
            ['Rentenversicherung', f"{entry.pension_insurance:,.2f}"],
            ['Arbeitslosenversicherung', f"{entry.unemployment_insurance:,.2f}"],
            ['Sonstige Abzüge', f"{entry.other_deductions:,.2f}"],
            ['', ''],
            ['<b>GESAMTE ABZÜGE</b>', f"<b>{entry.total_deductions:,.2f}</b>"]
        ]
        
        deductions_table = Table(deductions_data, colWidths=[8*cm, 3*cm])
        deductions_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.black),
            ('LINEBELOW', (0, -1), (-1, -1), 1, colors.black),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
        ]))
        
        story.append(deductions_table)
        story.append(Spacer(1, 20))
        
        # Netto-Betrag
        net_data = [
            ['<b>NETTO-GEHALT</b>', f"<b>{entry.net_amount:,.2f} €</b>"]
        ]
        
        net_table = Table(net_data, colWidths=[8*cm, 3*cm])
        net_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('LINEBELOW', (0, 0), (-1, 0), 2, colors.black),
            ('LINEBELOW', (0, -1), (-1, -1), 2, colors.black),
            ('BACKGROUND', (0, 0), (-1, -1), colors.lightblue),
        ]))
        
        story.append(net_table)
        story.append(Spacer(1, 30))
        
        # Arbeitszeit
        story.append(Paragraph("ARBEITSZEIT", heading_style))
        
        time_data = [
            ['Arbeitstage:', f"{entry.working_days}"],
            ['Gesamttage:', f"{entry.total_days}"],
            ['Arbeitszeitquote:', f"{(entry.working_days / entry.total_days * 100):.1f}%"]
        ]
        
        time_table = Table(time_data, colWidths=[4*cm, 3*cm])
        time_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(time_table)
        story.append(Spacer(1, 30))
        
        # Footer
        footer_text = f"Erstellt am {datetime.now().strftime('%d.%m.%Y %H:%M')} | ImmoNow HR System"
        story.append(Paragraph(footer_text, normal_style))
        
        # PDF erstellen
        doc.build(story)
        
        # PDF-Daten zurückgeben
        buffer.seek(0)
        return buffer.getvalue()
    
    async def create_manual_payroll_entry(
        self,
        data: PayrollEntryManualCreate,
        created_by_user_id: str
    ) -> PayrollEntryResponse:
        """Erstelle manuellen Lohnzettel"""
        
        def _create_manual_entry():
            # Hole Employee
            employee = Employee.objects.filter(user_id=data.employee_id).first()
            if not employee:
                raise NotFoundError("Employee not found")
            
            # Erstelle oder hole Payroll Run für Periode
            payroll_run, created = PayrollRun.objects.get_or_create(
                tenant_id=self.tenant_id,
                period=data.period,
                defaults={
                    'period_start': datetime.strptime(f"{data.period}-01", "%Y-%m-%d").date(),
                    'period_end': (datetime.strptime(f"{data.period}-01", "%Y-%m-%d") + timedelta(days=31)).replace(day=1) - timedelta(days=1),
                    'status': 'draft',
                    'created_by_id': created_by_user_id
                }
            )
            
            # Erstelle PayrollEntry
            entry = PayrollEntry.objects.create(
                payroll_run=payroll_run,
                employee=employee,
                gross_amount=data.gross_salary,
                total_deductions=data.deductions,
                net_amount=data.net_salary,
                bonuses=data.bonuses or Decimal('0'),
                overtime_pay=data.overtime_pay or Decimal('0'),
                notes=data.notes
            )
            
            return entry
        
        entry = await sync_to_async(_create_manual_entry)()
        
        # Konvertiere zu Response
        return PayrollEntryResponse(
            id=str(entry.id),
            payroll_run_id=str(entry.payroll_run.id),
            employee_id=str(entry.employee.id),
            employee_name=f"{entry.employee.user.first_name} {entry.employee.user.last_name}".strip(),
            gross_amount=entry.gross_amount,
            total_deductions=entry.total_deductions,
            net_amount=entry.net_amount,
            bonuses=entry.bonuses,
            overtime_pay=entry.overtime_pay,
            created_at=entry.created_at,
            updated_at=entry.updated_at
        )
    
    async def create_automatic_payroll_entry(
        self,
        data: PayrollEntryAutoCreate,
        created_by_user_id: str
    ) -> PayrollEntryResponse:
        """Erstelle automatischen Lohnzettel basierend auf Compensation + Overtime"""
        
        def _create_auto_entry():
            # Hole Employee
            employee = Employee.objects.filter(user_id=data.employee_id).first()
            if not employee:
                raise NotFoundError("Employee not found")
            
            # Hole Employee Compensation
            compensation = EmployeeCompensation.objects.filter(
                employee=employee
            ).order_by('-effective_date').first()
            
            if not compensation:
                raise NotFoundError("Employee compensation not found")
            
            # Berechne Überstunden-Vergütung
            overtime_pay = Decimal('0')
            if data.include_overtime:
                from app.db.models import Overtime
                overtime_records = Overtime.objects.filter(
                    employee=employee,
                    approved=True,
                    date__gte=datetime.strptime(f"{data.period}-01", "%Y-%m-%d").date(),
                    date__lt=(datetime.strptime(f"{data.period}-01", "%Y-%m-%d") + timedelta(days=31)).replace(day=1)
                )
                overtime_pay = sum(float(ot.hours) * float(ot.rate) for ot in overtime_records)
            
            # Berechne Boni
            bonuses = Decimal('0')
            if data.include_bonuses and compensation.bonuses:
                bonuses = compensation.bonuses
            
            # Berechne Bruttogehalt
            gross_amount = compensation.base_salary + bonuses + overtime_pay
            
            # Berechne Abzüge
            total_deductions = (
                compensation.health_insurance +
                compensation.pension_insurance +
                compensation.unemployment_insurance +
                compensation.income_tax +
                compensation.social_security_employee +
                (compensation.other_deductions or Decimal('0'))
            )
            
            # Berechne Nettogehalt
            net_amount = gross_amount - total_deductions
            
            # Erstelle oder hole Payroll Run für Periode
            payroll_run, created = PayrollRun.objects.get_or_create(
                tenant_id=self.tenant_id,
                period=data.period,
                defaults={
                    'period_start': datetime.strptime(f"{data.period}-01", "%Y-%m-%d").date(),
                    'period_end': (datetime.strptime(f"{data.period}-01", "%Y-%m-%d") + timedelta(days=31)).replace(day=1) - timedelta(days=1),
                    'status': 'draft',
                    'created_by_id': created_by_user_id
                }
            )
            
            # Erstelle PayrollEntry
            entry = PayrollEntry.objects.create(
                payroll_run=payroll_run,
                employee=employee,
                gross_amount=gross_amount,
                total_deductions=total_deductions,
                net_amount=net_amount,
                bonuses=bonuses,
                overtime_pay=overtime_pay,
                notes=f"Automatisch generiert für Periode {data.period}"
            )
            
            return entry
        
        entry = await sync_to_async(_create_auto_entry)()
        
        # Konvertiere zu Response
        return PayrollEntryResponse(
            id=str(entry.id),
            payroll_run_id=str(entry.payroll_run.id),
            employee_id=str(entry.employee.id),
            employee_name=f"{entry.employee.user.first_name} {entry.employee.user.last_name}".strip(),
            gross_amount=entry.gross_amount,
            total_deductions=entry.total_deductions,
            net_amount=entry.net_amount,
            bonuses=entry.bonuses,
            overtime_pay=entry.overtime_pay,
            created_at=entry.created_at,
            updated_at=entry.updated_at
        )