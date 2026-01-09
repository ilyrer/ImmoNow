from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0023_contact_additional_info_contact_address_and_more"),
    ]

    operations = [
        # Team, Channel, Message, ChannelMembership, Attachment, Reaction, ResourceLink models have been moved to communications app
        # All operations are no longer needed
        migrations.RunPython(migrations.RunPython.noop, migrations.RunPython.noop),
    ]
