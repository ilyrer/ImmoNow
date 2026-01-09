# Generated migration for lead_score_details field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0013_alter_tenant_name"),
    ]

    operations = [
        # Contact model has been moved to contacts app
        # This operation is no longer needed
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
