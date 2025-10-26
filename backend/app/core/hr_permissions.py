"""
HR Permission Helpers
Hilfsfunktionen für HR-Berechtigungen
"""

from typing import Optional
from asgiref.sync import sync_to_async
from django.db.models import Q

from app.core.security import TokenData
from app.core.errors import ForbiddenError, NotFoundError
from app.db.models import Employee, User


async def can_access_employee_data(current_user: TokenData, employee_id: str) -> bool:
    """
    Prüft ob der aktuelle User auf die Daten eines Mitarbeiters zugreifen darf
    
    Regeln:
    - Mitarbeiter: Nur eigene Daten
    - Manager: Eigene Daten + Team-Mitglieder
    - Admin: Alle Daten
    """
    try:
        # Admin und Owner können alles
        if current_user.role in ["admin", "owner"]:
            return True
        
        # Hole Employee-Objekt für den aktuellen User
        current_employee = await sync_to_async(
            lambda: Employee.objects.filter(user_id=current_user.user_id).first()
        )()
        
        if not current_employee:
            raise NotFoundError("Employee profile not found")
        
        # Wenn User auf eigene Daten zugreift
        if str(current_employee.user_id) == employee_id:
            return True
        
        # Manager kann auf Team-Mitglieder zugreifen
        if current_user.role == "manager":
            target_employee = await sync_to_async(
                lambda: Employee.objects.filter(user_id=employee_id).first()
            )()
            
            if target_employee and target_employee.manager_id == current_employee.id:
                return True
        
        return False
        
    except Exception:
        return False


async def get_accessible_employee_ids(current_user: TokenData) -> list[str]:
    """
    Gibt alle Employee-IDs zurück, auf die der User zugreifen darf
    """
    try:
        # Admin kann alle sehen
        if current_user.role == "admin":
            employees = await sync_to_async(
                lambda: list(Employee.objects.filter(tenant_id=current_user.tenant_id).values_list('id', flat=True))
            )()
            return [str(emp_id) for emp_id in employees]
        
        # Hole Employee-Objekt für den aktuellen User
        current_employee = await sync_to_async(
            lambda: Employee.objects.filter(user_id=current_user.user_id).first()
        )()
        
        if not current_employee:
            return []
        
        accessible_ids = [str(current_employee.id)]
        
        # Manager kann Team-Mitglieder sehen
        if current_user.role == "manager":
            team_members = await sync_to_async(list)(
                Employee.objects.filter(
                    tenant_id=current_user.tenant_id,
                    manager_id=current_employee.id
                ).values_list('id', flat=True)
            )
            accessible_ids.extend([str(emp_id) for emp_id in team_members])
        
        return accessible_ids
        
    except Exception:
        return []


async def get_team_members(manager_id: str) -> list[Employee]:
    """
    Gibt alle Team-Mitglieder eines Managers zurück
    """
    try:
        team_members = await sync_to_async(list)(
            Employee.objects.filter(manager_id=manager_id, is_active=True)
        )
        return team_members
    except Exception:
        return []


async def is_manager_of_employee(manager_id: str, employee_id: str) -> bool:
    """
    Prüft ob ein Manager der direkte Manager eines Mitarbeiters ist
    """
    try:
        employee = await sync_to_async(
            Employee.objects.filter(id=employee_id, manager_id=manager_id).first
        )()
        return employee is not None
    except Exception:
        return False


async def get_employee_by_user_id(user_id: str) -> Optional[Employee]:
    """
    Holt Employee-Objekt anhand der User-ID
    """
    try:
        employee = await sync_to_async(
            Employee.objects.filter(user_id=user_id).first
        )()
        return employee
    except Exception:
        return None


async def validate_employee_access(current_user: TokenData, employee_id: str) -> Employee:
    """
    Validiert den Zugriff auf einen Mitarbeiter und gibt das Employee-Objekt zurück
    """
    if not await can_access_employee_data(current_user, employee_id):
        raise ForbiddenError("Insufficient permissions to access this employee's data")
    
    # employee_id ist eigentlich eine user_id, daher nach user_id suchen
    employee = await sync_to_async(
        lambda: Employee.objects.filter(user_id=employee_id).first()
    )()
    
    if not employee:
        raise NotFoundError("Employee not found")
    
    return employee
