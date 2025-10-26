#!/bin/bash

# Integration Tests für API Schema Kompatibilität
# Dieses Skript führt die Playwright-Tests gegen das lokale Backend aus

set -e

echo "🚀 Starting API Schema Compatibility Integration Tests"
echo "=================================================="

# Prüfe ob das Backend läuft
echo "📡 Checking if backend is running..."
if ! curl -s http://localhost:8000/api/v1/health > /dev/null 2>&1; then
    echo "❌ Backend is not running on http://localhost:8000"
    echo "Please start the backend first:"
    echo "  cd backend && python manage.py runserver"
    exit 1
fi

echo "✅ Backend is running"

# Setze Umgebungsvariablen
export API_BASE_URL=http://localhost:8000/api/v1
export NODE_ENV=test

# Führe die Tests aus
echo "🧪 Running integration tests..."
npx playwright test tests/integration/api-schema-compatibility.test.ts --reporter=html

echo "✅ Integration tests completed!"
echo "📊 Test results are available in playwright-report/index.html"
