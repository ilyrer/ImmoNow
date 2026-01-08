/**
 * AI Summary Generator Component
 * 
 * Fasst Diskussionen zusammen
 * - Diskussion zusammenfassen
 * - Entscheidungen extrahieren
 * - Nächste Schritte auflisten
 * 
 * WICHTIG: Zusammenfassung wird NICHT automatisch gepostet
 */

import React, { useState } from 'react';
import { FileText, Loader2, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AIMessageAssistant, SummaryOptions } from '../../services/aiMessageAssistant.service';
import type { Channel, ChannelMessage } from '../../api/hooks';

interface AISummaryGeneratorProps {
  channel: Channel;
  messages: ChannelMessage[];
  trigger?: React.ReactNode;
}

export const AISummaryGenerator: React.FC<AISummaryGeneratorProps> = ({
  channel,
  messages,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    summary: string;
    decisions?: string[];
    actionItems?: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSummarize = async (focus: SummaryOptions['focus'] = 'discussion') => {
    if (messages.length === 0) {
      setError('Keine Nachrichten zum Zusammenfassen');
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);
    setOpen(true);

    try {
      const result = await AIMessageAssistant.summarizeDiscussion(
        messages.map(m => ({
          content: m.content,
          user_id: m.user_id,
          created_at: m.created_at,
        })),
        {
          name: channel.name,
          topic: channel.topic || undefined,
        },
        { focus }
      );

      setSummary(result);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Zusammenfassen');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!summary) return;

    const text = [
      summary.summary,
      summary.decisions && summary.decisions.length > 0
        ? `\nEntscheidungen:\n${summary.decisions.map(d => `- ${d}`).join('\n')}`
        : '',
      summary.actionItems && summary.actionItems.length > 0
        ? `\nNächste Schritte:\n${summary.actionItems.map(a => `- ${a}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const defaultTrigger = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          title="Zusammenfassen"
        >
          <FileText className="w-3.5 h-3.5 mr-1.5" />
          Zusammenfassen
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleSummarize('discussion')}>
          Diskussion zusammenfassen
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSummarize('decisions')}>
          Entscheidungen extrahieren
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSummarize('action_items')}>
          Nächste Schritte auflisten
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {trigger || defaultTrigger}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Zusammenfassung: {channel.name}</SheetTitle>
            <SheetDescription>
              KI-generierte Zusammenfassung der Diskussion
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  Zusammenfassung wird erstellt...
                </span>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {summary && !loading && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Zusammenfassung
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        Kopiert
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 mr-1.5" />
                        Kopieren
                      </>
                    )}
                  </Button>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
                  <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {summary.summary}
                  </p>
                </div>

                {summary.decisions && summary.decisions.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Entscheidungen
                    </h4>
                    <ul className="space-y-1">
                      {summary.decisions.map((decision, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-900 dark:text-gray-100 flex items-start gap-2"
                        >
                          <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                          <span>{decision}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.actionItems && summary.actionItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nächste Schritte
                    </h4>
                    <ul className="space-y-1">
                      {summary.actionItems.map((item, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-900 dark:text-gray-100 flex items-start gap-2"
                        >
                          <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Diese Zusammenfassung wurde von der KI generiert und wurde nicht automatisch im Chat gepostet.
                    Du kannst sie kopieren und manuell verwenden.
                  </p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

