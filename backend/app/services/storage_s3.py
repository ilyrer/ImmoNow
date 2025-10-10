"""
Storage Service for S3/MinIO
"""
import uuid
import boto3
from botocore.exceptions import ClientError
from typing import Dict, Any, Optional
from fastapi import UploadFile, HTTPException

from app.core.settings import settings
from app.core.errors import ValidationError


class StorageService:
    """Storage service for file uploads to S3/MinIO"""
    
    def __init__(self):
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION
            )
        else:
            # Fallback to local storage for development
            self.s3_client = None
        
        self.bucket_name = settings.AWS_S3_BUCKET
        self.max_file_size = settings.MAX_FILE_SIZE
    
    async def upload_file(
        self, 
        file: UploadFile, 
        tenant_id: str,
        folder_path: str = ""
    ) -> Dict[str, Any]:
        """Upload file to storage"""
        
        # File validation
        if file.size > self.max_file_size:
            raise ValidationError(f"File too large. Maximum size is {self.max_file_size} bytes")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        filename = f"{file_id}.{file_extension}" if file_extension else file_id
        
        if self.s3_client and self.bucket_name:
            # Upload to S3
            s3_key = f"{tenant_id}/documents/{folder_path}/{filename}"
            
            try:
                self.s3_client.upload_fileobj(
                    file.file, 
                    self.bucket_name, 
                    s3_key,
                    ExtraArgs={
                        'ContentType': file.content_type or 'application/octet-stream',
                        'Metadata': {
                            'original-name': file.filename or '',
                            'tenant-id': tenant_id
                        }
                    }
                )
                
                url = f"https://{self.bucket_name}.s3.{settings.AWS_S3_REGION}.amazonaws.com/{s3_key}"
                
            except ClientError as e:
                raise ValidationError(f"Upload failed: {str(e)}")
        else:
            # Local storage fallback
            import os
            upload_dir = f"uploads/{tenant_id}/documents/{folder_path}"
            os.makedirs(upload_dir, exist_ok=True)
            
            file_path = os.path.join(upload_dir, filename)
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            url = f"/uploads/{tenant_id}/documents/{folder_path}/{filename}"
        
        return {
            'file_id': file_id,
            'filename': filename,
            'url': url,
            'size': file.size,
            'mime_type': file.content_type or 'application/octet-stream',
            'original_name': file.filename or ''
        }
    
    async def delete_file(self, url: str, tenant_id: str) -> bool:
        """Delete file from storage"""
        
        if self.s3_client and self.bucket_name:
            # Extract S3 key from URL
            try:
                s3_key = url.split(f"{self.bucket_name}.s3.{settings.AWS_S3_REGION}.amazonaws.com/")[1]
                self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
                return True
            except (IndexError, ClientError):
                return False
        else:
            # Local storage fallback
            import os
            try:
                file_path = url.replace("/uploads/", "uploads/")
                if os.path.exists(file_path):
                    os.remove(file_path)
                    return True
            except OSError:
                pass
            
            return False
