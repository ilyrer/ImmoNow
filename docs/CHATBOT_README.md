# Dashboard Chatbot (LLM Integration)

## Overview

The Dashboard Chatbot provides intelligent Q&A capabilities for understanding dashboard KPIs, metrics, definitions, and data sources. It uses **Qwen 2.5 72B** via **OpenRouter** with context injection to provide accurate, source-referenced answers.

## Architecture

```
┌─────────────────────┐
│   Frontend          │
│  GlobalAIChatbot    │
└──────────┬──────────┘
           │
           │ POST /api/v1/llm/dashboard_qa
           │ { question: "What is lead conversion rate?" }
           ▼
┌─────────────────────────────────────────────────────────┐
│   Backend - LLM Service                                 │
│                                                         │
│   1. Receive question                                   │
│   2. Inject context (KPI glossary, filters, endpoints)  │
│   3. Call OpenRouter API with system prompt             │
│   4. Parse response                                     │
│   5. Log to audit table                                 │
│   6. Return formatted answer                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS POST
                     │ Authorization: Bearer $OPENROUTER_API_KEY
                     ▼
           ┌─────────────────────┐
           │   OpenRouter API    │
           │   Qwen 2.5 72B      │
           └─────────────────────┘
```

## Backend Implementation

### 1. Endpoint

**File**: `backend/app/api/v1/llm.py`

```python
@router.post("/dashboard_qa", response_model=DashboardQAResponse)
async def dashboard_qa(
    request: DashboardQARequest,
    current_user: TokenData = Depends(require_read_scope),
    tenant_id: str = Depends(get_tenant_id)
):
    """
    Answer questions about dashboard data with context injection

    Args:
        request: User question + optional context
        current_user: Authenticated user
        tenant_id: Current tenant

    Returns:
        Formatted answer with source attribution
    """
    llm_service = LLMService(tenant_id)

    # Build context from KPI definitions, current filters, etc.
    context = await llm_service.build_dashboard_context(
        user_id=current_user.user_id,
        additional_context=request.context
    )

    # Call LLM with context
    answer = await llm_service.dashboard_qa(
        question=request.question,
        context=context
    )

    return answer
```

### 2. Schema

**File**: `backend/app/schemas/llm.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, List

class DashboardQARequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=500)
    context: Optional[Dict] = Field(None, description="Additional context (filters, timeframe, etc.)")

class DashboardQAResponse(BaseModel):
    answer: str
    sources: List[str]  # e.g., ["Analytics Service", "GET /api/v1/analytics/dashboard"]
    confidence: float  # 0.0 - 1.0
    tokens_used: int
```

### 3. Service

**File**: `backend/app/services/llm_service.py`

