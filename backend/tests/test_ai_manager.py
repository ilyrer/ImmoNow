"""
Tests for AI Manager Service
"""
import pytest
import os
from unittest.mock import Mock, patch, AsyncMock
from app.services.ai_manager import AIManager


@pytest.fixture
def mock_env():
    """Mock environment variables"""
    with patch.dict(os.environ, {
        'AI_PROVIDER': 'openrouter',
        'OPENROUTER_API_KEY': 'test-key',
        'OPENROUTER_MODEL': 'deepseek/deepseek-chat-v3.1:free'
    }):
        yield


@pytest.fixture
def ai_manager(mock_env):
    """Create AI Manager instance"""
    return AIManager(tenant_id="test-tenant")


class TestAIManager:
    """Test AI Manager functionality"""
    
    def test_initialization(self, ai_manager):
        """Test AI Manager initializes correctly"""
        assert ai_manager.tenant_id == "test-tenant"
        assert ai_manager.provider == "openrouter"
        assert ai_manager.model == "deepseek/deepseek-chat-v3.1:free"
    
    @pytest.mark.asyncio
    async def test_chat_completion_mock(self, ai_manager):
        """Test chat completion with mocked response"""
        # Mock the OpenAI client
        mock_response = Mock()
        mock_response.choices = [Mock(message=Mock(content="Test response"), finish_reason="stop")]
        mock_response.usage = Mock(total_tokens=100, prompt_tokens=50, completion_tokens=50)
        mock_response.model = "test-model"
        
        with patch.object(ai_manager.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)):
            result = await ai_manager.chat_completion(
                messages=[{"role": "user", "content": "Test"}]
            )
            
            assert result["response"] == "Test response"
            assert result["tokens_used"] == 100
            assert result["model"] == "test-model"
    
    @pytest.mark.asyncio
    async def test_generate_task_from_text(self, ai_manager):
        """Test task generation from text"""
        mock_response = Mock()
        mock_response.choices = [Mock(
            message=Mock(content='{"title": "Test Task", "description": "Test", "priority": "high", "suggested_due_days": 5, "labels": ["test"], "tags": ["ai"], "story_points": 3}'),
            finish_reason="stop"
        )]
        mock_response.usage = Mock(total_tokens=100, prompt_tokens=50, completion_tokens=50)
        mock_response.model = "test-model"
        
        with patch.object(ai_manager.client.chat.completions, 'create', new=AsyncMock(return_value=mock_response)):
            result = await ai_manager.generate_task_from_text("Create a test task")
            
            assert result["title"] == "Test Task"
            assert result["priority"] == "high"
            assert result["suggested_due_days"] == 5
    
    @pytest.mark.asyncio
    async def test_fallback_on_error(self, ai_manager):
        """Test fallback behavior on API error"""
        with patch.object(ai_manager.client.chat.completions, 'create', side_effect=Exception("API Error")):
            with pytest.raises(Exception):
                await ai_manager.chat_completion(
                    messages=[{"role": "user", "content": "Test"}]
                )


class TestAIManagerProviders:
    """Test different AI providers"""
    
    def test_openrouter_provider(self):
        """Test OpenRouter provider initialization"""
        with patch.dict(os.environ, {
            'AI_PROVIDER': 'openrouter',
            'OPENROUTER_API_KEY': 'test-key'
        }):
            manager = AIManager("test-tenant")
            assert manager.provider == "openrouter"
    
    def test_openai_provider(self):
        """Test OpenAI provider initialization"""
        with patch.dict(os.environ, {
            'AI_PROVIDER': 'openai',
            'OPENAI_API_KEY': 'test-key'
        }):
            manager = AIManager("test-tenant")
            assert manager.provider == "openai"
    
    def test_missing_api_key(self):
        """Test error when API key is missing"""
        with patch.dict(os.environ, {'AI_PROVIDER': 'openrouter'}, clear=True):
            with pytest.raises(Exception):
                AIManager("test-tenant")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

