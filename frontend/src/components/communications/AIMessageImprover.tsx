/**
 * AI Message Improver Component
 * 
 * Verbessert Nachrichten im Input-Feld
 * - Verschiedene Stile (professionell, klar, kurz, formell)
 * - Editierbare Vorschläge
 * - User muss bestätigen
 */

import React, { useState } from 'react';
import { Sparkles, Loader2, Check, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AIMessageAssistant, MessageImprovementOptions } from '../../services/aiMessageAssistant.service';

interface AIMessageImproverProps {
  currentMessage: string;
  onImprove: (improvedMessage: string) => void;
  disabled?: boolean;
}

export const AIMessageImprover: React.FC<AIMessageImproverProps> = ({
  currentMessage,
  onImprove,
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleImprove = async (style: MessageImprovementOptions['style'] = 'professional') => {
    if (!currentMessage.trim() || disabled) return;

    setLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const improved = await AIMessageAssistant.improveMessage(currentMessage, { style });
      setSuggestion(improved);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Verbessern');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onImprove(suggestion);
      setSuggestion(null);
    }
  };

  const handleReject = () => {
    setSuggestion(null);
    setError(null);
  };

  if (suggestion) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-medium text-blue-900 dark:text-blue-200">KI-Vorschlag</span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                onClick={handleAccept}
                title="Übernehmen"
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={handleReject}
                title="Verwerfen"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{suggestion}</p>
        </div>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={disabled || !currentMessage.trim() || loading}
            title="Nachricht verbessern"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleImprove('professional')}>
            Professionell
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleImprove('clear')}>
            Klar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleImprove('concise')}>
            Kürzer
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleImprove('formal')}>
            Formell
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
};

