from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0024_communications"),
    ]

    operations = [
        # ResourceLink model has been moved to communications app
        # Task model has been moved to tasks app
        # All operations are no longer needed
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
