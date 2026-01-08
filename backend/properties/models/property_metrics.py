"""
Property Metrics Models
"""
import uuid
from django.db import models


class PropertyMetrics(models.Model):
    """
    Aggregated property performance metrics.
    Stores cumulative metrics that are synced from portals.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(
        'properties.Property', on_delete=models.CASCADE, related_name="metrics"
    )

    # Aggregated metrics from all portals
    total_views = models.IntegerField(
        default=0, help_text="Total page views across all portals"
    )
    total_inquiries = models.IntegerField(default=0, help_text="Total contact requests")
    total_favorites = models.IntegerField(default=0, help_text="Total saves/favorites")
    total_clicks = models.IntegerField(default=0, help_text="Total clicks on listing")
    total_visits = models.IntegerField(default=0, help_text="Total scheduled visits")

    # Portal-specific metrics (JSON for flexibility)
    immoscout_views = models.IntegerField(default=0)
    immoscout_inquiries = models.IntegerField(default=0)
    immoscout_favorites = models.IntegerField(default=0)

    immowelt_views = models.IntegerField(default=0)
    immowelt_inquiries = models.IntegerField(default=0)
    immowelt_favorites = models.IntegerField(default=0)

    # Calculated fields
    conversion_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0, help_text="Inquiries/Views * 100"
    )
    avg_view_duration = models.IntegerField(
        default=0, help_text="Average view duration in seconds"
    )

    # Timestamps
    last_synced_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "property_metrics"
        indexes = [
            models.Index(fields=["property"]),
            models.Index(fields=["total_views"]),
            models.Index(fields=["total_inquiries"]),
            models.Index(fields=["last_synced_at"]),
        ]
        app_label = 'properties'

    def __str__(self):
        return f"Metrics for {self.property.title}"

    def calculate_totals(self):
        """Calculate total metrics from portal-specific values"""
        self.total_views = self.immoscout_views + self.immowelt_views
        self.total_inquiries = self.immoscout_inquiries + self.immowelt_inquiries
        self.total_favorites = self.immoscout_favorites + self.immowelt_favorites

        if self.total_views > 0:
            self.conversion_rate = (self.total_inquiries / self.total_views) * 100
        else:
            self.conversion_rate = 0

    def save(self, *args, **kwargs):
        self.calculate_totals()
        super().save(*args, **kwargs)


class PropertyMetricsSnapshot(models.Model):
    """
    Daily snapshot of property metrics for historical tracking and charts.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        'properties.Property', on_delete=models.CASCADE, related_name="metrics_snapshots"
    )

    # Daily metrics
    date = models.DateField()
    views = models.IntegerField(default=0)
    inquiries = models.IntegerField(default=0)
    favorites = models.IntegerField(default=0)
    clicks = models.IntegerField(default=0)
    visits = models.IntegerField(default=0)

    # Source breakdown
    immoscout_views = models.IntegerField(default=0)
    immoscout_inquiries = models.IntegerField(default=0)
    immowelt_views = models.IntegerField(default=0)
    immowelt_inquiries = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "property_metrics_snapshots"
        unique_together = [["property", "date"]]
        indexes = [
            models.Index(fields=["property", "date"]),
            models.Index(fields=["date"]),
        ]
        ordering = ["-date"]
        app_label = 'properties'

    def __str__(self):
        return f"Metrics for {self.property.title} on {self.date}"
