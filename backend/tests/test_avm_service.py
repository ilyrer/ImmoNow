"""
Tests for AVM Service
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.services.avm_service import AVMService
from app.schemas.avm import AvmRequest
from app.schemas.common import PropertyType


@pytest.fixture
def avm_service():
    """Create AVM Service instance"""
    return AVMService(tenant_id="test-tenant")


@pytest.fixture
def sample_avm_request():
    """Create sample AVM request"""
    return AvmRequest(
        address="Hauptstraße 1",
        city="München",
        postal_code="80331",
        property_type=PropertyType.APARTMENT,
        size=85,
        rooms=3,
        build_year=2010,
        condition="good",
        features=["balcony", "parking"]
    )


class TestAVMService:
    """Test AVM Service functionality"""
    
    @pytest.mark.asyncio
    async def test_valuate_property_basic(self, avm_service, sample_avm_request):
        """Test basic property valuation"""
        result = await avm_service.valuate_property(sample_avm_request)
        
        assert result.result.estimated_value > 0
        assert result.result.confidence_level in ['low', 'medium', 'high']
        assert result.result.valuation_range.min < result.result.estimated_value
        assert result.result.valuation_range.max > result.result.estimated_value
        assert len(result.comparables) > 0
        assert result.market_intelligence is not None
    
    def test_get_base_price_per_sqm(self, avm_service):
        """Test base price calculation"""
        price_munich = avm_service._get_base_price_per_sqm("München", "80331")
        price_berlin = avm_service._get_base_price_per_sqm("Berlin", "10115")
        
        assert price_munich > 0
        assert price_berlin > 0
        # Munich should be more expensive than Berlin
        assert price_munich > price_berlin
    
    def test_calculate_adjustments(self, avm_service, sample_avm_request):
        """Test adjustment calculations"""
        adjustments = avm_service._calculate_adjustments(sample_avm_request)
        
        assert 'total_multiplier' in adjustments
        assert adjustments['total_multiplier'] > 0
        assert 'condition_multiplier' in adjustments
        assert 'size_multiplier' in adjustments
    
    def test_confidence_level_calculation(self, avm_service, sample_avm_request):
        """Test confidence level calculation"""
        # With complete data
        confidence = avm_service._calculate_confidence_level(sample_avm_request, has_llm=False)
        assert confidence in ['low', 'medium', 'high']
        
        # With LLM should increase confidence
        confidence_with_llm = avm_service._calculate_confidence_level(sample_avm_request, has_llm=True)
        assert confidence_with_llm in ['medium', 'high']
    
    @pytest.mark.asyncio
    async def test_valuate_with_llm_mock(self, avm_service, sample_avm_request):
        """Test valuation with mocked LLM"""
        # Mock AI Manager
        mock_ai_manager = Mock()
        mock_ai_manager.analyze_property = AsyncMock(return_value={
            "qualitative_factors": {
                "location_quality": "excellent",
                "condition_impact": 10,
                "features_impact": 5,
                "market_trend": "growing"
            },
            "market_position": "above",
            "value_adjustment_percent": 5,
            "insights": ["Great location", "Well maintained"],
            "recommendation": "Good investment"
        })
        
        avm_service.use_llm = True
        avm_service.ai_manager = mock_ai_manager
        
        result = await avm_service.valuate_property(sample_avm_request)
        
        assert result.result.estimated_value > 0
        assert "AI-Enhanced" in result.result.methodology
        # Should have LLM insights as factors
        assert any("AI Insight" in f.name for f in result.result.factors)


class TestAVMEdgeCases:
    """Test edge cases and error handling"""
    
    @pytest.mark.asyncio
    async def test_minimal_data(self, avm_service):
        """Test with minimal property data"""
        minimal_request = AvmRequest(
            address="Test Street",
            city="Berlin",
            postal_code="10115",
            property_type=PropertyType.APARTMENT,
            size=50,
            condition="good"
        )
        
        result = await avm_service.valuate_property(minimal_request)
        assert result.result.estimated_value > 0
        assert result.result.confidence_level == 'low'
    
    @pytest.mark.asyncio
    async def test_large_property(self, avm_service):
        """Test with large property"""
        large_request = AvmRequest(
            address="Villa Street",
            city="München",
            postal_code="80331",
            property_type=PropertyType.HOUSE,
            size=300,
            rooms=10,
            build_year=2020,
            condition="new",
            features=["garden", "pool", "garage"]
        )
        
        result = await avm_service.valuate_property(large_request)
        assert result.result.estimated_value > 1000000  # Should be expensive


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

