"""
Property Core Models
"""
import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Property(models.Model):
    """Property model"""

    PROPERTY_TYPE_CHOICES = [
        ("apartment", "Apartment"),
        ("house", "House"),
        ("commercial", "Commercial"),
        ("land", "Land"),
        ("office", "Office"),
        ("retail", "Retail"),
        ("industrial", "Industrial"),
    ]

    PRICE_TYPE_CHOICES = [
        ("sale", "Sale"),
        ("rent", "Rent"),
    ]

    STATUS_CHOICES = [
        ("akquise", "Akquise"),
        ("vorbereitung", "Vorbereitung"),
        ("aktiv", "Aktiv"),
        ("reserviert", "Reserviert"),
        ("verkauft", "Verkauft"),
        ("zurückgezogen", "Zurückgezogen"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        'accounts.Tenant', on_delete=models.CASCADE, related_name="properties"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=50, default="vorbereitung", choices=STATUS_CHOICES
    )
    property_type = models.CharField(max_length=50, choices=PROPERTY_TYPE_CHOICES)

    # Price fields
    price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    price_currency = models.CharField(max_length=3, default="EUR")
    price_type = models.CharField(
        max_length=20, choices=PRICE_TYPE_CHOICES, default="sale"
    )

    location = models.CharField(max_length=255)

    # Area fields
    living_area = models.IntegerField(
        blank=True, null=True, help_text="Wohnfläche in m²"
    )
    total_area = models.IntegerField(
        blank=True, null=True, help_text="Gesamtfläche in m²"
    )
    plot_area = models.IntegerField(
        blank=True, null=True, help_text="Grundstücksfläche in m²"
    )

    # Room fields
    rooms = models.IntegerField(blank=True, null=True, help_text="Anzahl Zimmer")
    bedrooms = models.IntegerField(
        blank=True, null=True, help_text="Anzahl Schlafzimmer"
    )
    bathrooms = models.IntegerField(blank=True, null=True, help_text="Anzahl Bäder")
    floors = models.IntegerField(blank=True, null=True, help_text="Anzahl Etagen")

    # Building info
    year_built = models.IntegerField(blank=True, null=True)
    energy_class = models.CharField(max_length=10, blank=True, null=True)
    energy_consumption = models.IntegerField(blank=True, null=True, help_text="kWh/m²a")
    heating_type = models.CharField(max_length=100, blank=True, null=True)

    # Energy Certificate fields
    energy_certificate_type = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        choices=[
            ("bedarfsausweis", "Bedarfsausweis"),
            ("verbrauchsausweis", "Verbrauchsausweis"),
        ],
    )
    energy_certificate_valid_until = models.DateField(blank=True, null=True)
    energy_certificate_issue_date = models.DateField(blank=True, null=True)
    co2_emissions = models.IntegerField(
        blank=True, null=True, help_text="CO₂-Emissionen in kg/m²a"
    )

    # Location coordinates
    coordinates_lat = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )
    coordinates_lng = models.DecimalField(
        max_digits=9, decimal_places=6, blank=True, null=True
    )

    # Additional data
    amenities = models.JSONField(
        default=list, blank=True, help_text="Liste von Ausstattungsmerkmalen"
    )
    tags = models.JSONField(
        default=list, blank=True, help_text="Tags für Kategorisierung"
    )

    # Auto-publish settings for portal integration
    auto_publish_enabled = models.BooleanField(
        default=False, help_text="Automatisch auf Portalen aktualisieren"
    )
    auto_publish_portals = models.JSONField(
        default=list, blank=True, help_text="Liste von Portalen für Auto-Publish"
    )
    auto_publish_interval_hours = models.IntegerField(
        default=2,
        help_text="Intervall in Stunden für Auto-Publish (2.4h = 10x täglich)",
    )
    last_auto_published_at = models.DateTimeField(
        blank=True, null=True, help_text="Letzter Auto-Publish Zeitpunkt"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE)

    class Meta:
        db_table = "properties"
        indexes = [
            models.Index(fields=["tenant", "status"]),
            models.Index(fields=["tenant", "property_type"]),
            models.Index(fields=["tenant", "price"]),
            models.Index(fields=["tenant", "created_at"]),
        ]
        app_label = 'properties'

    def __str__(self):
        return self.title


class Address(models.Model):
    """Address model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(
        Property, on_delete=models.CASCADE, related_name="address"
    )
    street = models.CharField(max_length=255)
    house_number = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10)
    postal_code = models.CharField(
        max_length=10, blank=True, null=True, help_text="Alias für zip_code"
    )
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, default="Deutschland")

    class Meta:
        db_table = "addresses"
        app_label = 'properties'

    def __str__(self):
        return f"{self.street}, {self.zip_code} {self.city}"


class ContactPerson(models.Model):
    """Contact person model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="contact_persons"
    )
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    role = models.CharField(max_length=100)

    class Meta:
        db_table = "contact_persons"
        app_label = 'properties'

    def __str__(self):
        return f"{self.name} ({self.role})"


class PropertyFeatures(models.Model):
    """Property features model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.OneToOneField(
        Property, on_delete=models.CASCADE, related_name="features"
    )
    bedrooms = models.IntegerField(blank=True, null=True)
    bathrooms = models.IntegerField(blank=True, null=True)
    year_built = models.IntegerField(blank=True, null=True)
    energy_class = models.CharField(max_length=10, blank=True, null=True)
    heating_type = models.CharField(max_length=100, blank=True, null=True)
    parking_spaces = models.IntegerField(blank=True, null=True)
    balcony = models.BooleanField(default=False)
    garden = models.BooleanField(default=False)
    elevator = models.BooleanField(default=False)

    class Meta:
        db_table = "property_features"
        app_label = 'properties'

    def __str__(self):
        return f"Features for {self.property.title}"


class PropertyImage(models.Model):
    """Property image model"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="images"
    )
    file = models.FileField(upload_to="properties/images/%Y/%m/", blank=True, null=True)
    url = models.URLField(blank=True, null=True)
    thumbnail_url = models.URLField(blank=True, null=True)
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    size = models.IntegerField(default=0, help_text="File size in bytes")
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    uploaded_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        db_table = "property_images"
        indexes = [
            models.Index(fields=["property", "order"]),
            models.Index(fields=["property", "is_primary"]),
        ]
        app_label = 'properties'

    def __str__(self):
        return f"Image for {self.property.title}"


class PropertyDocument(models.Model):
    """Property document model"""

    DOCUMENT_TYPE_CHOICES = [
        ("expose", "Exposé"),
        ("floor_plan", "Grundriss"),
        ("energy_certificate", "Energieausweis"),
        ("contract", "Vertrag"),
        ("protocol", "Protokoll"),
        ("other", "Sonstiges"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="documents"
    )
    file = models.FileField(upload_to="properties/documents/%Y/%m/")
    url = models.URLField(blank=True, null=True)
    name = models.CharField(max_length=255)
    document_type = models.CharField(
        max_length=50, choices=DOCUMENT_TYPE_CHOICES, default="other"
    )
    size = models.IntegerField(default=0, help_text="File size in bytes")
    mime_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, blank=True
    )

    class Meta:
        db_table = "property_documents"
        indexes = [
            models.Index(fields=["property", "document_type"]),
            models.Index(fields=["property", "uploaded_at"]),
        ]
        app_label = 'properties'

    def __str__(self):
        return f"{self.name} for {self.property.title}"
