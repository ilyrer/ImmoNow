# Generated migration for Contact budget field
from django.db import migrations, models


def migrate_budget_max_to_budget(apps, schema_editor):
    """Migrate budget_max values to new budget field"""
    Contact = apps.get_model('app', 'Contact')
    for contact in Contact.objects.filter(budget__isnull=True, budget_max__isnull=False):
        contact.budget = contact.budget_max
        contact.save(update_fields=['budget'])


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0006_contact_avatar_contact_category_contact_last_contact_and_more'),
    ]

    operations = [
        # Add new budget field
        migrations.AddField(
            model_name='contact',
            name='budget',
            field=models.DecimalField(blank=True, decimal_places=2, help_text='Hauptbudget / Potenzialwert', max_digits=12, null=True),
        ),
        # Run data migration
        migrations.RunPython(migrate_budget_max_to_budget, reverse_code=migrations.RunPython.noop),
    ]
