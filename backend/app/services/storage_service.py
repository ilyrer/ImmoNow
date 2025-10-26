"""
Storage Service für S3/MinIO Integration
"""
import boto3
import logging
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError, NoCredentialsError
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)


class StorageService:
    """Service für Storage-Berechnung und -Management mit S3/MinIO"""
    
    def __init__(self):
        self.s3_client = None
        self.bucket_name = settings.AWS_S3_BUCKET
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize S3/MinIO client"""
        try:
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION,
                    endpoint_url=getattr(settings, 'AWS_S3_ENDPOINT_URL', None)  # For MinIO
                )
                logger.info("StorageService initialized with S3/MinIO client")
            else:
                logger.warning("StorageService: AWS credentials not configured, using mock mode")
        except Exception as e:
            logger.error(f"Failed to initialize StorageService: {e}")
    
    def get_tenant_storage_size(self, tenant_id: str) -> int:
        """
        Berechne Storage-Größe für einen Tenant
        
        Args:
            tenant_id: Tenant UUID
            
        Returns:
            Storage-Größe in Bytes
        """
        cache_key = f"tenant_storage_size_{tenant_id}"
        cached_size = cache.get(cache_key)
        
        if cached_size is not None:
            return cached_size
        
        try:
            if not self.s3_client or not self.bucket_name:
                logger.warning("S3 client not available, returning 0 storage size")
                return 0
            
            # Berechne Größe aller Objekte mit Tenant-Prefix
            prefix = f"tenants/{tenant_id}/"
            total_size = 0
            
            paginator = self.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            for page in page_iterator:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        total_size += obj['Size']
            
            # Cache für 5 Minuten
            cache.set(cache_key, total_size, 300)
            
            logger.info(f"Calculated storage size for tenant {tenant_id}: {total_size} bytes")
            return total_size
            
        except ClientError as e:
            logger.error(f"S3 error calculating storage for tenant {tenant_id}: {e}")
            return 0
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            return 0
        except Exception as e:
            logger.error(f"Unexpected error calculating storage for tenant {tenant_id}: {e}")
            return 0
    
    def get_object_size(self, key: str) -> int:
        """
        Hole Größe eines einzelnen Objekts
        
        Args:
            key: S3 Object Key
            
        Returns:
            Größe in Bytes, 0 wenn nicht gefunden
        """
        try:
            if not self.s3_client or not self.bucket_name:
                return 0
            
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=key
            )
            return response['ContentLength']
            
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                logger.warning(f"Object not found: {key}")
            else:
                logger.error(f"Error getting object size for {key}: {e}")
            return 0
        except Exception as e:
            logger.error(f"Unexpected error getting object size for {key}: {e}")
            return 0
    
    def list_tenant_objects(self, tenant_id: str, limit: int = 1000) -> list:
        """
        Liste alle Objekte für einen Tenant
        
        Args:
            tenant_id: Tenant UUID
            limit: Maximale Anzahl Objekte
            
        Returns:
            Liste von Objekt-Metadaten
        """
        try:
            if not self.s3_client or not self.bucket_name:
                return []
            
            prefix = f"tenants/{tenant_id}/"
            objects = []
            
            paginator = self.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(
                Bucket=self.bucket_name,
                Prefix=prefix,
                PaginationConfig={'MaxItems': limit}
            )
            
            for page in page_iterator:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        objects.append({
                            'key': obj['Key'],
                            'size': obj['Size'],
                            'last_modified': obj['LastModified'],
                            'storage_class': obj.get('StorageClass', 'STANDARD')
                        })
            
            return objects
            
        except Exception as e:
            logger.error(f"Error listing objects for tenant {tenant_id}: {e}")
            return []
    
    def delete_object(self, key: str) -> bool:
        """
        Lösche ein Objekt
        
        Args:
            key: S3 Object Key
            
        Returns:
            True wenn erfolgreich gelöscht
        """
        try:
            if not self.s3_client or not self.bucket_name:
                return False
            
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            logger.info(f"Deleted object: {key}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting object {key}: {e}")
            return False
    
    def get_storage_stats(self, tenant_id: str) -> Dict[str, Any]:
        """
        Hole detaillierte Storage-Statistiken für einen Tenant
        
        Args:
            tenant_id: Tenant UUID
            
        Returns:
            Dict mit Storage-Statistiken
        """
        try:
            objects = self.list_tenant_objects(tenant_id)
            
            total_size = sum(obj['size'] for obj in objects)
            total_objects = len(objects)
            
            # Gruppiere nach Dateityp
            file_types = {}
            for obj in objects:
                key = obj['key']
                if '.' in key:
                    ext = key.split('.')[-1].lower()
                    if ext not in file_types:
                        file_types[ext] = {'count': 0, 'size': 0}
                    file_types[ext]['count'] += 1
                    file_types[ext]['size'] += obj['size']
            
            # Top 10 größte Dateien
            largest_files = sorted(objects, key=lambda x: x['size'], reverse=True)[:10]
            
            return {
                'total_size_bytes': total_size,
                'total_size_mb': total_size / (1024 * 1024),
                'total_size_gb': total_size / (1024 * 1024 * 1024),
                'total_objects': total_objects,
                'file_types': file_types,
                'largest_files': largest_files,
                'last_calculated': None  # Wird vom Reconcile-Job gesetzt
            }
            
        except Exception as e:
            logger.error(f"Error getting storage stats for tenant {tenant_id}: {e}")
            return {
                'total_size_bytes': 0,
                'total_size_mb': 0,
                'total_size_gb': 0,
                'total_objects': 0,
                'file_types': {},
                'largest_files': [],
                'last_calculated': None
            }
    
    def invalidate_cache(self, tenant_id: str):
        """Invalidiere Cache für einen Tenant"""
        cache_key = f"tenant_storage_size_{tenant_id}"
        cache.delete(cache_key)
        logger.info(f"Invalidated storage cache for tenant {tenant_id}")


# Global instance
storage_service = StorageService()
