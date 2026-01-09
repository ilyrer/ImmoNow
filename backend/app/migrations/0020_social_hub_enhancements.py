# Generated migration for social hub enhancements and property auto-publish

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0019_alter_tenant_plan"),
    ]

    operations = [
        # SocialAccount model has been moved to communications app
        # Property model has been moved to properties app
        # All operations are no longer needed
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
