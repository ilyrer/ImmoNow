from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0024_communications"),
    ]

    operations = [
        migrations.AlterField(
            model_name="resourcelink",
            name="resource_type",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("contact", "Contact"),
                    ("property", "Property"),
                    ("task", "Task"),
                ],
            ),
        ),
    ]

