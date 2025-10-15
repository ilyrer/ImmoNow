"""
Google OAuth Authentication Endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import os
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest, RegisterRequest

router = APIRouter()

class GoogleAuthRequest(BaseModel):
    """Schema for Google OAuth authentication"""
    google_id: str = Field(..., description="Google user ID")
    email: EmailStr = Field(..., description="User email from Google")
    first_name: str = Field(..., description="User first name")
    last_name: str = Field(..., description="User last name")
    profile_picture: Optional[str] = Field(None, description="User profile picture URL")
    id_token: Optional[str] = Field(None, description="Google ID token for verification")

class GoogleAuthResponse(BaseModel):
    """Response schema for Google OAuth authentication"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict

class GoogleTokenVerifyRequest(BaseModel):
    """Schema for Google token verification"""
    id_token: str = Field(..., description="Google ID token to verify")

@router.post("/google", response_model=GoogleAuthResponse, summary="Authenticate with Google OAuth")
async def google_auth(request: GoogleAuthRequest):
    """
    Authenticate user with Google OAuth credentials.
    
    This endpoint handles Google OAuth authentication by:
    1. Verifying the Google ID token (if provided)
    2. Creating or finding the user account
    3. Generating JWT tokens for the session
    """
    try:
        auth_service = AuthService()
        
        # Verify Google ID token if provided
        if request.id_token:
            try:
                # Verify the Google ID token
                GOOGLE_CLIENT_ID = "569810192567-ng85oo2l395kuis7dd2fbqa6q8dtbslg.apps.googleusercontent.com"
                
                # Verify the token
                idinfo = google_id_token.verify_oauth2_token(
                    request.id_token, 
                    requests.Request(), 
                    GOOGLE_CLIENT_ID
                )
                
                # Verify that the token is for the correct user
                if idinfo['sub'] != request.google_id:
                    raise HTTPException(
                        status_code=400,
                        detail="Token user ID does not match provided Google ID"
                    )
                
                # Verify email matches
                if idinfo['email'] != request.email:
                    raise HTTPException(
                        status_code=400,
                        detail="Token email does not match provided email"
                    )
                    
            except ValueError as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid Google ID token: {str(e)}"
                )
        
        # Check if user exists by Google ID or email
        user = await auth_service.get_user_by_google_id(request.google_id)
        
        if not user:
            # Check if user exists by email
            user = await auth_service.get_user_by_email(request.email)
            
            if user:
                # Link Google ID to existing user
                await auth_service.link_google_account(user.id, request.google_id)
            else:
                # Create new user with Google OAuth data
                register_data = RegisterRequest(
                    email=request.email,
                    password="",  # No password for OAuth users
                    first_name=request.first_name,
                    last_name=request.last_name,
                    phone="",  # Not provided by Google
                    tenant_name=f"{request.first_name} {request.last_name}'s Organization",
                    company_email=request.email,
                    company_phone="",
                    plan="free",
                    billing_cycle="monthly"
                )
                
                user = await auth_service.register_user(register_data)
                
                # Link Google account
                await auth_service.link_google_account(user.id, request.google_id)
        
        # Generate tokens
        tokens = await auth_service.generate_tokens(user)
        
        return GoogleAuthResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            token_type="bearer",
            user={
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "profile_picture": request.profile_picture,
                "google_id": request.google_id
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Google authentication failed: {str(e)}"
        )

@router.post("/google/verify", summary="Verify Google ID Token (POST)")
async def verify_google_token_post(request: GoogleTokenVerifyRequest):
    """
    Verify a Google ID token and return user information (POST version).
    
    This endpoint can be used to verify Google ID tokens on the backend
    for additional security. Use this version for POST requests with JSON body.
    """
    try:
        id_token_str = request.id_token
        
        # Verify the Google ID token
        GOOGLE_CLIENT_ID = "569810192567-ng85oo2l395kuis7dd2fbqa6q8dtbslg.apps.googleusercontent.com"
        
        # Verify the token
        idinfo = google_id_token.verify_oauth2_token(
            id_token_str, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        return {
            "valid": True,
            "user_id": idinfo['sub'],
            "email": idinfo['email'],
            "name": idinfo.get('name', ''),
            "given_name": idinfo.get('given_name', ''),
            "family_name": idinfo.get('family_name', ''),
            "picture": idinfo.get('picture', ''),
            "email_verified": idinfo.get('email_verified', False),
            "aud": idinfo.get('aud', ''),
            "iss": idinfo.get('iss', ''),
            "exp": idinfo.get('exp', 0)
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Google ID token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Token verification failed: {str(e)}"
        )

@router.get("/google/verify", summary="Verify Google ID Token (GET)")
async def verify_google_token_get(id_token: str = Query(..., description="Google ID token to verify")):
    """
    Verify a Google ID token and return user information (GET version).
    
    This endpoint can be used to verify Google ID tokens on the backend
    for additional security. Use this version for GET requests with query parameter.
    """
    try:
        # Verify the Google ID token
        GOOGLE_CLIENT_ID = "569810192567-ng85oo2l395kuis7dd2fbqa6q8dtbslg.apps.googleusercontent.com"
        
        # Verify the token
        idinfo = google_id_token.verify_oauth2_token(
            id_token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        
        return {
            "valid": True,
            "user_id": idinfo['sub'],
            "email": idinfo['email'],
            "name": idinfo.get('name', ''),
            "given_name": idinfo.get('given_name', ''),
            "family_name": idinfo.get('family_name', ''),
            "picture": idinfo.get('picture', ''),
            "email_verified": idinfo.get('email_verified', False),
            "aud": idinfo.get('aud', ''),
            "iss": idinfo.get('iss', ''),
            "exp": idinfo.get('exp', 0)
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid Google ID token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Token verification failed: {str(e)}"
        )

@router.get("/google/test", summary="Test Google OAuth")
async def test_google_oauth():
    """
    Test endpoint to verify Google OAuth is working.
    """
    return {
        "message": "Google OAuth is working",
        "client_id": "569810192567-ng85oo2l395kuis7dd2fbqa6q8dtbslg.apps.googleusercontent.com",
        "endpoints": {
            "post_verify": "/api/v1/auth/google/verify",
            "get_verify": "/api/v1/auth/google/verify?id_token=YOUR_TOKEN",
            "auth": "/api/v1/auth/google"
        },
        "usage": {
            "post": "Send POST request to /google/verify with body: {\"id_token\": \"YOUR_TOKEN\"}",
            "get": "Send GET request to /google/verify?id_token=YOUR_TOKEN"
        }
    }