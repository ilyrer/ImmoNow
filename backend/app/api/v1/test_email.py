"""
Test Email Endpoint für Email-System
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, get_tenant_id
from app.db.models import User, TenantUser
from app.services.email_service import EmailService
from asgiref.sync import sync_to_async

router = APIRouter()


@router.post(
    "/test-email",
    summary="Send test email",
    description="Send a test email to verify email configuration"
)
async def send_test_email(
    token_data = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id)
):
    """Send test email to verify configuration"""
    try:
        # Get real User object from database
        user = await sync_to_async(User.objects.get)(id=token_data.user_id)
        
        # Get tenant user
        tenant_user = await sync_to_async(TenantUser.objects.get)(user=user, tenant__id=tenant_id)
        
        success = await EmailService.send_test_email(user, tenant_user.tenant)
        
        if success:
            return {
                "message": "Test email sent successfully!",
                "recipient": user.email,
                "provider": "configured_provider"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send test email"
            )
            
    except User.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except TenantUser.DoesNotExist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant user not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending test email: {str(e)}"
        )


@router.get(
    "/email-config",
    summary="Get email configuration",
    description="Get current email configuration (without sensitive data)"
)
async def get_email_config():
    """Get email configuration status"""
    from app.core.email_config import EmailConfig
    
    return {
        "provider": EmailConfig.PROVIDER.value,
        "enabled": EmailConfig.EMAIL_ENABLED,
        "from_email": EmailConfig.get_from_email(),
        "from_name": EmailConfig.get_from_name(),
        "configured": EmailConfig.is_provider_configured(),
        "frontend_url": EmailConfig.FRONTEND_URL
    }


@router.post(
    "/simple-test-email",
    summary="Send simple test email",
    description="Send a test email without authentication (for testing)"
)
async def send_simple_test_email():
    """Send test email without authentication"""
    try:
        from app.db.models import User, Tenant, TenantUser
        
        # Get first user and tenant for testing
        user = await sync_to_async(User.objects.first)()
        tenant = await sync_to_async(Tenant.objects.first)()
        
        if not user or not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No users or tenants found in database"
            )
        
        success = await EmailService.send_test_email(user, tenant)
        
        if success:
            return {
                "message": "Test email sent successfully!",
                "recipient": user.email,
                "provider": "console",
                "note": "Check terminal output for email content"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send test email"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error sending test email: {str(e)}"
        )
