# Generated migration for Contact budget field
from django.db import migrations, models


# Contact model has been moved to contacts app
# All these operations are no longer needed

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0006_contact_avatar_contact_category_contact_last_contact_and_more'),
    ]

    operations = [
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
