from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("app", "0023_contact_additional_info_contact_address_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Team",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("name", models.CharField(max_length=120)),
                ("description", models.TextField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="teams_created", to="app.user")),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="teams", to="app.tenant")),
            ],
            options={
                "db_table": "teams",
                "unique_together": {("tenant", "name")},
            },
        ),
        migrations.CreateModel(
            name="Channel",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("name", models.CharField(max_length=120)),
                ("topic", models.CharField(max_length=255, blank=True, null=True)),
                ("is_private", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="channels_created", to="app.user")),
                ("team", models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, related_name="channels", to="app.team")),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="channels", to="app.tenant")),
            ],
            options={
                "db_table": "channels",
                "unique_together": {("tenant", "name", "team")},
            },
        ),
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("content", models.TextField()),
                ("has_attachments", models.BooleanField(default=False)),
                ("is_deleted", models.BooleanField(default=False)),
                ("edited_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("channel", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="messages", to="app.channel")),
                ("parent", models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, related_name="replies", to="app.message")),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="messages", to="app.tenant")),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="messages", to="app.user")),
            ],
            options={
                "db_table": "messages",
                "ordering": ["created_at"],
            },
        ),
        migrations.CreateModel(
            name="ChannelMembership",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("role", models.CharField(choices=[("owner", "Owner"), ("member", "Member"), ("guest", "Guest")], default="member", max_length=10)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("channel", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="memberships", to="app.channel")),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="channel_memberships", to="app.tenant")),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="channel_memberships", to="app.user")),
            ],
            options={
                "db_table": "channel_memberships",
                "unique_together": {("channel", "user")},
            },
        ),
        migrations.CreateModel(
            name="Attachment",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("file_url", models.URLField()),
                ("file_name", models.CharField(max_length=255)),
                ("file_type", models.CharField(max_length=100, blank=True, null=True)),
                ("file_size", models.IntegerField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("message", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="attachments", to="app.message")),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="attachments", to="app.tenant")),
            ],
            options={
                "db_table": "attachments",
            },
        ),
        migrations.CreateModel(
            name="Reaction",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("emoji", models.CharField(max_length=32)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("message", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="reactions", to="app.message")),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="reactions", to="app.tenant")),
                ("user", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="reactions", to="app.user")),
            ],
            options={
                "db_table": "reactions",
                "unique_together": {("message", "user", "emoji")},
            },
        ),
        migrations.CreateModel(
            name="ResourceLink",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("resource_type", models.CharField(choices=[("contact", "Contact"), ("property", "Property")], max_length=20)),
                ("resource_id", models.UUIDField()),
                ("label", models.CharField(blank=True, max_length=255, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("message", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="resource_links", to="app.message")),
                ("tenant", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="resource_links", to="app.tenant")),
            ],
            options={
                "db_table": "resource_links",
            },
        ),
        # Indexes
        migrations.AddIndex(
            model_name="team",
            index=models.Index(fields=["tenant", "name"], name="team_tenant_name_idx"),
        ),
        migrations.AddIndex(
            model_name="channel",
            index=models.Index(fields=["tenant", "team"], name="channel_tenant_team_idx"),
        ),
        migrations.AddIndex(
            model_name="channel",
            index=models.Index(fields=["tenant", "is_private"], name="channel_private_idx"),
        ),
        migrations.AddIndex(
            model_name="channelmembership",
            index=models.Index(fields=["tenant", "channel"], name="cm_tenant_channel_idx"),
        ),
        migrations.AddIndex(
            model_name="channelmembership",
            index=models.Index(fields=["tenant", "user"], name="cm_tenant_user_idx"),
        ),
        migrations.AddIndex(
            model_name="message",
            index=models.Index(fields=["tenant", "channel"], name="msg_tenant_channel_idx"),
        ),
        migrations.AddIndex(
            model_name="message",
            index=models.Index(fields=["tenant", "parent"], name="msg_tenant_parent_idx"),
        ),
        migrations.AddIndex(
            model_name="message",
            index=models.Index(fields=["tenant", "created_at"], name="msg_tenant_created_idx"),
        ),
        migrations.AddIndex(
            model_name="attachment",
            index=models.Index(fields=["tenant", "message"], name="att_tenant_message_idx"),
        ),
        migrations.AddIndex(
            model_name="reaction",
            index=models.Index(fields=["tenant", "message"], name="react_tenant_message_idx"),
        ),
        migrations.AddIndex(
            model_name="resourcelink",
            index=models.Index(fields=["tenant", "resource_type"], name="rl_tenant_type_idx"),
        ),
        migrations.AddIndex(
            model_name="resourcelink",
            index=models.Index(fields=["resource_id"], name="rl_resource_id_idx"),
        ),
    ]

