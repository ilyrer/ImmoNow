# Contact Budget Refactoring - Complete Fix

## Problem Statement

1. **Potenzialwert nicht im Header angezeigt**: Budget wurde gespeichert, aber nicht im Kontakt-Header sichtbar
2. **Doppelte Budget-Felder**: `budget_min` und `budget_max` führten zu Verwirrung
3. **CIM reagiert nicht**: Matching funktionierte nicht zuverlässig

## Solution

### Backend Changes

#### 1. Model Update (`app/db/models/__init__.py`)
```python
# New main budget field
budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

# Legacy fields (kept for backward compatibility)
budget_min = models.DecimalField(...)
budget_max = models.DecimalField(...)
```

#### 2. Schema Update (`app/schemas/common.py`)
```python
class ContactResponse(BaseModel):
    budget: Optional[float] = None  # Main field
    budget_min: Optional[float] = None  # Legacy
    budget_max: Optional[float] = None  # Legacy
```

#### 3. Service Update (`app/services/contacts_service.py`)
- Migration logic: `budget` = `budget_max` if `budget` is None
- Update create/update methods to use `budget` field
- CIM matching uses `budget` field with fallback

#### 4. CIM Service Update (`app/services/cim_service.py`)
- Use `budget` field for matching
- Fallback to `budget_max` for migration
- Perfect matches calculation updated

### Frontend Changes

#### 1. Header Display (`ContactDetail.jsx`)
```jsx
// OLD: Used contact.value (didn't work)
{formatCurrency(contact.value)}

// NEW: Uses budget with fallbacks
{(() => {
  const potentialValue = contact.budget || contact.budget_max || contact.value;
  return potentialValue ? formatCompactCurrency(potentialValue) : 'Nicht angegeben';
})()}
```

#### 2. Edit Form Simplification
```jsx
// OLD: Two separate fields
<input ... budget_min ... />
<input ... budget_max ... />

// NEW: Single field
<input 
  value={editingContact.budget ?? editingContact.budget_max ?? ''}
  onChange={(e) => {
    const n = parseEuroNumber(e.target.value);
    updateEditingContact('budget', n);
    // Update legacy fields for compatibility
    updateEditingContact('budget_max', n);
  }}
/>
```

#### 3. Save Handler
```javascript
// Use budget field, fallback to budget_max/value
let budget = editingContact.budget || editingContact.budget_max || editingContact.value;

const updateData = {
  ...otherFields,
  budget: budget ? parseFloat(budget) : undefined,
  // No more budget_min/budget_max in API calls
};
```

### Migration Strategy

#### 1. Database Migration
```python
# backend/app/migrations/0003_contact_budget_field.py
def migrate_budget_max_to_budget(apps, schema_editor):
    Contact = apps.get_model('app', 'Contact')
    for contact in Contact.objects.filter(budget__isnull=True, budget_max__isnull=False):
        contact.budget = contact.budget_max
        contact.save(update_fields=['budget'])
```

#### 2. Run Migration
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

#### 3. Data Migration Script (Optional)
```python
# backend/migrate_contact_budgets.py
from app.db.models import Contact

# Migrate all existing contacts
for contact in Contact.objects.all():
    if not contact.budget and contact.budget_max:
        contact.budget = contact.budget_max
        contact.save(update_fields=['budget'])
        print(f"Migrated {contact.name}: budget_max → budget")
```

## Testing Checklist

### Backend Testing

- [ ] Create new contact with budget field
- [ ] Update existing contact budget
- [ ] Verify CIM endpoint returns matching properties
- [ ] Check ContactResponse includes budget field
- [ ] Verify migration script runs without errors

### Frontend Testing

- [ ] Header displays "Potenzialwert" correctly
- [ ] Edit form shows single budget field
- [ ] Saving contact updates budget
- [ ] CIM triggers after budget change
- [ ] Old contacts display correctly (fallback works)

### Integration Testing

- [ ] Create contact with budget 200000
- [ ] Verify header shows "€200.000"
- [ ] Check CIM finds matching properties
- [ ] Edit budget to 300000
- [ ] Verify CIM updates matches
- [ ] Delete budget (set to empty)
- [ ] Verify header shows "Nicht angegeben"

## API Changes

### Old API (Deprecated)
```json
POST /api/v1/contacts
{
  "name": "Test",
  "budget_min": 150000,
  "budget_max": 200000
}
```

### New API
```json
POST /api/v1/contacts
{
  "name": "Test",
  "budget": 200000
}
```

### Response (Both included for compatibility)
```json
{
  "id": "uuid",
  "name": "Test",
  "budget": 200000,
  "budget_min": null,
  "budget_max": 200000,  // Kept for backward compatibility
  ...
}
```

## CIM Integration

### Before Change
- Used `budget_max` only
- Ignored if `budget_max` was null
- No fallback logic

### After Change
```python
# Use budget field with fallback
budget = float(contact.budget) if contact.budget else None
if budget is None and contact.budget_max:
    budget = float(contact.budget_max)

# Find matching properties
if budget:
    matching_props = Property.objects.filter(
        price__lte=budget * 1.1
    )
```

### Automatic CIM Trigger
- Frontend refetches contact after save
- CIM recalculates matches on next load
- Header updates automatically
- Perfect matches update automatically

## Rollback Plan

If issues occur:

### 1. Revert Backend
```bash
git checkout HEAD~1 backend/app/db/models/__init__.py
git checkout HEAD~1 backend/app/schemas/
git checkout HEAD~1 backend/app/services/
```

### 2. Revert Frontend
```bash
git checkout HEAD~1 real-estate-dashboard/src/components/contacts/
```

### 3. Revert Migration
```bash
python manage.py migrate app 0002  # Go back to previous migration
```

## Benefits

✅ **Single source of truth**: One `budget` field instead of two
✅ **Header displays correctly**: Uses `budget` with fallback logic
✅ **CIM reacts reliably**: Automatic matching after save
✅ **Backward compatible**: Old data still works via fallback
✅ **Cleaner API**: Simpler request/response structure
✅ **Better UX**: One field = less confusion
✅ **Migration safe**: Old fields kept, gradual migration

## Next Steps

1. Run backend migration
2. Test with existing contacts
3. Create new test contact
4. Verify CIM matching works
5. Monitor logs for errors
6. After 1 week: Consider removing `budget_min`/`budget_max` fields

## Notes

- `budget_currency` field remains unchanged
- `budget_min` might be removed in future (not used in CIM)
- Frontend still updates `budget_max` for backward compatibility
- Backend response includes all fields for gradual migration
- No UI/styling changes - pure logic refactoring

## Author & Date

- **Implemented**: 13. Oktober 2025
- **Version**: 2.0
- **Breaking Changes**: None (backward compatible)
- **Related Docs**: 
  - `CIM_MATCHING_IMPLEMENTATION.md`
  - `POTENZIALWERT_DISPLAY_UPDATE.md`
