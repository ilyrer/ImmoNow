import { AIService } from './ai.service';

async function testAIService() {
  try {
    console.log('🤖 Teste KI-Service...\n');

    // Test 1: Aufgabenanalyse
    console.log('Test 1: Aufgabenanalyse');
    const taskResult = await AIService.suggestTaskPriority(
      'Besichtigung Villa Seeblick organisieren',
      'Terminkoordination mit Interessenten und Eigentümer für die Besichtigung der Villa Seeblick. Vorbereitung der Unterlagen und Durchführung der Besichtigung.',
      'Vertriebsteam Nord'
    );
    console.log('Ergebnis der Aufgabenanalyse:', JSON.stringify(taskResult, null, 2));
    console.log('✅ Aufgabenanalyse erfolgreich\n');

    // Test 2: Immobilienbeschreibung
    console.log('Test 2: Immobilienbeschreibung');
    const propertyResult = await AIService.generatePropertyDescription({
      type: 'Villa',
      size: 280,
      rooms: 8,
      location: 'Seeufer, ruhige Lage',
      features: ['Privatstrand', 'Bootsanleger', 'Smart Home', 'Wellnessbereich'],
      condition: 'Neuwertig',
      price: 2850000
    });
    console.log('Ergebnis der Immobilienbeschreibung:', JSON.stringify(propertyResult, null, 2));
    console.log('✅ Immobilienbeschreibung erfolgreich\n');

    console.log('✅ Alle Tests erfolgreich abgeschlossen!');
  } catch (error) {
    console.error('❌ Fehler beim Testen:', error);
  }
}

// Führe die Tests aus
testAIService(); 
