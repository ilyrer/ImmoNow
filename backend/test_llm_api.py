"""
Test script für LLM API Endpoints (ohne Authentication)
Testet die /test Endpunkte, die keine JWT-Token benötigen
"""
import requests
import json

# Backend URL - passe das an falls dein Server auf einem anderen Port läuft
BASE_URL = "http://localhost:8000"

def test_llm_endpoint():
    """Test den /api/v1/llm/test Endpunkt"""
    
    print("=" * 60)
    print("Test 1: Allgemeine Frage (ohne Auth)")
    print("=" * 60)
    print()
    
    url = f"{BASE_URL}/api/v1/llm/test"
    
    payload = {
        "prompt": "Was ist Immobilienverwaltung in einem Satz?",
        "max_tokens": 150,
        "temperature": 0.7
    }
    
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    print()
    print("Sende Anfrage...")
    
    try:
        response = requests.post(url, json=payload, timeout=90)
        
        print(f"Status Code: {response.status_code}")
        print()
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Erfolgreich!")
            print()
            print(f"Modell: {data['model']}")
            print(f"Tokens verwendet: {data['tokens_used']}")
            print(f"Antwort: {data['response']}")
            print()
            return True
        else:
            print("❌ Fehler!")
            print(f"Response: {response.text}")
            print()
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Timeout! Die Anfrage hat zu lange gedauert.")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Verbindungsfehler! Läuft der Backend-Server?")
        print(f"   Stelle sicher, dass der Server auf {BASE_URL} läuft.")
        return False
    except Exception as e:
        print(f"❌ Fehler: {str(e)}")
        return False


def test_dashboard_endpoint():
    """Test den /api/v1/llm/test_dashboard Endpunkt"""
    
    print("=" * 60)
    print("Test 2: Dashboard Q&A (ohne Auth)")
    print("=" * 60)
    print()
    
    url = f"{BASE_URL}/api/v1/llm/test_dashboard"
    
    payload = {
        "question": "Was bedeutet ROI im Immobilienkontext?",
        "context_type": "dashboard",
        "include_data": True
    }
    
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2, ensure_ascii=False)}")
    print()
    print("Sende Anfrage...")
    
    try:
        response = requests.post(url, json=payload, timeout=90)
        
        print(f"Status Code: {response.status_code}")
        print()
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Erfolgreich!")
            print()
            print(f"Tokens verwendet: {data['tokens_used']}")
            print(f"Erwähnte KPIs: {', '.join(data['related_kpis']) if data['related_kpis'] else 'Keine'}")
            print(f"Antwort: {data['answer']}")
            print()
            return True
        else:
            print("❌ Fehler!")
            print(f"Response: {response.text}")
            print()
            return False
            
    except requests.exceptions.Timeout:
        print("❌ Timeout! Die Anfrage hat zu lange gedauert.")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Verbindungsfehler! Läuft der Backend-Server?")
        print(f"   Stelle sicher, dass der Server auf {BASE_URL} läuft.")
        return False
    except Exception as e:
        print(f"❌ Fehler: {str(e)}")
        return False


def main():
    """Führe alle Tests aus"""
    
    print()
    print("=" * 60)
    print("LLM API Tests (ohne Authentication)")
    print("=" * 60)
    print()
    print("Diese Tests verwenden die /test Endpunkte,")
    print("die keine JWT-Token benötigen.")
    print()
    
    results = []
    
    # Test 1
    results.append(test_llm_endpoint())
    
    # Test 2
    results.append(test_dashboard_endpoint())
    
    # Zusammenfassung
    print("=" * 60)
    if all(results):
        print("✅ Alle Tests erfolgreich!")
    else:
        print("❌ Einige Tests sind fehlgeschlagen!")
    print("=" * 60)
    print()
    
    if all(results):
        print("Die OpenRouter Integration funktioniert korrekt! 🎉")
        print()
        print("Nächste Schritte:")
        print("  1. Für Production-Endpunkte: Erstelle einen gültigen JWT-Token")
        print("  2. Verwende dann die geschützten Endpunkte:")
        print("     - POST /api/v1/llm/ask")
        print("     - POST /api/v1/llm/dashboard_qa")
        print("  3. Entferne die /test Endpunkte in Production!")
        print()
    else:
        print("Troubleshooting:")
        print("  1. Ist der Backend-Server gestartet?")
        print("  2. Ist OPENROUTER_API_KEY in .env konfiguriert?")
        print("  3. Läuft der Server auf Port 8000?")
        print("  4. Ist openai Package installiert? (pip install openai)")
        print()


if __name__ == "__main__":
    main()

