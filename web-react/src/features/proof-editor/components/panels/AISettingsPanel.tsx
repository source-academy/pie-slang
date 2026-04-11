import { useState, useCallback, useEffect } from 'react';
import { useHintStore } from '../../store';
import { Sparkles, Eye, EyeOff, Check, AlertCircle, Cpu } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

/**
 * AISettingsPanel - Panel for configuring AI-powered hints
 *
 * Features:
 * - Input field for Gemini API key
 * - Input field for local LoRA model server URL
 * - Health check indicator for local model
 * - Status indicator for AI availability
 */
export function AISettingsPanel() {
  const apiKey = useHintStore((s) => s.apiKey);
  const setApiKey = useHintStore((s) => s.setApiKey);
  const loraServerUrl = useHintStore((s) => s.loraServerUrl);
  const setLoraServerUrl = useHintStore((s) => s.setLoraServerUrl);

  const [isExpanded, setIsExpanded] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [inputValue, setInputValue] = useState(apiKey || '');
  const [loraInput, setLoraInput] = useState(loraServerUrl || 'http://localhost:8000');
  const [loraHealth, setLoraHealth] = useState<'unknown' | 'checking' | 'ok' | 'error'>('unknown');

  const handleSaveKey = useCallback(() => {
    const trimmedKey = inputValue.trim();
    setApiKey(trimmedKey || null);
  }, [inputValue, setApiKey]);

  const handleClearKey = useCallback(() => {
    setInputValue('');
    setApiKey(null);
  }, [setApiKey]);

  const handleSaveLoraUrl = useCallback(() => {
    const trimmed = loraInput.trim();
    setLoraServerUrl(trimmed || null);
    if (trimmed) {
      checkLoraHealth(trimmed);
    } else {
      setLoraHealth('unknown');
    }
  }, [loraInput, setLoraServerUrl]);

  const handleClearLoraUrl = useCallback(() => {
    setLoraInput('');
    setLoraServerUrl(null);
    setLoraHealth('unknown');
  }, [setLoraServerUrl]);

  const checkLoraHealth = useCallback(async (url: string) => {
    setLoraHealth('checking');
    try {
      const resp = await fetch(`${url.replace(/\/+$/, '')}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      if (resp.ok) {
        setLoraHealth('ok');
      } else {
        setLoraHealth('error');
      }
    } catch {
      setLoraHealth('error');
    }
  }, []);

  // Check health on mount if URL is set
  useEffect(() => {
    if (loraServerUrl) {
      checkLoraHealth(loraServerUrl);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasApiKey = !!apiKey;
  const hasLoraUrl = !!loraServerUrl;

  return (
    <div className="border-b bg-card">
      {/* Header - always visible */}
      <div
        className="flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className={cn('h-4 w-4', (hasApiKey || hasLoraUrl) ? 'text-purple-500' : 'text-gray-400')} />
          <span className="font-medium">AI Hints</span>
          {hasLoraUrl && loraHealth === 'ok' ? (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              <Cpu className="h-3 w-3" />
              Local Model
            </span>
          ) : hasApiKey ? (
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
              Configure AI-powered hints. The local model predicts tactics accurately,
              and Gemini explains them educationally.
            </p>
          </div>

          {/* Local Model URL */}
          <div className="mb-4">
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
              <Cpu className="h-3.5 w-3.5" />
              Local Model Server
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="http://localhost:8000"
                  value={loraInput}
                  onChange={(e) => setLoraInput(e.target.value)}
                  onBlur={handleSaveLoraUrl}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLoraUrl();
                  }}
                />
                {/* Health indicator */}
                <span className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full',
                  loraHealth === 'ok' && 'bg-green-500',
                  loraHealth === 'error' && 'bg-red-500',
                  loraHealth === 'checking' && 'bg-yellow-500 animate-pulse',
                  loraHealth === 'unknown' && 'bg-gray-300',
                )} />
              </div>
              {hasLoraUrl && (
                <button
                  className="rounded-md bg-gray-200 px-3 py-2 text-sm hover:bg-gray-300"
                  onClick={handleClearLoraUrl}
                >
                  Clear
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Run <code className="rounded bg-gray-100 px-1">python training/serve.py --adapter &lt;path&gt;</code> to start
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
              Get a free Gemini API key ���
            </a>
          </div>

          {/* Status */}
          {hasLoraUrl && loraHealth === 'ok' && hasApiKey && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3">
              <div className="flex items-start gap-2">
                <Cpu className="mt-0.5 h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Local Model + AI Explanation Active
                  </p>
                  <p className="text-xs text-green-600">
                    The local model predicts the correct tactic, then Gemini explains
                    it educationally at each hint level.
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasLoraUrl && loraHealth === 'ok' && !hasApiKey && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3">
              <div className="flex items-start gap-2">
                <Cpu className="mt-0.5 h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Local Model Active (no explanation)
                  </p>
                  <p className="text-xs text-green-600">
                    Tactic predictions are powered by the local model.
                    Add a Gemini API key for educational explanations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasLoraUrl && loraHealth === 'error' && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Local Model Unreachable
                  </p>
                  <p className="text-xs text-red-600">
                    Cannot connect to {loraServerUrl}. Is the server running?
                  </p>
                </div>
              </div>
            </div>
          )}

          {!hasLoraUrl && hasApiKey && (
            <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-sm font-medium text-purple-800">
                    Gemini-Only Hints Active
                  </p>
                  <p className="text-xs text-purple-600">
                    Using Gemini for both prediction and explanation.
                    Add a local model server for more accurate tactic predictions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!hasLoraUrl && !hasApiKey && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Using Rule-Based Hints
                  </p>
                  <p className="text-xs text-amber-600">
                    Without a model server or API key, hints use simple pattern matching.
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
