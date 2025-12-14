# Generated migration for lead_score_details field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0013_alter_tenant_name"),
    ]

    operations = [
        migrations.AddField(
            model_name="contact",
            name="lead_score_details",
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Detailed lead score breakdown and signals",
            ),
        ),
    ]
