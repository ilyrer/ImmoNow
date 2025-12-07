# Generated migration for social hub enhancements and property auto-publish

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0019_alter_tenant_plan"),
    ]

    operations = [
        # Expand SocialAccount platform choices and add new fields
        migrations.AlterField(
            model_name="socialaccount",
            name="platform",
            field=models.CharField(
                choices=[
                    ("facebook", "Facebook"),
                    ("linkedin", "LinkedIn"),
                    ("twitter", "Twitter"),
                    ("instagram", "Instagram"),
                    ("youtube", "YouTube"),
                    ("tiktok", "TikTok"),
                    ("pinterest", "Pinterest"),
                    ("immoscout24", "ImmoScout24"),
                    ("immowelt", "Immowelt"),
                    ("immonet", "Immonet"),
                    ("ebay_kleinanzeigen", "eBay Kleinanzeigen"),
                ],
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="socialaccount",
            name="account_label",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="socialaccount",
            name="updated_at",
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AddField(
            model_name="socialaccount",
            name="follower_count",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="socialaccount",
            name="following_count",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="socialaccount",
            name="post_count",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="socialaccount",
            name="profile_url",
            field=models.URLField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="socialaccount",
            name="avatar_url",
            field=models.URLField(blank=True, null=True),
        ),
        # Property auto-publish fields
        migrations.AddField(
            model_name="property",
            name="auto_publish_enabled",
            field=models.BooleanField(
                default=False, help_text="Automatisch auf Portalen aktualisieren"
            ),
        ),
        migrations.AddField(
            model_name="property",
            name="auto_publish_portals",
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Liste von Portalen für Auto-Publish",
            ),
        ),
        migrations.AddField(
            model_name="property",
            name="auto_publish_interval_hours",
            field=models.IntegerField(
                default=2,
                help_text="Intervall in Stunden für Auto-Publish (2.4h = 10x täglich)",
            ),
        ),
        migrations.AddField(
            model_name="property",
            name="last_auto_published_at",
            field=models.DateTimeField(
                blank=True, help_text="Letzter Auto-Publish Zeitpunkt", null=True
            ),
        ),
    ]
