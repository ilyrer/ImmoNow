"""
File Upload Service for Communications with Enhanced Security
"""
import os
import uuid
import mimetypes
import hashlib
from pathlib import Path
from typing import Optional, Dict, Any
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from app.db.models import MessageAttachment, Message


class FileUploadService:
    """Service for handling file uploads in communications with enhanced security"""
    
    # Allowed file types and their max sizes
    ALLOWED_TYPES = {
        'image/jpeg': 5 * 1024 * 1024,  # 5MB
        'image/png': 5 * 1024 * 1024,   # 5MB
        'image/gif': 5 * 1024 * 1024,   # 5MB
        'image/webp': 5 * 1024 * 1024,  # 5MB
        'application/pdf': 10 * 1024 * 1024,  # 10MB
        'video/mp4': 50 * 1024 * 1024,  # 50MB
        'video/webm': 50 * 1024 * 1024, # 50MB
        'audio/mp3': 20 * 1024 * 1024,  # 20MB
        'audio/wav': 20 * 1024 * 1024,  # 20MB
        'text/plain': 1 * 1024 * 1024,  # 1MB
        'application/msword': 10 * 1024 * 1024,  # 10MB
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 10 * 1024 * 1024,  # 10MB
        'application/vnd.ms-excel': 10 * 1024 * 1024,  # 10MB
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 10 * 1024 * 1024,  # 10MB
    }
    
    # Dangerous file extensions to block
    DANGEROUS_EXTENSIONS = {
        '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
        '.app', '.deb', '.pkg', '.dmg', '.iso', '.msi', '.run', '.sh', '.ps1'
    }
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
    
    def validate_file_security(self, file: UploadedFile) -> Dict[str, Any]:
        """Enhanced file security validation"""
        # Check file extension
        file_extension = Path(file.name).suffix.lower()
        if file_extension in self.DANGEROUS_EXTENSIONS:
            return {
                'valid': False,
                'error': f'Dangerous file extension not allowed: {file_extension}'
            }
        
        # Check file size
        if file.size > settings.FILE_UPLOAD_MAX_MEMORY_SIZE:
            return {
                'valid': False,
                'error': f'File too large. Maximum size: {settings.FILE_UPLOAD_MAX_MEMORY_SIZE / (1024*1024):.1f}MB'
            }
        
        # Check MIME type
        mime_type = file.content_type or mimetypes.guess_type(file.name)[0]
        if mime_type not in self.ALLOWED_TYPES:
            return {
                'valid': False,
                'error': f'File type not allowed. Allowed types: {", ".join(self.ALLOWED_TYPES.keys())}'
            }
        
        # Check specific file type size limit
        if file.size > self.ALLOWED_TYPES[mime_type]:
            max_size_mb = self.ALLOWED_TYPES[mime_type] / (1024 * 1024)
            return {
                'valid': False,
                'error': f'File too large for {mime_type}. Maximum size: {max_size_mb:.1f}MB'
            }
        
        # Basic file content validation
        if not self._validate_file_content(file):
            return {
                'valid': False,
                'error': 'File content validation failed'
            }
        
        return {
            'valid': True,
            'mime_type': mime_type,
            'size': file.size,
            'extension': file_extension
        }
    
    def _validate_file_content(self, file: UploadedFile) -> bool:
        """Basic file content validation"""
        try:
            # Read first few bytes to check for magic numbers
            file.seek(0)
            header = file.read(1024)
            file.seek(0)  # Reset file pointer
            
            # Check for common dangerous patterns
            dangerous_patterns = [
                b'<script',
                b'javascript:',
                b'vbscript:',
                b'data:text/html',
                b'<?php',
                b'<iframe',
                b'<object',
                b'<embed'
            ]
            
            header_lower = header.lower()
            for pattern in dangerous_patterns:
                if pattern in header_lower:
                    return False
            
            return True
        except Exception:
            return False
    
    def generate_file_hash(self, file: UploadedFile) -> str:
        """Generate SHA-256 hash of file content"""
        file.seek(0)
        hasher = hashlib.sha256()
        
        # Read file in chunks to handle large files
        for chunk in iter(lambda: file.read(8192), b""):
            hasher.update(chunk)
        
        file.seek(0)  # Reset file pointer
        return hasher.hexdigest()
    
    def validate_file(self, file: UploadedFile) -> Dict[str, Any]:
        """Validate uploaded file with enhanced security"""
        return self.validate_file_security(file)
    
    def generate_file_path(self, message_id: str, file: UploadedFile) -> str:
        """Generate tenant-isolated file path"""
        file_extension = Path(file.name).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        
        # Tenant-isolated path: media/tenant_id/messages/message_id/filename
        file_path = Path(settings.MEDIA_ROOT) / self.tenant_id / 'messages' / message_id / unique_filename
        
        return str(file_path)
    
    def save_file(self, file: UploadedFile, message_id: str) -> Dict[str, Any]:
        """Save uploaded file to disk with security checks"""
        validation = self.validate_file(file)
        if not validation['valid']:
            return validation
        
        try:
            # Generate file path
            file_path = self.generate_file_path(message_id, file)
            file_dir = Path(file_path).parent
            
            # Create directory if it doesn't exist
            file_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate file hash for duplicate detection
            file_hash = self.generate_file_hash(file)
            
            # Check for duplicate files
            if self._is_duplicate_file(file_hash):
                return {
                    'valid': False,
                    'error': 'Duplicate file detected'
                }
            
            # Save file
            with open(file_path, 'wb') as f:
                for chunk in file.chunks():
                    f.write(chunk)
            
            # Generate relative URL
            relative_path = Path(file_path).relative_to(settings.MEDIA_ROOT)
            file_url = f"{settings.MEDIA_URL}{relative_path.as_posix()}"
            
            return {
                'valid': True,
                'file_path': str(file_path),
                'file_url': file_url,
                'file_name': file.name,
                'file_size': file.size,
                'mime_type': validation['mime_type'],
                'file_hash': file_hash
            }
            
        except Exception as e:
            return {
                'valid': False,
                'error': f'Failed to save file: {str(e)}'
            }
    
    def _is_duplicate_file(self, file_hash: str) -> bool:
        """Check if file with same hash already exists"""
        try:
            from app.db.models import MessageAttachment
            return MessageAttachment.objects.filter(file_hash=file_hash).exists()
        except Exception:
            return False
    
    def create_attachment(self, message_id: str, file_info: Dict[str, Any]) -> Optional[MessageAttachment]:
        """Create attachment record in database"""
        try:
            attachment = MessageAttachment.objects.create(
                message_id=message_id,
                file_name=file_info['file_name'],
                file_size=file_info['file_size'],
                file_type=file_info['mime_type'],
                file_url=file_info['file_url'],
                file_hash=file_info.get('file_hash', '')
            )
            return attachment
        except Exception as e:
            print(f"Error creating attachment: {e}")
            return None
    
    def delete_file(self, file_path: str) -> bool:
        """Delete file from disk"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            print(f"Error deleting file: {e}")
            return False
    
    def cleanup_message_files(self, message_id: str) -> bool:
        """Clean up all files for a message"""
        try:
            message_dir = Path(settings.MEDIA_ROOT) / self.tenant_id / 'messages' / message_id
            if message_dir.exists():
                import shutil
                shutil.rmtree(message_dir)
            return True
        except Exception as e:
            print(f"Error cleaning up message files: {e}")
            return False