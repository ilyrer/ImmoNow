"""
Test script for LLM Service with DeepSeek V3.1
Run this to verify the LLM integration is working correctly
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from app.services.llm_service import LLMService
from app.schemas.llm import LLMRequest, DashboardQARequest

async def test_llm_service():
    """Test LLM Service"""
    
    print("=" * 60)
    print("Testing LLM Service with DeepSeek V3.1 (free)")
    print("=" * 60)
    print()
    
    # Check if API key is configured
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print("❌ ERROR: OPENROUTER_API_KEY not configured!")
        print("Please set OPENROUTER_API_KEY in your .env file")
        return
    
    print(f"✓ API Key configured: {api_key[:15]}...")
    print()
    
    try:
        # Initialize service
        print("Initializing LLM Service...")
        llm_service = LLMService(tenant_id="test-tenant")
        
        print(f"✓ Service initialized")
        print(f"  Model: {llm_service.openrouter_model}")
        print(f"  Base URL: {llm_service.openrouter_base_url}")
        print(f"  Timeout: {llm_service.timeout}s")
        print(f"  Max Tokens: {llm_service.max_tokens}")
        print()
        
        # Test 1: General question
        print("=" * 60)
        print("Test 1: Allgemeine Frage")
        print("=" * 60)
        
        request = LLMRequest(
            prompt="Was ist Immobilienverwaltung in einem Satz?",
            max_tokens=150,
            temperature=0.7
        )
        
        print(f"Frage: {request.prompt}")
        print("Sende Anfrage...")
        
        response = await llm_service.ask_question(
            request=request,
            user_id="test-user-1",
            request_id="test-request-1"
        )
        
        print()
        print("✓ Antwort erhalten:")
        print(f"  Modell: {response.model}")
        print(f"  Tokens verwendet: {response.tokens_used}")
        print(f"  Antwort: {response.response}")
        print()
        
        # Test 2: Dashboard Q&A
        print("=" * 60)
        print("Test 2: Dashboard Q&A")
        print("=" * 60)
        
        qa_request = DashboardQARequest(
            question="Was bedeutet ROI im Immobilienkontext?",
            context_type="dashboard",
            include_data=True
        )
        
        print(f"Frage: {qa_request.question}")
        print("Sende Anfrage...")
        
        qa_response = await llm_service.ask_dashboard_question(
            request=qa_request,
            user_id="test-user-2",
            request_id="test-request-2"
        )
        
        print()
        print("✓ Antwort erhalten:")
        print(f"  Tokens verwendet: {qa_response.tokens_used}")
        print(f"  Erwähnte KPIs: {', '.join(qa_response.related_kpis) if qa_response.related_kpis else 'Keine'}")
        print(f"  Antwort: {qa_response.answer}")
        print()
        
        # Test 3: Context-aware question
        print("=" * 60)
        print("Test 3: Frage mit Kontext")
        print("=" * 60)
        
        context_request = LLMRequest(
            prompt="Wie hoch ist der ROI?",
            context="Ich habe eine Immobilie für 500.000€ gekauft und verdiene 40.000€ pro Jahr damit.",
            max_tokens=200,
            temperature=0.5
        )
        
        print(f"Kontext: {context_request.context}")
        print(f"Frage: {context_request.prompt}")
        print("Sende Anfrage...")
        
        context_response = await llm_service.ask_question(
            request=context_request,
            user_id="test-user-3",
            request_id="test-request-3"
        )
        
        print()
        print("✓ Antwort erhalten:")
        print(f"  Modell: {context_response.model}")
        print(f"  Tokens verwendet: {context_response.tokens_used}")
        print(f"  Antwort: {context_response.response}")
        print()
        
        # Success summary
        print("=" * 60)
        print("✅ Alle Tests erfolgreich!")
        print("=" * 60)
        print()
        print("Die LLM-Integration funktioniert korrekt mit:")
        print(f"  • Modell: {llm_service.openrouter_model}")
        print(f"  • OpenAI SDK (AsyncOpenAI)")
        print(f"  • Rate Limiting aktiv")
        print(f"  • Retry-Logik implementiert")
        print()
        
    except Exception as e:
        print()
        print("=" * 60)
        print("❌ Test fehlgeschlagen!")
        print("=" * 60)
        print(f"Fehler: {str(e)}")
        print()
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print()
    asyncio.run(test_llm_service())
    print()

