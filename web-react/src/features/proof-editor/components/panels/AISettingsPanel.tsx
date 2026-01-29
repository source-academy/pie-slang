import { useState, useCallback } from 'react';
import { useHintStore } from '../../store';
import { Sparkles, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * AISettingsPanel - Panel for configuring AI-powered hints
 *
 * Features:
 * - Input field for Gemini API key
 * - Toggle to show/hide key
 * - Status indicator for AI availability
 * - Link to get API key
 */
export function AISettingsPanel() {
  const apiKey = useHintStore((s) => s.apiKey);
  const setApiKey = useHintStore((s) => s.setApiKey);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [inputValue, setInputValue] = useState(apiKey || '');

  const handleSaveKey = useCallback(() => {
    const trimmedKey = inputValue.trim();
    setApiKey(trimmedKey || null);
  }, [inputValue, setApiKey]);

  const handleClearKey = useCallback(() => {
    setInputValue('');
    setApiKey(null);
  }, [setApiKey]);

  const hasApiKey = !!apiKey;

  return (
    <div className="border-b bg-card">
      {/* Header - always visible */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className={cn('h-4 w-4', hasApiKey ? 'text-purple-500' : 'text-gray-400')} />
          <span className="font-medium">AI Hints</span>
          {hasApiKey ? (
            <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
              <Check className="h-3 w-3" />
              Enabled
            </span>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
              <AlertCircle className="h-3 w-3" />
              Not configured
            </span>
          )}
        </div>
        <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="border-t px-4 pb-4 pt-3">
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">
              Enter your Google Gemini API key to enable AI-powered hints.
              The AI analyzes your proof goals and suggests appropriate tactics.
            </p>
          </div>

          {/* API Key input */}
          <div className="mb-3">
            <label className="mb-1 block text-sm font-medium">
              Gemini API Key
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  className="w-full rounded-md border bg-background px-3 py-2 pr-10 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="AIza..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleSaveKey}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveKey();
                  }}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {hasApiKey && (
                <button
                  className="rounded-md bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
                  onClick={handleClearKey}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Get API key link */}
          <div className="mb-3">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-purple-600 hover:text-purple-800 hover:underline"
            >
              Get a free Gemini API key →
            </a>
          </div>

          {/* Status */}
          {hasApiKey && (
            <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    AI Hints Active
                  </p>
                  <p className="text-xs text-purple-600">
                    Click the lightbulb on any goal to get AI-powered suggestions.
                    The AI uses Gemini to analyze your proof and suggest tactics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!hasApiKey && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Using Rule-Based Hints
                  </p>
                  <p className="text-xs text-amber-600">
                    Without an API key, hints use simple pattern matching.
                    Add a Gemini API key for smarter, context-aware suggestions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
