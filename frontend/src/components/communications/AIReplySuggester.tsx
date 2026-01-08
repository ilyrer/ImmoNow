/**
 * AI Reply Suggester Component
 * 
 * Schlägt Antworten auf Nachrichten vor
 * - Verschiedene Töne (neutral, freundlich, professionell, kurz)
 * - Kontext-bewusst (Channel, Thema, letzte Nachrichten)
 * - Vorschlag erscheint im Input (editierbar)
 */

import React, { useState } from 'react';
import { MessageSquare, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AIMessageAssistant, ReplySuggestionOptions } from '../../services/aiMessageAssistant.service';
import type { Channel, ChannelMessage } from '../../api/hooks';

interface AIReplySuggesterProps {
  message: ChannelMessage;
  channel: Channel;
  recentMessages?: ChannelMessage[];
  onSuggestion: (suggestion: string) => void;
}

export const AIReplySuggester: React.FC<AIReplySuggesterProps> = ({
  message,
  channel,
  recentMessages = [],
  onSuggestion,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async (tone: ReplySuggestionOptions['tone'] = 'neutral') => {
    setLoading(true);
    setError(null);

    try {
      const suggestion = await AIMessageAssistant.suggestReply(
        message.content,
        {
          name: channel.name,
          topic: channel.topic || undefined,
          recentMessages: recentMessages.slice(-5).map(m => ({
            content: m.content,
            user_id: m.user_id,
          })),
        },
        { tone }
      );

      onSuggestion(suggestion);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Generieren der Antwort');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={loading}
            title="Antwort vorschlagen"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            )}
            Antwort
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleSuggest('neutral')}>
            Neutral antworten
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSuggest('friendly')}>
            Freundlich antworten
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSuggest('professional')}>
            Professionell antworten
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSuggest('brief')}>
            Kurz bestätigen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400 ml-2">{error}</span>
      )}
    </div>
  );
};

