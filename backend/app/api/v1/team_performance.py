"""
Team Performance API Endpoints
"""
from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.api.deps import require_read_scope, get_tenant_id
from app.core.security import TokenData
from app.core.errors import NotFoundError, ValidationError
from app.schemas.team_performance import (
    TeamPerformanceResponse, MemberStatsResponse, ActivityFeedResponse,
    LeaderboardResponse, TeamMetricsResponse
)
from app.services.team_performance_service import TeamPerformanceService

router = APIRouter()


@router.get("/performance", response_model=TeamPerformanceResponse)
async def get_team_performance(
    timeframe: str = Query('week', description="Timeframe: today, week, month, quarter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get team performance metrics with aggregations"""
    
    try:
        team_service = TeamPerformanceService(tenant_id)
        performance_data = await team_service.get_team_performance(timeframe)
        
        return performance_data
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get team performance: {str(e)}"
        )


@router.get("/members/{member_id}/stats", response_model=MemberStatsResponse)
async def get_member_stats(
    member_id: str,
    timeframe: str = Query('week', description="Timeframe: today, week, month, quarter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get detailed member statistics"""
    
    try:
        team_service = TeamPerformanceService(tenant_id)
        member_stats = await team_service.get_member_stats(member_id, timeframe)
        
        if not member_stats:
            raise NotFoundError("Member not found")
        
        return member_stats
        
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get member stats: {str(e)}"
        )


@router.get("/activity-feed", response_model=ActivityFeedResponse)
async def get_activity_feed(
    limit: int = Query(50, ge=1, le=100, description="Number of activities to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get live activity feed for team"""
    
    try:
        team_service = TeamPerformanceService(tenant_id)
        activity_feed = await team_service.get_activity_feed(limit=limit, offset=offset)
        
        return activity_feed
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get activity feed: {str(e)}"
        )


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_team_leaderboard(
    timeframe: str = Query('month', description="Timeframe: week, month, quarter"),
    metric: str = Query('performance_score', description="Metric: performance_score, tasks_completed, properties_managed"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get team leaderboard with rankings"""
    
    try:
        team_service = TeamPerformanceService(tenant_id)
        leaderboard = await team_service.get_team_leaderboard(timeframe, metric)
        
        return leaderboard
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get leaderboard: {str(e)}"
        )


@router.get("/metrics", response_model=TeamMetricsResponse)
async def get_team_metrics(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get overall team metrics and KPIs"""
    
    try:
        team_service = TeamPerformanceService(tenant_id)
        metrics = await team_service.get_team_metrics()
        
        return metrics
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get team metrics: {str(e)}"
        )


@router.get("/dashboard-summary")
async def get_dashboard_summary(
    timeframe: str = Query('month', description="Timeframe: week, month, quarter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get comprehensive dashboard summary with financial and performance data"""
    
    try:
        team_service = TeamPerformanceService(tenant_id)
        summary = await team_service.get_dashboard_summary(timeframe)
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard summary: {str(e)}"
        )


@router.get("/financial-overview")
async def get_financial_overview(
    timeframe: str = Query('month', description="Timeframe: week, month, quarter"),
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get financial overview including total value and revenue metrics"""
    
    try:
        team_service = TeamPerformanceService(tenant_id)
        financial_data = await team_service.get_financial_overview(timeframe)
        
        return financial_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get financial overview: {str(e)}"
        )


@router.get("/quick-actions")
async def get_quick_actions(
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """Get available quick actions for the dashboard"""
    
    try:
        team_service = TeamPerformanceService(tenant_id)
        actions = await team_service.get_quick_actions()
        
        return actions
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get quick actions: {str(e)}"
        )