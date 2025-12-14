"""
Location Market Data Model
Stores dynamic city/location data with market pricing information
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class LocationMarketData(models.Model):
    """
    Dynamic location market data for AVM pricing.
    Allows flexible addition of cities, towns, villages without code changes.
    """

    # Location Info
    city = models.CharField(
        max_length=200, db_index=True, help_text="City, town, or village name"
    )
    state = models.CharField(
        max_length=100, blank=True, help_text="State/Bundesland (e.g., Bayern, Berlin)"
    )
    country = models.CharField(
        max_length=100, default="Deutschland", help_text="Country name"
    )

    # Postal Code Ranges
    postal_code_start = models.CharField(
        max_length=10,
        blank=True,
        db_index=True,
        help_text="Start of postal code range (e.g., 80000)",
    )
    postal_code_end = models.CharField(
        max_length=10, blank=True, help_text="End of postal code range (e.g., 81999)"
    )

    # Market Data
    base_price_per_sqm = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Base market price per square meter in EUR",
    )

    # Premium Zone Flags
    is_premium_location = models.BooleanField(
        default=False, help_text="Premium location with +20% adjustment"
    )
    is_suburban = models.BooleanField(
        default=False, help_text="Suburban location with -5% adjustment"
    )

    # Optional metadata
    population = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Population size",
    )
    location_type = models.CharField(
        max_length=50,
        choices=[
            ("metropolis", "Metropole (>1M)"),
            ("city", "Großstadt (>100k)"),
            ("town", "Stadt (>10k)"),
            ("village", "Dorf/Gemeinde (<10k)"),
        ],
        default="city",
        help_text="Type of location",
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Active/Inactive flag
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="Whether this location is active for AVM calculations",
    )

    class Meta:
        db_table = "location_market_data"
        ordering = ["-population", "city"]
        verbose_name = "Location Market Data"
        verbose_name_plural = "Location Market Data"
        indexes = [
            models.Index(fields=["city", "is_active"]),
            models.Index(fields=["postal_code_start", "postal_code_end"]),
            models.Index(fields=["-population"]),
        ]

    def __str__(self):
        return f"{self.city} ({self.state}) - €{self.base_price_per_sqm}/m²"

    def get_adjusted_price(self) -> float:
        """
        Get the adjusted base price considering premium/suburban factors
        """
        price = float(self.base_price_per_sqm)

        if self.is_premium_location:
            price *= 1.20
        elif self.is_suburban:
            price *= 0.95

        return price

    def matches_postal_code(self, postal_code: str) -> bool:
        """
        Check if this location matches a given postal code
        """
        if not postal_code or not self.postal_code_start:
            return False

        try:
            code = int(postal_code[:5] if len(postal_code) >= 5 else postal_code)
            start = int(self.postal_code_start)
            end = int(self.postal_code_end) if self.postal_code_end else start + 999

            return start <= code <= end
        except (ValueError, TypeError):
            return False

    @classmethod
    def search_cities(cls, query: str, limit: int = 20):
        """
        Search for cities by name (case-insensitive, partial match)
        """
        return cls.objects.filter(city__icontains=query, is_active=True).order_by(
            "-population", "city"
        )[:limit]

    @classmethod
    def get_by_city(cls, city_name: str):
        """
        Get location by city name (case-insensitive, exact or partial match)
        """
        # Try exact match first
        result = cls.objects.filter(city__iexact=city_name, is_active=True).first()

        if result:
            return result

        # Try partial match
        return (
            cls.objects.filter(city__icontains=city_name, is_active=True)
            .order_by("-population")
            .first()
        )

    @classmethod
    def get_by_postal_code(cls, postal_code: str):
        """
        Get location by postal code
        """
        if not postal_code or len(postal_code) < 3:
            return None

        # Get all potential matches
        locations = cls.objects.filter(
            is_active=True, postal_code_start__isnull=False
        ).order_by("-population")

        for location in locations:
            if location.matches_postal_code(postal_code):
                return location

        return None
