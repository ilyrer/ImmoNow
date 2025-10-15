@echo off
REM LLM Integration Setup Script für DeepSeek V3.1 (Windows)
REM Dieses Script hilft beim Einrichten der LLM-Integration

echo ============================================================
echo ImmoNow - LLM Integration Setup (DeepSeek V3.1)
echo ============================================================
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [!] .env Datei nicht gefunden!
    echo Erstelle .env aus env.example...
    copy env.example .env
    echo [OK] .env Datei erstellt
    echo.
    echo Bitte bearbeite die .env Datei und fuege deinen OpenRouter API-Schluessel hinzu:
    echo    OPENROUTER_API_KEY=sk-or-v1-your-key-here
    echo.
    echo    Du kannst einen API-Schluessel hier erstellen:
    echo    https://openrouter.ai/keys
    echo.
    pause
    exit /b 1
)

REM Check if OPENROUTER_API_KEY is set
findstr /B /C:"OPENROUTER_API_KEY=sk-or-v1-" .env >nul
if errorlevel 1 (
    echo [X] OPENROUTER_API_KEY nicht in .env konfiguriert!
    echo.
    echo Bitte bearbeite die .env Datei und fuege deinen OpenRouter API-Schluessel hinzu:
    echo    OPENROUTER_API_KEY=sk-or-v1-your-key-here
    echo.
    echo    Du kannst einen API-Schluessel hier erstellen:
    echo    https://openrouter.ai/keys
    echo.
    pause
    exit /b 1
)

echo [OK] .env Datei gefunden mit OPENROUTER_API_KEY
echo.

REM Install dependencies
echo ============================================================
echo Installiere Dependencies...
echo ============================================================
echo.

pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo [X] Fehler beim Installieren der Dependencies
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies erfolgreich installiert
echo.

REM Check if model is configured correctly
echo ============================================================
echo Ueberpruefe Konfiguration...
echo ============================================================
echo.

findstr /C:"OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free" .env >nul
if errorlevel 1 (
    echo [!] Modell nicht korrekt konfiguriert
    echo    Fuege diese Zeile zu deiner .env hinzu:
    echo    OPENROUTER_MODEL=deepseek/deepseek-chat-v3.1:free
    echo.
) else (
    echo [OK] Modell korrekt konfiguriert: deepseek/deepseek-chat-v3.1:free
)

REM Run tests
echo.
echo ============================================================
echo Fuehre Tests aus...
echo ============================================================
echo.

python test_llm_service.py

if errorlevel 1 (
    echo.
    echo ============================================================
    echo [X] Tests fehlgeschlagen!
    echo ============================================================
    echo.
    echo Bitte ueberpruefe:
    echo   1. OPENROUTER_API_KEY in .env ist korrekt
    echo   2. Internet-Verbindung ist aktiv
    echo   3. OpenRouter API ist erreichbar
    echo.
    echo Fuer weitere Hilfe siehe: README_LLM_DEEPSEEK.md
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo [OK] Setup erfolgreich abgeschlossen!
echo ============================================================
echo.
echo Die LLM-Integration ist jetzt einsatzbereit!
echo.
echo Naechste Schritte:
echo   1. Starte den Backend-Server: python main.py
echo   2. Teste die API-Endpunkte:
echo      - POST /api/v1/llm/ask
echo      - POST /api/v1/llm/dashboard_qa
echo      - GET /api/v1/llm/health
echo   3. Integriere den Chatbot im Frontend
echo.
echo Weitere Informationen: README_LLM_DEEPSEEK.md
echo.
pause

