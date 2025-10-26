"""
DSGVO Compliance Schemas
Pydantic models for GDPR compliance operations
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime


class DSGVORequestResponse(BaseModel):
    """Response model for DSGVO requests"""
    message: str = Field(..., description="Response message")
    request_id: str = Field(..., description="Unique request identifier")
    status: str = Field(..., description="Request status (completed, pending, failed)")
    data: Optional[Dict[str, Any]] = Field(None, description="Response data")


class UserDataExportResponse(BaseModel):
    """Response model for user data export"""
    export_info: Dict[str, Any] = Field(..., description="Export metadata")
    user_profile: Dict[str, Any] = Field(..., description="User profile data")
    tenant_memberships: List[Dict[str, Any]] = Field(..., description="Tenant memberships")
    properties: List[Dict[str, Any]] = Field(..., description="Properties created by user")
    documents: List[Dict[str, Any]] = Field(..., description="Documents uploaded by user")
    contacts: List[Dict[str, Any]] = Field(..., description="Contacts created by user")
    tasks: List[Dict[str, Any]] = Field(..., description="Tasks assigned to user")
    social_posts: List[Dict[str, Any]] = Field(..., description="Social posts by user")
    audit_logs: List[Dict[str, Any]] = Field(..., description="Audit logs for user")


class UserDataDeletionResponse(BaseModel):
    """Response model for user data deletion"""
    user_id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    deletion_type: str = Field(..., description="Type of deletion (soft_delete, hard_delete)")
    deleted_at: str = Field(..., description="Deletion timestamp")
    deleted_items: Dict[str, Any] = Field(..., description="Summary of deleted items")


class TenantDataExportResponse(BaseModel):
    """Response model for tenant data export"""
    export_info: Dict[str, Any] = Field(..., description="Export metadata")
    tenant_info: Dict[str, Any] = Field(..., description="Tenant information")
    users: List[Dict[str, Any]] = Field(..., description="All users in tenant")
    properties: List[Dict[str, Any]] = Field(..., description="All properties in tenant")
    documents: List[Dict[str, Any]] = Field(..., description="All documents in tenant")
    contacts: List[Dict[str, Any]] = Field(..., description="All contacts in tenant")
    tasks: List[Dict[str, Any]] = Field(..., description="All tasks in tenant")
    billing: Optional[Dict[str, Any]] = Field(None, description="Billing information")


class TenantDataDeletionResponse(BaseModel):
    """Response model for tenant data deletion"""
    tenant_id: str = Field(..., description="Tenant ID")
    tenant_name: str = Field(..., description="Tenant name")
    deletion_type: str = Field(..., description="Type of deletion (soft_delete, hard_delete)")
    deleted_at: str = Field(..., description="Deletion timestamp")
    deleted_items: Dict[str, Any] = Field(..., description="Summary of deleted items")


class DSGVOStatusResponse(BaseModel):
    """Response model for DSGVO compliance status"""
    tenant_id: str = Field(..., description="Tenant ID")
    tenant_name: str = Field(..., description="Tenant name")
    compliance_status: str = Field(..., description="Compliance status")
    data_retention_policy: Dict[str, int] = Field(..., description="Data retention policies")
    data_counts: Dict[str, int] = Field(..., description="Current data counts")
    export_capabilities: Dict[str, bool] = Field(..., description="Export capabilities")
    deletion_capabilities: Dict[str, bool] = Field(..., description="Deletion capabilities")
    last_updated: str = Field(..., description="Last update timestamp")


class ExportMetadata(BaseModel):
    """Metadata for data exports"""
    exported_at: str = Field(..., description="Export timestamp")
    user_id: Optional[str] = Field(None, description="User ID (for user exports)")
    tenant_id: Optional[str] = Field(None, description="Tenant ID (for tenant exports)")
    export_type: str = Field(..., description="Type of export")
    format_version: str = Field(default="1.0", description="Export format version")
    dsgvo_compliant: bool = Field(default=True, description="DSGVO compliance flag")


class DeletionRequest(BaseModel):
    """Request model for data deletion"""
    soft_delete: bool = Field(default=True, description="Use soft delete (anonymization)")
    grace_period_days: int = Field(default=30, ge=0, le=365, description="Grace period before hard deletion")
    reason: Optional[str] = Field(None, description="Reason for deletion")
    confirmation_code: Optional[str] = Field(None, description="Confirmation code for critical operations")


class ExportRequest(BaseModel):
    """Request model for data export"""
    include_audit_logs: bool = Field(default=True, description="Include audit logs in export")
    include_deleted_data: bool = Field(default=False, description="Include soft-deleted data")
    date_range_start: Optional[datetime] = Field(None, description="Start date for data range")
    date_range_end: Optional[datetime] = Field(None, description="End date for data range")
    format: str = Field(default="json", description="Export format (json, csv, xml)")


class AnonymizationRule(BaseModel):
    """Rule for data anonymization"""
    field_name: str = Field(..., description="Field to anonymize")
    anonymization_method: str = Field(..., description="Method (hash, replace, remove)")
    replacement_value: Optional[str] = Field(None, description="Replacement value")
    preserve_format: bool = Field(default=True, description="Preserve original format")


class DataRetentionPolicy(BaseModel):
    """Data retention policy configuration"""
    user_data_retention_days: int = Field(default=365, ge=0, description="User data retention in days")
    audit_log_retention_days: int = Field(default=2555, ge=0, description="Audit log retention in days")
    deleted_data_retention_days: int = Field(default=30, ge=0, description="Deleted data retention in days")
    auto_delete_enabled: bool = Field(default=True, description="Enable automatic deletion")
    notification_days_before_deletion: int = Field(default=7, ge=0, description="Notification days before deletion")


class ComplianceReport(BaseModel):
    """Compliance report model"""
    report_id: str = Field(..., description="Report ID")
    tenant_id: str = Field(..., description="Tenant ID")
    report_type: str = Field(..., description="Type of report")
    generated_at: str = Field(..., description="Report generation timestamp")
    generated_by: str = Field(..., description="User who generated the report")
    summary: Dict[str, Any] = Field(..., description="Report summary")
    details: Dict[str, Any] = Field(..., description="Detailed report data")
    compliance_score: float = Field(..., ge=0, le=100, description="Compliance score (0-100)")


class DataSubjectRequest(BaseModel):
    """Data subject request model"""
    request_id: str = Field(..., description="Request ID")
    subject_email: str = Field(..., description="Data subject email")
    request_type: str = Field(..., description="Type of request (access, rectification, erasure, portability)")
    status: str = Field(..., description="Request status")
    submitted_at: str = Field(..., description="Submission timestamp")
    processed_at: Optional[str] = Field(None, description="Processing timestamp")
    processed_by: Optional[str] = Field(None, description="User who processed the request")
    response_data: Optional[Dict[str, Any]] = Field(None, description="Response data")
    notes: Optional[str] = Field(None, description="Additional notes")


class PrivacyImpactAssessment(BaseModel):
    """Privacy Impact Assessment model"""
    assessment_id: str = Field(..., description="Assessment ID")
    feature_name: str = Field(..., description="Feature being assessed")
    data_types_collected: List[str] = Field(..., description="Types of data collected")
    data_processing_purposes: List[str] = Field(..., description="Purposes of data processing")
    legal_basis: List[str] = Field(..., description="Legal basis for processing")
    data_retention_period: int = Field(..., description="Data retention period in days")
    third_party_sharing: bool = Field(..., description="Whether data is shared with third parties")
    risk_level: str = Field(..., description="Risk level (low, medium, high)")
    mitigation_measures: List[str] = Field(..., description="Mitigation measures")
    assessment_date: str = Field(..., description="Assessment date")
    assessor: str = Field(..., description="Person who conducted the assessment")


class ConsentRecord(BaseModel):
    """Consent record model"""
    consent_id: str = Field(..., description="Consent ID")
    user_id: str = Field(..., description="User ID")
    consent_type: str = Field(..., description="Type of consent")
    granted: bool = Field(..., description="Whether consent was granted")
    granted_at: str = Field(..., description="Consent grant timestamp")
    withdrawn_at: Optional[str] = Field(None, description="Consent withdrawal timestamp")
    purpose: str = Field(..., description="Purpose of consent")
    legal_basis: str = Field(..., description="Legal basis for consent")
    consent_method: str = Field(..., description="Method of consent collection")
    ip_address: Optional[str] = Field(None, description="IP address at consent time")
    user_agent: Optional[str] = Field(None, description="User agent at consent time")


class DataBreachReport(BaseModel):
    """Data breach report model"""
    breach_id: str = Field(..., description="Breach ID")
    tenant_id: str = Field(..., description="Tenant ID")
    breach_type: str = Field(..., description="Type of breach")
    description: str = Field(..., description="Breach description")
    discovered_at: str = Field(..., description="Discovery timestamp")
    reported_at: str = Field(..., description="Report timestamp")
    affected_users: int = Field(..., description="Number of affected users")
    data_types_affected: List[str] = Field(..., description="Types of data affected")
    risk_level: str = Field(..., description="Risk level")
    containment_measures: List[str] = Field(..., description="Containment measures taken")
    notification_status: str = Field(..., description="Notification status")
    regulatory_notification_required: bool = Field(..., description="Whether regulatory notification is required")
    user_notification_required: bool = Field(..., description="Whether user notification is required")
    investigation_status: str = Field(..., description="Investigation status")
    lessons_learned: Optional[str] = Field(None, description="Lessons learned")
    preventive_measures: List[str] = Field(..., description="Preventive measures implemented")
