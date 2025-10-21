import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AIService } from '../../services/ai.service';

const GlobalAIChatbot = ({ user, onCreateTask, onCreateProperty, onCreateMeeting }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Hallo! Ich bin Ihr KI-Assistent von ImmoNow. Ich kann Ihnen bei folgenden Aufgaben helfen:',
      timestamp: new Date(),
      suggestions: [
        'Aufgaben erstellen und priorisieren',
        'Immobilienbeschreibungen generieren',
        'Marktanalysen durchführen',
        'Besprechungsnotizen erstellen',
        'Marketing-Content entwickeln'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const addMessage = (type, content, suggestions = null, actionData = null) => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date(),
      suggestions,
      actionData
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    handleSend(suggestion);
  };

  const detectIntent = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('aufgabe') || lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      return 'create_task';
    }
    if (lowerMessage.includes('immobilie') || lowerMessage.includes('objekt') || lowerMessage.includes('haus') || lowerMessage.includes('wohnung')) {
      return 'property_help';
    }
    if (lowerMessage.includes('besprechung') || lowerMessage.includes('meeting') || lowerMessage.includes('termin')) {
      return 'create_meeting';
    }
    if (lowerMessage.includes('markt') || lowerMessage.includes('preis') || lowerMessage.includes('analyse')) {
      return 'market_analysis';
    }
    if (lowerMessage.includes('marketing') || lowerMessage.includes('werbung') || lowerMessage.includes('content')) {
      return 'marketing_help';
    }
    return 'general';
  };

  const handleSend = async (messageText = inputValue) => {
    if (!messageText.trim()) return;

    // Benutzer-Nachricht hinzufügen
    addMessage('user', messageText);
    setInputValue('');
    setIsProcessing(true);
    setIsTyping(true);

    try {
      const intent = detectIntent(messageText);
      let response = '';
      let suggestions = [];
      let actionData = null;

      switch (intent) {
        case 'create_task':
          response = await handleTaskCreation(messageText);
          suggestions = [
            'Weitere Aufgabe erstellen',
            'Aufgaben-Prioritäten analysieren',
            'Team-Aufgaben anzeigen'
          ];
          break;

        case 'property_help':
          response = await handlePropertyHelp(messageText);
          suggestions = [
            'Immobilienbeschreibung generieren',
            'Marktpreis analysieren',
            'Marketing-Content erstellen'
          ];
          break;

        case 'create_meeting':
          response = await handleMeetingCreation(messageText);
          suggestions = [
            'Agenda erstellen',
            'Teilnehmer vorschlagen',
            'Follow-up planen'
          ];
          break;

        case 'market_analysis':
          response = await handleMarketAnalysis(messageText);
          suggestions = [
            'Detaillierte Analyse anfordern',
            'Preisempfehlung erstellen',
            'Wettbewerbsanalyse'
          ];
          break;

        case 'marketing_help':
          response = await handleMarketingHelp(messageText);
          suggestions = [
            'Social Media Content',
            'E-Mail-Kampagne',
            'Exposé erstellen'
          ];
          break;

        default:
          response = await handleGeneralQuery(messageText);
          suggestions = [
            'Aufgabe erstellen',
            'Immobilie analysieren',
            'Besprechung planen'
          ];
      }

      setTimeout(() => {
        setIsTyping(false);
        addMessage('ai', response, suggestions, actionData);
        setIsProcessing(false);
      }, 1500);

    } catch (error) {
      console.error('KI-Fehler:', error);
      setIsTyping(false);
      addMessage('ai', 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage. Bitte versuchen Sie es erneut.');
      setIsProcessing(false);
    }
  };

  const handleTaskCreation = async (message) => {
    try {
      // Extrahiere Aufgaben-Details aus der Nachricht
      const taskSuggestion = await AIService.suggestTaskPriority(
        message,
        `Benutzer möchte eine Aufgabe erstellen: ${message}`,
        `Team: ${user?.company || 'Immobilien-Team'}`
      );

      // Erstelle die Aufgabe über den Callback
      if (onCreateTask) {
        onCreateTask({
          title: taskSuggestion.title,
          description: taskSuggestion.description,
          priority: taskSuggestion.priority,
          deadline: taskSuggestion.suggestedDeadline,
          assignee: taskSuggestion.assigneeRecommendation,
          estimatedTime: taskSuggestion.estimatedTime
        });
      }

      return `✅ Perfekt! Ich habe eine Aufgabe für Sie erstellt:

**${taskSuggestion.title}**
📝 ${taskSuggestion.description}
⚡ Priorität: ${taskSuggestion.priority}
⏱️ Geschätzter Aufwand: ${taskSuggestion.estimatedTime}
📅 Empfohlene Deadline: ${new Date(taskSuggestion.suggestedDeadline).toLocaleDateString('de-DE')}
👤 Empfohlener Bearbeiter: ${taskSuggestion.assigneeRecommendation}

Die Aufgabe wurde automatisch zu Ihrer Aufgabenliste hinzugefügt!`;

    } catch (error) {
      return 'Entschuldigung, ich konnte die Aufgabe nicht erstellen. Bitte versuchen Sie es mit mehr Details erneut.';
    }
  };

  const handlePropertyHelp = async (message) => {
    try {
      // Verwende den neuen AI Service für umfassende Chat-Antworten
      const response = await AIService.processChatMessage(message, {
        user,
        currentPage: 'properties'
      });

      return response.message;
    } catch (error) {
      if (message.toLowerCase().includes('beschreibung') || message.toLowerCase().includes('exposé')) {
        return `🏠 Gerne helfe ich Ihnen bei der Immobilienbeschreibung! 

Für eine optimale Beschreibung benötige ich folgende Informationen:
• Immobilientyp (Haus, Wohnung, Gewerbe)
• Größe in m²
• Anzahl Zimmer
• Standort
• Besondere Ausstattung
• Zustand der Immobilie
• Preis

Beispiel: "Erstelle eine Beschreibung für eine 120m² Wohnung mit 4 Zimmern in München, Balkon, Einbauküche, renoviert, 450.000€"`;
      }

      return `🏠 Ich kann Ihnen bei verschiedenen Immobilien-Aufgaben helfen:

• **Beschreibungen erstellen** - Professionelle Exposés generieren
• **Preisanalysen** - Marktgerechte Preisempfehlungen
• **Marketing-Content** - Werbetexte für verschiedene Kanäle
• **Markttrends** - Aktuelle Entwicklungen analysieren

Was möchten Sie konkret für Ihre Immobilie tun?`;
    }
  };

  const handleMeetingCreation = async (message) => {
    try {
      const meetingSuggestion = await AIService.suggestMeeting(
        message,
        [user?.email || 'Benutzer'],
        'Immobilien-Team Besprechung'
      );

      const meetingData = {
        title: meetingSuggestion.title,
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        duration: meetingSuggestion.duration,
        participants: meetingSuggestion.participants,
        agenda: meetingSuggestion.agenda
      };

      if (onCreateMeeting) {
        onCreateMeeting(meetingData);
      }

      return `📅 Besprechung wurde erstellt!

**${meetingData.title}**
📅 Datum: ${new Date(meetingData.date).toLocaleDateString('de-DE')}
🕐 Zeit: ${meetingData.time}
⏱️ Dauer: ${meetingData.duration} Minuten

**Vorgeschlagene Agenda:**
${meetingData.agenda.map((item, index) => `${index + 1}. ${item}`).join('\n')}

**Vorbereitung:**
${meetingSuggestion.preparationTasks.map(task => `• ${task}`).join('\n')}

Die Besprechung wurde zu Ihrem Kalender hinzugefügt!`;

    } catch (error) {
      const meetingData = {
        title: 'KI-generierte Besprechung',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        duration: 60,
        participants: [user?.email || 'Benutzer'],
        agenda: [
          'Begrüßung und Agenda-Review',
          'Hauptthemen besprechen',
          'Nächste Schritte definieren',
          'Aufgaben verteilen'
        ]
      };

      if (onCreateMeeting) {
        onCreateMeeting(meetingData);
      }

      return `📅 Besprechung wurde erstellt!

**${meetingData.title}**
📅 Datum: ${new Date(meetingData.date).toLocaleDateString('de-DE')}
🕐 Zeit: ${meetingData.time}
⏱️ Dauer: ${meetingData.duration} Minuten

**Vorgeschlagene Agenda:**
${meetingData.agenda.map((item, index) => `${index + 1}. ${item}`).join('\n')}

Die Besprechung wurde zu Ihrem Kalender hinzugefügt!`;
    }
  };

  const handleMarketAnalysis = async (message) => {
    try {
      const analysis = await AIService.analyzeMarketTrends(
        'Deutschland', // Default location
        'Wohnimmobilie', // Default type
        [] // Empty historical data for now
      );

      return `📊 Marktanalyse wurde durchgeführt:

**💰 Preisempfehlung:**
${analysis.priceRecommendation}

**📈 Markttrend:**
${analysis.marketTrend}

**🎯 Verkaufsargumente:**
${analysis.sellingPoints.map(point => `• ${point}`).join('\n')}

**⚠️ Risiken:**
${analysis.risks.map(risk => `• ${risk}`).join('\n')}

**🔮 Prognose:**
${analysis.forecast}

**🏢 Wettbewerb:**
${analysis.competitiveAnalysis}

Möchten Sie eine detaillierte Analyse für eine spezifische Immobilie?`;

    } catch (error) {
      return `📊 Marktanalyse wird durchgeführt...

**Aktuelle Markttrends:**
📈 Preise steigen um 3-5% jährlich
🏘️ Hohe Nachfrage in Stadtrandlagen
💰 Niedrige Zinsen fördern Käufermarkt

**Empfehlungen:**
• Preispositionierung im oberen Marktsegment
• Schnelle Vermarktung empfohlen
• Professionelle Präsentation wichtig

Möchten Sie eine detaillierte Analyse für eine spezifische Immobilie?`;
    }
  };

  const handleMarketingHelp = async (message) => {
    try {
      const marketingContent = await AIService.generateMarketingContent(
        { type: 'Immobilie', location: 'Deutschland' },
        'Immobilienkäufer',
        'Social Media'
      );

      return `📢 Marketing-Content wurde erstellt!

**📰 Headline:**
${marketingContent.headline}

**📝 Beschreibung:**
${marketingContent.description}

**🎯 Verkaufsargumente:**
${marketingContent.keyPoints.map(point => `• ${point}`).join('\n')}

**📞 Call-to-Action:**
${marketingContent.callToAction}

**📱 Social Media Post:**
${marketingContent.socialMediaPost}

**📧 E-Mail Betreff:**
${marketingContent.emailSubject}

**#️⃣ Hashtags:**
${marketingContent.hashtags?.join(' ') || '#Immobilien #Verkauf'}

Für welchen spezifischen Kanal soll ich Content erstellen?`;

    } catch (error) {
      return `Marketing-Unterstützung verfügbar!

**Verfügbare Services:**
• **Social Media Posts** - Instagram, Facebook, LinkedIn
• **E-Mail-Kampagnen** - Zielgruppenspezifisch
• **Exposés** - Professionelle Layouts
• **Website-Content** - SEO-optimiert

**Beispiel-Content:**
" TRAUMHAUS GEFUNDEN! Moderne Villa mit Garten, 5 Zimmer, Top-Lage. Jetzt besichtigen! #Immobilien #Traumhaus"

Für welchen Kanal soll ich Content erstellen?`;
    }
  };

  const handleGeneralQuery = async (message) => {
    try {
      const response = await AIService.processChatMessage(message, {
        user,
        previousMessages: messages.slice(-5), // Letzte 5 Nachrichten als Kontext
        currentPage: 'dashboard'
      });

      return response.message;
    } catch (error) {
      return `Ich verstehe Ihre Anfrage und helfe gerne! 

**Meine Hauptfunktionen:**
**Aufgaben-Management** - Erstellen, priorisieren, verwalten
**Immobilien-Support** - Beschreibungen, Analysen, Bewertungen  
**Besprechungen** - Planen, Agenda erstellen, Nachbereitung
**Markt-Insights** - Trends, Preise, Empfehlungen
**Marketing** - Content, Kampagnen, Social Media

Wie kann ich Ihnen konkret helfen?`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-20 h-20 rounded-full shadow-2xl z-50 flex items-center justify-center transition-all duration-300 ${
          isOpen 
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 rotate-45' 
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-110'
        }`}
        whileHover={{ scale: isOpen ? 1 : 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {isOpen ? (
          <i className="ri-close-line text-white text-3xl"></i>
        ) : (
          <img 
            src="/logo/ImmoNow_Maskotchen.png" 
            alt="KI-Assistent" 
            className="w-14 h-14 object-contain"
          />
        )}
        
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-40 flex flex-col border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-2xl text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <img 
                    src="/logo/chatbot_logo.png" 
                    alt="KI-Assistent" 
                    className="w-16 h-16 object-contain mr-3"
                  />
                  <div>
                    <h3 className="font-semibold text-lg">KI-Assistent</h3>
                    <p className="text-sm opacity-90">
                      {isProcessing ? 'Verarbeitet...' : 'Online'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <i className="ri-subtract-line text-xl"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl rounded-bl-md'
                  } p-3`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Suggestions */}
                    {message.suggestions && (
                      <div className="mt-3 space-y-2">
                        {message.suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="block w-full text-left p-2 text-xs bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString('de-DE', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Fragen Sie mich alles über Immobilien..."
                    className="w-full p-4 pr-14 border border-gray-300 dark:border-gray-600 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-base"
                    rows="2"
                    disabled={isProcessing}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim() || isProcessing}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isProcessing ? (
                      <i className="ri-loader-4-line animate-spin text-lg"></i>
                    ) : (
                      <i className="ri-send-plane-line text-lg"></i>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => handleSuggestionClick('Erstelle eine neue Aufgabe')}
                  className="px-4 py-2 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                >
                  Aufgabe
                </button>
                <button
                  onClick={() => handleSuggestionClick('Analysiere den Immobilienmarkt')}
                  className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
                >
                  Markt
                </button>
                <button
                  onClick={() => handleSuggestionClick('Plane eine Besprechung')}
                  className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                >
                  Meeting
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalAIChatbot; 