```python
import httpx
import os
from typing import Dict, List
from tenacity import retry, stop_after_attempt, wait_exponential

class LLMService:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.base_url = os.getenv("OPENROUTER_BASE", "https://openrouter.ai/api/v1")
        self.model = os.getenv("OPENROUTER_MODEL", "qwen/qwen-2.5-72b-instruct")
        self.api_key = os.getenv("OPENROUTER_API_KEY")

        if not self.api_key:
            raise ValueError("OPENROUTER_API_KEY not configured")

    async def build_dashboard_context(self, user_id: str, additional_context: Dict = None) -> str:
        """
        Build context string from KPI definitions, glossary, etc.
        """
        context_parts = [
            "# Dashboard KPI Glossary",
            "",
            "## Core Metrics",
            "- **Total Properties**: Count of all properties in system. Source: GET /api/v1/properties (count)",
            "- **Active Listings**: Properties with status='available'. Source: GET /api/v1/properties?status=available",
            "- **Pending Sales**: Properties with status='reserved'. Updated daily.",
            "- **Total Contacts**: Count of all contacts. Source: GET /api/v1/contacts (count)",
            "- **Lead Conversion Rate**: (customers / total_contacts) * 100. Updated hourly.",
            "- **Average Property Value**: Mean of property.price for status='available'. Updated daily.",
            "",
            "## Sales Performance",
            "- **Monthly Revenue**: Sum of property.price for sales in current month. Source: GET /api/v1/analytics/revenue",
            "- **Sales Volume**: Count of completed sales in timeframe.",
            "- **Average Deal Size**: revenue / sales_volume",
            "",
            "## Team Metrics",
            "- **Active Tasks**: Tasks with status IN ('todo', 'in_progress'). Source: GET /api/v1/tasks?status=todo,in_progress",
            "- **Team Velocity**: Completed tasks per week. Rolling 4-week average.",
            "- **Response Time**: Average time from lead creation to first contact. Updated hourly.",
            "",
            "## Filters & Time Ranges",
            "- Default timeframe: Last 30 days",
            "- Available filters: property_type, status, price_range, location",
            "- Real-time metrics update every 5 minutes",
            "",
            "## Data Freshness",
            "- Property data: Real-time (on change)",
            "- Contact data: Real-time (on change)",
            "- Aggregated metrics: Cached for 5 minutes",
            "- Historical charts: Cached for 1 hour",
        ]

        if additional_context:
            context_parts.append("")
            context_parts.append("## Current Session Context")
            for key, value in additional_context.items():
                context_parts.append(f"- {key}: {value}")

        return "\n".join(context_parts)

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def call_openrouter(self, messages: List[Dict], temperature: float = 0.7) -> Dict:
        """
        Call OpenRouter API with retry logic
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://immonow.app",
            "X-Title": "ImmoNow CIM",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 1000
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )

            if response.status_code == 429:
                # Rate limit - will be retried by tenacity
                raise httpx.HTTPStatusError(
                    "Rate limit exceeded",
                    request=response.request,
                    response=response
                )

            response.raise_for_status()
            return response.json()

    async def dashboard_qa(self, question: str, context: str) -> DashboardQAResponse:
        """
        Answer dashboard question with context
        """
        system_prompt = f"""You are a precise Analytics Assistant for a real estate CRM system.

**Your Task**: Answer questions about dashboard metrics, KPIs, and data sources.

**Response Format**:
- 2-4 concise bullet points
- Include the data source (endpoint/module) at the end
- Use exact terminology from the glossary
- If unsure, suggest how to find the answer

**Context** (KPI Definitions & Sources):
{context}

**Guidelines**:
- Be accurate and specific
- Reference the source endpoint when relevant
- If the answer isn't in the context, say "This metric is not currently tracked. Consider adding it via..."
- No speculation or assumptions
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]

        # Call LLM
        start_time = time.time()
        response = await self.call_openrouter(messages, temperature=0.3)
        latency_ms = int((time.time() - start_time) * 1000)

        # Parse response
        answer_text = response["choices"][0]["message"]["content"]
        tokens_used = response["usage"]["total_tokens"]

        # Extract sources from answer (simple heuristic)
        sources = self._extract_sources(answer_text)

        # Audit log
        await self._log_request(
            user_id=...,  # Pass from caller
            endpoint="dashboard_qa",
            prompt=question,
            response=answer_text,
            tokens_used=tokens_used,
            latency_ms=latency_ms,
            status="success"
        )

        return DashboardQAResponse(
            answer=answer_text,
            sources=sources,
            confidence=0.95,  # Could implement confidence scoring
            tokens_used=tokens_used
        )

    def _extract_sources(self, text: str) -> List[str]:
        """
        Extract source mentions from answer text
        """
        sources = []
        # Look for patterns like "Source: X" or "GET /api/v1/..."
        import re
        source_pattern = r"Source: ([^\n]+)"
        endpoint_pattern = r"(GET|POST) (/api/v1/[^\s]+)"

        for match in re.finditer(source_pattern, text):
            sources.append(match.group(1).strip())

        for match in re.finditer(endpoint_pattern, text):
            sources.append(f"{match.group(1)} {match.group(2)}")

        return sources or ["Dashboard Analytics Service"]

    async def _log_request(self, user_id: str, endpoint: str, prompt: str,
                          response: str, tokens_used: int, latency_ms: int,
                          status: str, error: str = None):
        """
        Log LLM request to audit table
        """
        from app.db.models.llm import LLMRequest
        from django.db import connection

        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO llm_requests
                (id, tenant_id, user_id, endpoint, prompt, response, tokens_used, latency_ms, status, error, created_at)
                VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """, [self.tenant_id, user_id, endpoint, prompt[:1000], response[:5000],
                  tokens_used, latency_ms, status, error])
```

### 4. Error Handling

```python
class LLMError(Exception):
    """Base LLM error"""
    pass

class LLMRateLimitError(LLMError):
    """Rate limit exceeded"""
    pass

class LLMTimeoutError(LLMError):
    """Request timeout"""
    pass

# In endpoint:
try:
    answer = await llm_service.dashboard_qa(question, context)
    return answer
except LLMRateLimitError:
    raise HTTPException(
        status_code=429,
        detail="AI service rate limit exceeded. Please try again in a moment."
    )
except LLMTimeoutError:
    raise HTTPException(
        status_code=504,
        detail="AI service timeout. Please try a simpler question."
    )
except Exception as e:
    logger.error(f"LLM error: {e}")
    raise HTTPException(
        status_code=500,
        detail="AI service temporarily unavailable."
    )
```

## Frontend Implementation

### 1. Chatbot Component

**File**: `src/components/AI/GlobalAIChatbot.jsx`

