"""
Immowelt Service

Service for interacting with the Immowelt API to publish and manage
property listings on the Immowelt portal.

API Documentation: https://api.immowelt.com/docs
"""

import httpx
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from django.conf import settings
from properties.models import Property, PublishJob
from app.services.oauth_service import OAuthService
from app.services.rate_limit_manager import PlatformRateLimiter


class ImmoweltService:
    """
    Service for Immowelt API integration.

    Immowelt uses OAuth 2.0 for authentication and provides REST APIs
    for managing property listings.
    """

    BASE_URL = "https://api.immowelt.com/v1"
    SANDBOX_URL = "https://sandbox-api.immowelt.com/v1"

    def __init__(self):
        self.oauth_service = OAuthService()
        self.rate_limiter = PlatformRateLimiter()
        self.use_sandbox = getattr(settings, "IMMOWELT_USE_SANDBOX", True)

    @property
    def api_base(self) -> str:
        """Get the appropriate API base URL"""
        return self.SANDBOX_URL if self.use_sandbox else self.BASE_URL

    async def _get_access_token(self, tenant_id: str) -> Optional[str]:
        """
        Get a valid access token for Immowelt API.
        Automatically refreshes if expired.
        """
        from communications.models import SocialAccount

        try:
            account = await SocialAccount.objects.filter(
                tenant_id=tenant_id, platform="immowelt", is_active=True
            ).afirst()

            if not account:
                return None

            # Check if token needs refresh
            if account.token_expires_at and account.token_expires_at <= datetime.now():
                await self._refresh_token(account)

            return self.oauth_service.decrypt_token(account.access_token)

        except Exception as e:
            print(f"Error getting Immowelt access token: {e}")
            return None

    async def _refresh_token(self, account) -> bool:
        """Refresh the access token"""
        try:
            refresh_token = self.oauth_service.decrypt_token(account.refresh_token)

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://auth.immowelt.com/oauth2/token",
                    data={
                        "grant_type": "refresh_token",
                        "refresh_token": refresh_token,
                        "client_id": settings.IMMOWELT_CLIENT_ID,
                        "client_secret": settings.IMMOWELT_CLIENT_SECRET,
                    },
                )

                if response.status_code == 200:
                    token_data = response.json()

                    account.access_token = self.oauth_service.encrypt_token(
                        token_data["access_token"]
                    )
                    if token_data.get("refresh_token"):
                        account.refresh_token = self.oauth_service.encrypt_token(
                            token_data["refresh_token"]
                        )

                    expires_in = token_data.get("expires_in", 3600)
                    account.token_expires_at = datetime.now() + timedelta(
                        seconds=expires_in
                    )
                    await account.asave()

                    return True

        except Exception as e:
            print(f"Error refreshing Immowelt token: {e}")

        return False

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        tenant_id: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Make an authenticated request to the Immowelt API.
        Includes rate limiting.
        """
        # Check rate limit
        await self.rate_limiter.acquire("immowelt")

        access_token = await self._get_access_token(tenant_id)
        if not access_token:
            raise Exception("No valid Immowelt access token available")

        url = f"{self.api_base}{endpoint}"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params,
                timeout=30.0,
            )

            if response.status_code == 401:
                raise Exception("Immowelt authentication failed")
            elif response.status_code == 429:
                raise Exception("Immowelt rate limit exceeded")
            elif response.status_code >= 400:
                raise Exception(f"Immowelt API error: {response.text}")

            return response.json() if response.content else {}

    def _transform_property_to_immowelt(self, property_obj: Property) -> Dict[str, Any]:
        """
        Transform a Property model to Immowelt's expected format.
        """
        # Map property type to Immowelt categories
        type_mapping = {
            "apartment": "WOHNUNG",
            "house": "HAUS",
            "land": "GRUNDSTUECK",
            "commercial": "GEWERBE",
            "office": "BUERO_PRAXIS",
            "retail": "EINZELHANDEL",
            "garage": "GARAGE_STELLPLATZ",
        }

        # Map transaction type
        transaction_mapping = {
            "sale": "KAUF",
            "rent": "MIETE",
        }

        listing_data = {
            "objektart": type_mapping.get(property_obj.property_type, "WOHNUNG"),
            "vermarktungsart": transaction_mapping.get(
                property_obj.transaction_type, "KAUF"
            ),
            "titel": property_obj.title,
            "beschreibung": property_obj.description or "",
            "adresse": {
                "strasse": property_obj.street or "",
                "hausnummer": property_obj.street_number or "",
                "plz": property_obj.zip_code or "",
                "ort": property_obj.city or "",
                "land": property_obj.country or "DE",
            },
            "preise": {},
            "flaechen": {},
            "ausstattung": {},
            "kontakt": {},
        }

        # Add price information
        if property_obj.transaction_type == "sale":
            listing_data["preise"]["kaufpreis"] = float(property_obj.price or 0)
        else:
            listing_data["preise"]["kaltmiete"] = float(property_obj.price or 0)
            if property_obj.additional_costs:
                listing_data["preise"]["nebenkosten"] = float(
                    property_obj.additional_costs
                )

        # Add area information
        if property_obj.living_area:
            listing_data["flaechen"]["wohnflaeche"] = float(property_obj.living_area)
        if property_obj.land_area:
            listing_data["flaechen"]["grundstuecksflaeche"] = float(
                property_obj.land_area
            )
        if property_obj.rooms:
            listing_data["flaechen"]["anzahl_zimmer"] = float(property_obj.rooms)
        if property_obj.bedrooms:
            listing_data["flaechen"]["anzahl_schlafzimmer"] = int(property_obj.bedrooms)
        if property_obj.bathrooms:
            listing_data["flaechen"]["anzahl_badezimmer"] = int(property_obj.bathrooms)

        # Add features
        features = []
        if property_obj.has_balcony:
            features.append("BALKON")
        if property_obj.has_terrace:
            features.append("TERRASSE")
        if property_obj.has_garden:
            features.append("GARTEN")
        if property_obj.has_elevator:
            features.append("AUFZUG")
        if property_obj.has_garage:
            features.append("GARAGE")
        if property_obj.has_basement:
            features.append("KELLER")

        if features:
            listing_data["ausstattung"]["merkmale"] = features

        # Energy certificate
        if property_obj.energy_certificate_type:
            listing_data["energieausweis"] = {
                "ausweistyp": property_obj.energy_certificate_type.upper(),
                "kennwert": property_obj.energy_consumption_value,
                "energietraeger": property_obj.heating_type,
            }

        return listing_data

    async def publish_property(
        self, property_id: str, tenant_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Publish a property to Immowelt.

        Returns:
            Dict with publish_job_id, portal_property_id, portal_url
        """
        try:
            # Get property
            property_obj = await Property.objects.aget(id=property_id)

            # Create publish job
            publish_job = await PublishJob.objects.acreate(
                property=property_obj,
                portal="immowelt",
                status="publishing",
                created_by_id=user_id,
            )

            # Transform property data
            listing_data = self._transform_property_to_immowelt(property_obj)

            # Publish to Immowelt
            result = await self._make_request(
                method="POST",
                endpoint="/objects",
                tenant_id=tenant_id,
                data=listing_data,
            )

            # Update publish job with results
            publish_job.portal_property_id = result.get("id")
            publish_job.portal_url = result.get(
                "url", f"https://www.immowelt.de/expose/{result.get('id')}"
            )
            publish_job.status = "published"
            publish_job.published_at = datetime.now()
            await publish_job.asave()

            return {
                "publish_job_id": str(publish_job.id),
                "portal_property_id": publish_job.portal_property_id,
                "portal_url": publish_job.portal_url,
            }

        except Exception as e:
            if publish_job:
                publish_job.status = "error"
                publish_job.error_message = str(e)
                await publish_job.asave()
            raise

    async def update_property(
        self, property_id: str, tenant_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Update an existing property listing on Immowelt.
        """
        try:
            # Get publish job
            publish_job = await PublishJob.objects.filter(
                property_id=property_id, portal="immowelt", status="published"
            ).afirst()

            if not publish_job or not publish_job.portal_property_id:
                raise Exception("Property not published to Immowelt")

            # Get property
            property_obj = await Property.objects.aget(id=property_id)

            # Transform property data
            listing_data = self._transform_property_to_immowelt(property_obj)

            # Update on Immowelt
            result = await self._make_request(
                method="PUT",
                endpoint=f"/objects/{publish_job.portal_property_id}",
                tenant_id=tenant_id,
                data=listing_data,
            )

            # Update publish job timestamp
            publish_job.published_at = datetime.now()
            await publish_job.asave()

            return {
                "publish_job_id": str(publish_job.id),
                "portal_property_id": publish_job.portal_property_id,
                "portal_url": publish_job.portal_url,
                "updated": True,
            }

        except Exception as e:
            raise Exception(f"Failed to update property on Immowelt: {e}")

    async def unpublish_property(
        self, publish_job_id: str, tenant_id: str
    ) -> Dict[str, Any]:
        """
        Unpublish a property from Immowelt.
        """
        try:
            publish_job = await PublishJob.objects.aget(id=publish_job_id)

            if not publish_job.portal_property_id:
                raise Exception("No Immowelt property ID found")

            # Delete from Immowelt
            await self._make_request(
                method="DELETE",
                endpoint=f"/objects/{publish_job.portal_property_id}",
                tenant_id=tenant_id,
            )

            # Update job status
            publish_job.status = "unpublished"
            publish_job.unpublished_at = datetime.now()
            await publish_job.asave()

            return {
                "success": True,
                "unpublished_at": publish_job.unpublished_at.isoformat(),
            }

        except Exception as e:
            raise Exception(f"Failed to unpublish from Immowelt: {e}")

    async def get_property_metrics(
        self, portal_property_id: str, tenant_id: str
    ) -> Dict[str, Any]:
        """
        Get performance metrics for a property on Immowelt.
        """
        try:
            result = await self._make_request(
                method="GET",
                endpoint=f"/objects/{portal_property_id}/statistics",
                tenant_id=tenant_id,
            )

            return {
                "views": result.get("seitenaufrufe", 0),
                "inquiries": result.get("kontaktanfragen", 0),
                "favorites": result.get("merkzettel", 0),
                "clicks": result.get("klicks", 0),
                "print_views": result.get("druckansichten", 0),
                "last_updated": datetime.now().isoformat(),
            }

        except Exception as e:
            print(f"Error getting Immowelt metrics: {e}")
            return {
                "views": 0,
                "inquiries": 0,
                "favorites": 0,
                "clicks": 0,
                "print_views": 0,
                "error": str(e),
            }

    async def get_account_info(self, tenant_id: str) -> Dict[str, Any]:
        """
        Get account information from Immowelt.
        """
        try:
            result = await self._make_request(
                method="GET", endpoint="/account", tenant_id=tenant_id
            )

            return {
                "provider_id": result.get("id"),
                "company_name": result.get("firmenname"),
                "email": result.get("email"),
                "active_listings": result.get("aktive_objekte", 0),
                "max_listings": result.get("max_objekte", 0),
                "subscription_type": result.get("abo_typ"),
            }

        except Exception as e:
            raise Exception(f"Failed to get Immowelt account info: {e}")

    async def upload_images(
        self, portal_property_id: str, tenant_id: str, images: List[Dict[str, str]]
    ) -> List[Dict[str, Any]]:
        """
        Upload images for a property listing.

        Args:
            portal_property_id: Immowelt property ID
            tenant_id: Tenant ID for authentication
            images: List of dicts with 'url' and optionally 'title'
        """
        results = []

        for image in images:
            try:
                result = await self._make_request(
                    method="POST",
                    endpoint=f"/objects/{portal_property_id}/images",
                    tenant_id=tenant_id,
                    data={
                        "url": image.get("url"),
                        "titel": image.get("title", ""),
                        "typ": "BILD",
                    },
                )
                results.append(
                    {
                        "success": True,
                        "image_id": result.get("id"),
                        "url": image.get("url"),
                    }
                )
            except Exception as e:
                results.append(
                    {"success": False, "url": image.get("url"), "error": str(e)}
                )

        return results