```jsx
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/config';

export const GlobalAIChatbot = () => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);

  const askMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiClient.post('/api/v1/llm/dashboard_qa', {
        question,
        context: {
          current_page: window.location.pathname,
          // Add any filters/context from current view
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        timestamp: new Date()
      }]);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: question,
      timestamp: new Date()
    }]);

    // Call API
    askMutation.mutate(question);
    setQuestion('');
  };

  return (
    <div className="chatbot-container">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            {msg.sources && (
              <div className="sources">
                <small>Sources: {msg.sources.join(', ')}</small>
              </div>
            )}
          </div>
        ))}
        {askMutation.isPending && <div className="loading">Thinking...</div>}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about dashboard metrics..."
          disabled={askMutation.isPending}
        />
        <button type="submit" disabled={askMutation.isPending}>
          Send
        </button>
      </form>
    </div>
  );
};
```

## Example Interactions

### Example 1: KPI Definition

**User**: "What is the lead conversion rate?"

**Assistant**:
```
Lead Conversion Rate measures the percentage of contacts who become customers.

• Formula: (total_customers / total_contacts) × 100
• Data Source: GET /api/v1/contacts with aggregation
• Update Frequency: Hourly
• Current implementation uses status field to identify customers

Source: Analytics Service, Contacts Module
```

### Example 2: Data Source

**User**: "Where does the property count come from?"

**Assistant**:
```
Property count data comes from:

• Endpoint: GET /api/v1/properties (returns paginated list with total count)
• Updates: Real-time on any property create/update/delete
• Filters applied: Only counts properties matching current dashboard filters (status, type, location)

Source: Properties API
```

### Example 3: Troubleshooting

**User**: "Why is my revenue chart empty?"

**Assistant**:
```
Revenue chart may be empty due to:

• No completed sales in selected time period - try expanding date range
• Missing price data on properties - check property records
• Cache issue - try refreshing the page

Data Source: GET /api/v1/analytics/revenue?timeframe=30d
Consider checking the Analytics module logs for errors.

Source: Analytics Service
```

## Security Considerations

1. **API Key Protection**: Never expose `OPENROUTER_API_KEY` in frontend
2. **Rate Limiting**: Implement per-user rate limits (e.g., 20 questions/hour)
3. **Input Validation**: Sanitize user questions (max length, no injection)
4. **Context Filtering**: Only inject KPI definitions, never sensitive user data
5. **Audit Logging**: Log all LLM requests for security review

## Cost Management

**Qwen 2.5 72B Pricing** (via OpenRouter, as of 2024):
- Input: ~$0.50 per 1M tokens
- Output: ~$1.50 per 1M tokens

**Estimated Costs**:
- Avg question: 200 input tokens + 150 output tokens
- Cost per question: ~$0.0003 (less than 1 cent)
- 10,000 questions/month: ~$3/month

**Budget Controls**:
- Set monthly spend limit in OpenRouter dashboard
- Implement per-user quotas
- Cache common questions

## Monitoring

### Metrics to Track

1. **Usage**:
   - Total questions/day
   - Unique users
   - Questions per user

2. **Performance**:
   - Response latency (p50, p95, p99)
   - Token usage
   - Error rate

3. **Quality**:
   - User satisfaction (thumbs up/down)
   - Clarification requests
   - Escalations to human support

### Dashboard Query

```sql
SELECT
    DATE(created_at) as date,
    COUNT(*) as total_questions,
    AVG(latency_ms) as avg_latency,
    SUM(tokens_used) as total_tokens,
    COUNT(DISTINCT user_id) as unique_users
FROM llm_requests
WHERE endpoint = 'dashboard_qa'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Testing

### Unit Test

```python
# backend/tests/test_llm_service.py

@pytest.mark.asyncio
async def test_dashboard_qa():
    service = LLMService(tenant_id="test-tenant")

    response = await service.dashboard_qa(
        question="What is lead conversion rate?",
        context=await service.build_dashboard_context(user_id="test-user")
    )

    assert response.answer
    assert len(response.sources) > 0
    assert response.tokens_used > 0
```

### Integration Test

```python
def test_dashboard_qa_endpoint(client, auth_token):
    response = client.post(
        "/api/v1/llm/dashboard_qa",
        headers={"Authorization": f"Bearer {auth_token}"},
        json={"question": "What is total properties?"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert "sources" in data
```

## Troubleshooting

### Issue: 429 Rate Limit

**Solution**: Implement exponential backoff (already in code) + inform user to wait

### Issue: Slow Responses (>5s)

**Solution**:
- Reduce `max_tokens` to 500
- Use faster model (e.g., `qwen/qwen-2-7b`)
- Implement caching for common questions

### Issue: Inaccurate Answers

**Solution**:
- Improve context injection (add more KPI details)
- Lower temperature (0.1-0.3 for factual answers)
- Add validation layer (check if answer matches known facts)

---

## Changelog

**v1.0** (2025-10-14):
- Initial implementation with Qwen 2.5 72B
- Dashboard Q&A with context injection
- Audit logging
- Error handling with retries
